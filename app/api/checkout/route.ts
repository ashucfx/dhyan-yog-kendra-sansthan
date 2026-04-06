import { createCommerceOrder, setOrderPaymentReference } from "@/lib/commerce";
import { createPayPalOrder, createRazorpayOrder } from "@/lib/commerce-integrations";
import { validateEmail, validateIndianMobile } from "@/lib/customer-validation";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, { key: "checkout", limit: 12, windowMs: 60_000 });

    const user = await getAuthenticatedUser();
    if (!user) {
      return Response.json({ message: "Please sign in before checkout." }, { status: 401 });
    }

    const payload = (await request.json()) as Parameters<typeof createCommerceOrder>[0];

    if (!payload.customerName || !payload.customerEmail || !payload.customerPhone || !payload.items?.length) {
      return Response.json({ message: "Customer details and order items are required." }, { status: 400 });
    }

    if (payload.paymentProvider !== "Razorpay" && payload.paymentProvider !== "PayPal") {
      return Response.json({ message: "Select a valid payment provider." }, { status: 400 });
    }

    if (!validateEmail(payload.customerEmail)) {
      return Response.json({ message: "Please enter a valid email address." }, { status: 400 });
    }

    if (!validateIndianMobile(payload.customerPhone)) {
      return Response.json({ message: "Please enter a valid mobile number." }, { status: 400 });
    }

    const result = await createCommerceOrder({
      ...payload,
      userId: user.id
    });
    const origin = new URL(request.url).origin;

    if (payload.paymentProvider === "Razorpay") {
      const gatewayOrder = await createRazorpayOrder(result.order.total * 100, result.order.id);
      if (gatewayOrder) {
        await setOrderPaymentReference(result.order.id, {
          provider: "Razorpay",
          externalOrderId: gatewayOrder.id,
          mode: "gateway"
        });
      }

      return Response.json(
        {
          message: "Order created successfully.",
          order: result.order,
          orderItems: result.orderItems,
          gateway: gatewayOrder
            ? {
                provider: "Razorpay",
                keyId: process.env.RAZORPAY_KEY_ID,
                orderId: gatewayOrder.id,
                amount: gatewayOrder.amount,
                currency: gatewayOrder.currency
              }
            : {
                provider: "Razorpay",
                mock: true,
                orderId: result.order.id,
                amount: result.order.total * 100,
                currency: "INR"
              }
        },
        { status: 201 }
      );
    }

    const paypalOrder = await createPayPalOrder({
      orderId: result.order.id,
      total: Number((result.order.total / 85).toFixed(2)),
      currencyCode: "USD",
      returnUrl: `${origin}/checkout?internal_order=${result.order.id}`,
      cancelUrl: `${origin}/checkout?internal_order=${result.order.id}&paypal_cancel=1`
    });

    if (paypalOrder) {
      await setOrderPaymentReference(result.order.id, {
        provider: "PayPal",
        externalOrderId: paypalOrder.id,
        mode: "gateway"
      });
    }

    return Response.json(
      {
        message: "Order created successfully.",
        order: result.order,
        orderItems: result.orderItems,
        gateway: paypalOrder
          ? {
              provider: "PayPal",
              orderId: paypalOrder.id,
              status: paypalOrder.status,
              approveLink: paypalOrder.links?.find((link) => link.rel === "approve")?.href ?? ""
            }
          : {
              provider: "PayPal",
              mock: true,
              orderId: result.order.id
            }
      },
      { status: 201 }
    );
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to create order." },
      { status: 500 }
    );
  }
}
