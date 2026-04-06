import { assertAdminUser } from "@/lib/admin-rbac";
import { createShipmentRecord, loadCommerceSnapshot } from "@/lib/commerce";
import { createShiprocketShipment } from "@/lib/commerce-integrations";

export async function POST(request: Request) {
  try {
    await assertAdminUser();
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Unauthorized." }, { status: 401 });
  }

  const { orderId } = (await request.json()) as { orderId?: string };
  if (!orderId) {
    return Response.json({ message: "Order id is required." }, { status: 400 });
  }

  const snapshot = await loadCommerceSnapshot();
  const order = snapshot.orders.find((item) => item.id === orderId);
  if (!order) {
    return Response.json({ message: "Order was not found." }, { status: 404 });
  }

  try {
    const shiprocketPayload =
      order.shippingAddress && order.customerPhone
        ? {
            order_id: order.id,
            order_date: order.createdAt,
            pickup_location: "Primary",
            billing_customer_name: order.customerName,
            billing_last_name: "",
            billing_address: order.shippingAddress.line1,
            billing_city: order.shippingAddress.city,
            billing_pincode: order.shippingAddress.postalCode,
            billing_state: order.shippingAddress.state,
            billing_country: order.shippingAddress.country,
            billing_email: order.customerEmail,
            billing_phone: order.customerPhone,
            shipping_is_billing: true,
            order_items: snapshot.orderItems
              .filter((item) => item.orderId === order.id)
              .map((item) => ({
                name: item.productName,
                sku: item.sku,
                units: item.quantity,
                selling_price: item.unitPrice
              })),
            payment_method: order.paymentProvider,
            sub_total: order.subtotal,
            length: 10,
            breadth: 10,
            height: 10,
            weight: 0.5
          }
        : null;

    const shiprocketResponse = shiprocketPayload ? await createShiprocketShipment(shiprocketPayload) : null;
    const awb =
      typeof shiprocketResponse?.awb_code === "string"
        ? shiprocketResponse.awb_code
        : `MANUAL-${Math.floor(Math.random() * 1000000)}`;

    const shipment = await createShipmentRecord(
      order.id,
      shiprocketResponse ? "Shiprocket" : "Manual dispatch",
      awb,
      "https://www.shiprocket.in/shipment-tracking/",
      shiprocketResponse ? "pickup_scheduled" : "created"
    );

    return Response.json(
      {
        message: shiprocketResponse ? "Shipment created and pushed to Shiprocket." : "Manual shipment record created.",
        shipment
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to create shipment." },
      { status: 500 }
    );
  }
}
