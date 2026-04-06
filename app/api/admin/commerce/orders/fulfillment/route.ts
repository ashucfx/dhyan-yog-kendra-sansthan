import { assertAdminUser } from "@/lib/admin-rbac";
import { updateOrderFulfillment } from "@/lib/commerce";

export async function POST(request: Request) {
  try {
    await assertAdminUser();
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Unauthorized." }, { status: 401 });
  }

  const { orderId, fulfillmentStatus } = (await request.json()) as { orderId?: string; fulfillmentStatus?: string };

  if (!orderId || !fulfillmentStatus) {
    return Response.json({ message: "Order id and fulfillment status are required." }, { status: 400 });
  }

  try {
    await updateOrderFulfillment(orderId, fulfillmentStatus);
    return Response.json({ message: "Order fulfillment updated successfully." }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to update fulfillment status." },
      { status: 500 }
    );
  }
}
