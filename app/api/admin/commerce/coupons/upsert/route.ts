import { assertAdminUser } from "@/lib/admin-rbac";
import { upsertCoupon } from "@/lib/commerce";

export async function POST(request: Request) {
  try {
    await assertAdminUser();
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as Parameters<typeof upsertCoupon>[0];
    const coupon = await upsertCoupon(payload);
    return Response.json({ message: "Coupon saved successfully.", coupon }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to save coupon." },
      { status: 400 }
    );
  }
}
