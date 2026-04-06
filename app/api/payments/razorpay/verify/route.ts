import { getAuthenticatedUser } from "@/lib/auth-user";
import { getOrderDetailForUser, updateOrderPaymentStatus } from "@/lib/commerce";
import { verifyRazorpayPaymentSignature } from "@/lib/commerce-integrations";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, { key: "razorpay-verify", limit: 10, windowMs: 60_000 });

    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ message: "Please sign in before confirming payment." }, { status: 401 });
    }

    const payload = (await request.json()) as {
      internalOrderId?: string;
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    };

    if (!payload.internalOrderId || !payload.razorpayOrderId || !payload.razorpayPaymentId || !payload.razorpaySignature) {
      return Response.json({ message: "Missing Razorpay verification fields." }, { status: 400 });
    }

    const orderDetail = await getOrderDetailForUser(user.id, payload.internalOrderId);
    if (!orderDetail) {
      return Response.json({ message: "Order not found for this account." }, { status: 404 });
    }

    const valid = verifyRazorpayPaymentSignature({
      orderId: payload.razorpayOrderId,
      paymentId: payload.razorpayPaymentId,
      signature: payload.razorpaySignature
    });

    if (!valid) {
      return Response.json({ message: "Razorpay signature verification failed." }, { status: 400 });
    }

    await updateOrderPaymentStatus({
      orderId: payload.internalOrderId,
      paymentStatus: "captured",
      status: "paid",
      expectedProvider: "Razorpay",
      expectedExternalOrderId: payload.razorpayOrderId,
      paymentReference: {
        provider: "Razorpay",
        externalOrderId: payload.razorpayOrderId,
        externalPaymentId: payload.razorpayPaymentId,
        mode: "gateway",
        verifiedAt: new Date().toISOString()
      }
    });

    return Response.json({ message: "Payment verified successfully." }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to verify payment." },
      { status: 500 }
    );
  }
}
