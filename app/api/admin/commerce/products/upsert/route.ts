import { assertAdminUser } from "@/lib/admin-rbac";
import { upsertProduct } from "@/lib/commerce";

export async function POST(request: Request) {
  try {
    await assertAdminUser();
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as Parameters<typeof upsertProduct>[0];
    const product = await upsertProduct(payload);
    return Response.json({ message: "Product saved successfully.", product }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to save product." },
      { status: 400 }
    );
  }
}
