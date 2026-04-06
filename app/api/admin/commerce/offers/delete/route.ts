import { assertAdminUser } from "@/lib/admin-rbac";
import { deleteOffer } from "@/lib/commerce";

export async function POST(request: Request) {
  try {
    await assertAdminUser();
  } catch (error) {
    return Response.json({ message: error instanceof Error ? error.message : "Unauthorized." }, { status: 401 });
  }

  const { id } = (await request.json()) as { id?: string };
  if (!id) {
    return Response.json({ message: "Offer id is required." }, { status: 400 });
  }

  try {
    await deleteOffer(id);
    return Response.json({ message: "Offer deleted successfully." }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to delete offer." },
      { status: 500 }
    );
  }
}
