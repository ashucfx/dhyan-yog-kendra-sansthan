import { getAuthenticatedUser } from "@/lib/auth-user";
import { validateCouponForSubtotal, describeCouponDiscount } from "@/lib/commerce-pricing";
import { assertRateLimit } from "@/lib/rate-limit";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

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

    // Look up coupon directly from Supabase when available, fall back to snapshot
    const supabase = getSupabaseServiceClient();
    const db = supabase as any;

    let coupon = null;

    if (db) {
      const { data } = await db
        .from("coupons")
        .select(
          "id, code, description, discount_type, discount_value, minimum_order_amount, usage_limit, usage_count, max_discount_amount, per_user_limit, active, starts_at, ends_at"
        )
        .eq("code", code)
        .maybeSingle();

      if (data) {
        coupon = {
          id: data.id as string,
          code: data.code as string,
          description: (data.description as string) ?? "",
          discountType: data.discount_type as "percent" | "flat",
          discountValue: data.discount_value as number,
          minimumOrderAmount: data.minimum_order_amount as number,
          usageLimit: (data.usage_limit as number | null) ?? null,
          usageCount: (data.usage_count as number) ?? 0,
          maxDiscountAmount: (data.max_discount_amount as number | null) ?? null,
          perUserLimit: (data.per_user_limit as number | null) ?? null,
          active: data.active as boolean,
          startsAt: (data.starts_at as string | null) ?? undefined,
          endsAt: (data.ends_at as string | null) ?? undefined
        };
      }
    } else {
      // Fallback to snapshot (local dev without Supabase)
      const { loadCommerceSnapshot } = await import("@/lib/commerce");
      const snapshot = await loadCommerceSnapshot();
      coupon = snapshot.coupons.find((item) => item.code === code) ?? null;
    }

    // Core validation (active, dates, global usage limit, minimum order)
    const result = validateCouponForSubtotal(coupon, subtotal);

    if (!result.valid || !result.coupon) {
      return Response.json(
        { valid: false, message: result.reason || "Coupon is not valid." },
        { status: 400 }
      );
    }

    // Per-user limit check — only when user is authenticated and Supabase is available
    if (result.coupon.perUserLimit && result.coupon.perUserLimit > 0 && db) {
      const user = await getAuthenticatedUser();
      if (user) {
        const { count } = await db
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("coupon_code", code)
          .eq("payment_status", "captured");

        const usedCount = (count as number) ?? 0;
        if (usedCount >= result.coupon.perUserLimit) {
          return Response.json(
            {
              valid: false,
              message: `You have already used this coupon the maximum number of times (${result.coupon.perUserLimit}).`
            },
            { status: 400 }
          );
        }
      }
    }

    return Response.json(
      {
        valid: true,
        message: "Coupon applied successfully.",
        discount: result.discount,
        discountLabel: describeCouponDiscount(result.coupon),
        coupon: {
          code: result.coupon.code,
          description: result.coupon.description,
          discountType: result.coupon.discountType,
          discountValue: result.coupon.discountValue,
          maxDiscountAmount: result.coupon.maxDiscountAmount ?? null
        }
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
