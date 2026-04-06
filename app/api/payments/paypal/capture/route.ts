import { getAuthenticatedUser } from "@/lib/auth-user";
import { getOrderDetailForUser, updateOrderPaymentStatus } from "@/lib/commerce";
import { capturePayPalOrder } from "@/lib/commerce-integrations";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, { key: "paypal-capture", limit: 10, windowMs: 60_000 });

    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ message: "Please sign in before confirming payment." }, { status: 401 });
    }

    const payload = (await request.json()) as {
      internalOrderId?: string;
      paypalOrderId?: string;
    };

    if (!payload.internalOrderId || !payload.paypalOrderId) {
      return Response.json({ message: "Missing PayPal capture fields." }, { status: 400 });
    }

    const orderDetail = await getOrderDetailForUser(user.id, payload.internalOrderId);
    if (!orderDetail) {
      return Response.json({ message: "Order not found for this account." }, { status: 404 });
    }

    const capture = await capturePayPalOrder(payload.paypalOrderId);

    if (!capture) {
      await updateOrderPaymentStatus({
        orderId: payload.internalOrderId,
        paymentStatus: "captured",
        status: "paid",
        expectedProvider: "PayPal",
        expectedExternalOrderId: payload.paypalOrderId,
        paymentReference: {
          provider: "Mock",
          externalOrderId: payload.paypalOrderId,
          externalPaymentId: payload.paypalOrderId,
          mode: "mock",
          verifiedAt: new Date().toISOString()
        }
      });
      return Response.json({ message: "Mock PayPal payment captured successfully." }, { status: 200 });
    }

    await updateOrderPaymentStatus({
      orderId: payload.internalOrderId,
      paymentStatus: "captured",
      status: "paid",
      expectedProvider: "PayPal",
      expectedExternalOrderId: payload.paypalOrderId,
      paymentReference: {
        provider: "PayPal",
        externalOrderId: payload.paypalOrderId,
        externalPaymentId: capture.id,
        mode: "gateway",
        verifiedAt: new Date().toISOString()
      }
    });
    return Response.json(
      {
        message: "PayPal payment captured successfully.",
        captureId: capture.id,
        status: capture.status
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to capture PayPal payment." },
      { status: 500 }
    );
  }
}
