import { loadCommerceSnapshot } from "@/lib/commerce";
import { validateCouponForSubtotal } from "@/lib/commerce-pricing";
import { assertRateLimit } from "@/lib/rate-limit";

export async function POST(request: Request) {
  try {
    assertRateLimit(request, { key: "coupon-validate", limit: 20, windowMs: 60_000 });

    const payload = (await request.json()) as {
      code?: string;
      subtotal?: number;
    };

    const code = payload.code?.trim().toUpperCase();
    const subtotal = Number(payload.subtotal ?? 0);

    if (!code) {
      return Response.json({ message: "Coupon code is required." }, { status: 400 });
    }

    const snapshot = await loadCommerceSnapshot();
    const coupon = snapshot.coupons.find((item) => item.code === code) ?? null;
    const result = validateCouponForSubtotal(coupon, subtotal);

    if (!result.valid || !result.coupon) {
      return Response.json(
        {
          valid: false,
          message: result.reason || "Coupon is not valid."
        },
        { status: 400 }
      );
    }

    return Response.json(
      {
        valid: true,
        message: "Coupon applied successfully.",
        coupon: result.coupon,
        discount: result.discount
      },
      { status: 200 }
    );
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to validate coupon." },
      { status: 500 }
    );
  }
}
