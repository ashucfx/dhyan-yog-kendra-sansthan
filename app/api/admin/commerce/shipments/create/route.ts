import { assertAdminUser } from "@/lib/admin-rbac";
import { createShipmentRecord, updateOrderFulfillment } from "@/lib/commerce";
import { createShadowfaxShipment, isShadowfaxOrderConfigured } from "@/lib/commerce-shipping";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function POST(request: Request) {
  try {
    await assertAdminUser();
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Unauthorized." }, { status: 401 });
  }

  const { orderId } = (await request.json()) as { orderId?: string };
  if (!orderId) {
    return Response.json({ message: "Order ID is required." }, { status: 400 });
  }

  // Load order — prefer Supabase, fall back to local snapshot
  const supabase = getSupabaseServiceClient();
  let order: {
    id: string;
    customer_name: string;
    customer_phone: string | null;
    shipping_address: Record<string, unknown>;
    total: number;
    payment_status: string;
  } | null = null;

  if (supabase) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const { data, error } = await db
      .from("orders")
      .select("id, customer_name, customer_phone, shipping_address, total, payment_status")
      .eq("id", orderId)
      .single();

    if (error || !data) {
      return Response.json({ message: "Order not found." }, { status: 404 });
    }

    if (data.payment_status !== "captured") {
      return Response.json({ message: "Cannot dispatch an unpaid order." }, { status: 400 });
    }

    // Prevent duplicate shipment creation
    const { data: existing } = await db
      .from("shipments")
      .select("id, awb")
      .eq("order_id", orderId)
      .not("awb", "is", null)
      .maybeSingle();

    if (existing?.awb) {
      return Response.json({ message: "Shipment already exists for this order.", shipment: existing }, { status: 409 });
    }

    order = {
      id: data.id,
      customer_name: data.customer_name,
      customer_phone: data.customer_phone,
      shipping_address: (data.shipping_address ?? {}) as Record<string, unknown>,
      total: data.total,
      payment_status: data.payment_status
    };
  } else {
    // Local snapshot fallback
    const { loadCommerceSnapshot } = await import("@/lib/commerce");
    const snapshot = await loadCommerceSnapshot();
    const found = snapshot.orders.find((o) => o.id === orderId);
    if (!found) {
      return Response.json({ message: "Order not found." }, { status: 404 });
    }
    if (found.paymentStatus !== "captured") {
      return Response.json({ message: "Cannot dispatch an unpaid order." }, { status: 400 });
    }
    order = {
      id: found.id,
      customer_name: found.customerName,
      customer_phone: found.customerPhone ?? null,
      shipping_address: (found.shippingAddress ?? {}) as Record<string, unknown>,
      total: found.total,
      payment_status: found.paymentStatus
    };
  }

  const address = order.shipping_address;

  try {
    let awb: string;
    let trackingUrl: string;
    let partner: string;
    let shipmentStatus: string;
    let pickupScheduledAt: string | undefined;
    let labelUrl: string | undefined;

    if (isShadowfaxOrderConfigured()) {
      const result = await createShadowfaxShipment({
        orderId: order.id,
        customerName: order.customer_name,
        customerPhone: order.customer_phone ?? "",
        postalCode: String(address.postalCode ?? address.postal_code ?? ""),
        city: String(address.city ?? ""),
        state: String(address.state ?? ""),
        addressLine1: String(address.line1 ?? ""),
        declaredValue: order.total
      });

      awb = result.awb ?? `SFX-${Date.now()}`;
      trackingUrl = result.trackingUrl ?? "https://www.shadowfax.in/tracking";
      labelUrl = result.labelUrl;
      pickupScheduledAt = result.pickupScheduledAt;
      partner = "Shadowfax";
      shipmentStatus = result.awb ? "pickup_scheduled" : "requested";
    } else {
      // No courier configured — create a manual record for ops to handle
      awb = `MANUAL-${Date.now()}`;
      trackingUrl = "";
      partner = "Manual dispatch";
      shipmentStatus = "created";
    }

    const shipment = await createShipmentRecord(order.id, partner, awb, trackingUrl, shipmentStatus);

    // Store label URL and pickup time if Supabase is available
    if (supabase && (labelUrl || pickupScheduledAt)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any)
        .from("shipments")
        .update({
          label_url: labelUrl ?? null,
          pickup_scheduled_at: pickupScheduledAt ?? null,
          updated_at: new Date().toISOString()
        })
        .eq("id", shipment.id);
    }

    await updateOrderFulfillment(order.id, shipmentStatus === "created" ? "processing" : "dispatched");

    return Response.json(
      {
        message: partner === "Manual dispatch"
          ? "Manual shipment record created. Assign a courier in your logistics tool."
          : "Shipment created and submitted to Shadowfax.",
        shipment: { ...shipment, labelUrl, pickupScheduledAt }
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to create shipment." },
      { status: 500 }
    );
  }
}
