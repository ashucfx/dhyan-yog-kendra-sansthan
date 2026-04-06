import { assertAdminUser } from "@/lib/admin-rbac";
import { upsertOffer } from "@/lib/commerce";

export async function POST(request: Request) {
  try {
    await assertAdminUser();
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Unauthorized." }, { status: 401 });
  }

  try {
    const payload = (await request.json()) as Parameters<typeof upsertOffer>[0];
    const offer = await upsertOffer(payload);
    return Response.json({ message: "Offer saved successfully.", offer }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to save offer." },
      { status: 400 }
    );
  }
}
