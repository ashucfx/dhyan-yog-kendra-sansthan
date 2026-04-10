import { getAuthenticatedUser } from "@/lib/auth-user";
import { getShadowfaxTrackingStatus, isShadowfaxTrackConfigured } from "@/lib/commerce-shipping";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ message: "Authentication required." }, { status: 401 });
    }

    const { orderId } = await params;
    if (!orderId?.trim()) {
      return Response.json({ message: "Order ID is required." }, { status: 400 });
    }

    const supabase = getSupabaseServiceClient();
    if (!supabase) {
      return Response.json({ message: "Database is not configured." }, { status: 503 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;

    // Verify the order belongs to this user
    const { data: order, error: orderError } = await db
      .from("orders")
      .select("id, fulfillment_status")
      .eq("id", orderId)
      .eq("user_id", user.id)
      .single();

    if (orderError || !order) {
      return Response.json({ message: "Order not found." }, { status: 404 });
    }

    // Load all shipment records for this order, newest first
    const { data: shipments } = await db
      .from("shipments")
      .select("id, partner, awb, status, tracking_url, label_url, pickup_scheduled_at, created_at, updated_at")
      .eq("order_id", orderId)
      .order("created_at", { ascending: false });

    if (!shipments?.length) {
      return Response.json({
        orderId,
        fulfillmentStatus: order.fulfillment_status,
        shipments: [],
        message: "Your order is being prepared. Tracking will be available once it is dispatched."
      });
    }

    const latest = shipments[0];

    // No AWB yet or live tracking not configured — return stored data
    if (!latest.awb || !isShadowfaxTrackConfigured()) {
      return Response.json({
        orderId,
        fulfillmentStatus: order.fulfillment_status,
        shipments,
        message: latest.awb
          ? "Live tracking is not configured. Contact support for the latest status."
          : "Shipment is booked — tracking number will be assigned shortly."
      });
    }

    // Live tracking call
    try {
      const tracking = await getShadowfaxTrackingStatus(latest.awb);

      // Persist updated status if it changed
      if (tracking.status !== latest.status) {
        await db
          .from("shipments")
          .update({ status: tracking.status, updated_at: new Date().toISOString() })
          .eq("id", latest.id);
      }

      return Response.json({
        orderId,
        fulfillmentStatus: order.fulfillment_status,
        shipments,
        tracking
      });
    } catch {
      // Live call failed — return stored data without error
      return Response.json({
        orderId,
        fulfillmentStatus: order.fulfillment_status,
        shipments,
        message: "Live tracking is temporarily unavailable. Your last known status is shown."
      });
    }
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to fetch tracking status." },
      { status: 500 }
    );
  }
}
