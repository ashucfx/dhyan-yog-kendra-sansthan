import { getAuthenticatedUser } from "@/lib/auth-user";
import { getOrderDetailForUser, updateOrderPaymentStatus } from "@/lib/commerce";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, { key: "mock-payment-confirm", limit: 6, windowMs: 60_000 });

    if (process.env.NODE_ENV === "production") {
      return Response.json({ message: "Mock payment confirmation is disabled in production." }, { status: 403 });
    }

    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ message: "Please sign in before confirming payment." }, { status: 401 });
    }

    const { orderId } = (await request.json()) as { orderId?: string };

    if (!orderId) {
      return Response.json({ message: "Order id is required." }, { status: 400 });
    }

    const orderDetail = await getOrderDetailForUser(user.id, orderId);
    if (!orderDetail) {
      return Response.json({ message: "Order not found for this account." }, { status: 404 });
    }

    await updateOrderPaymentStatus({
      orderId,
      paymentStatus: "captured",
      status: "paid",
      expectedProvider: orderDetail.order.paymentProvider === "PayPal" ? "PayPal" : "Razorpay",
      paymentReference: {
        provider: "Mock",
        externalPaymentId: "mock-payment",
        mode: "mock",
        verifiedAt: new Date().toISOString()
      }
    });
    return Response.json({ message: "Mock payment confirmed successfully." }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to confirm payment." },
      { status: 500 }
    );
  }
}
