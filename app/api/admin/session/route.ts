import { getAdminUser } from "@/lib/admin-rbac";
import { assertRateLimit } from "@/lib/rate-limit";

export async function GET(request: Request) {
  try {
    assertRateLimit(request, { key: "admin-session", limit: 30, windowMs: 60_000 });

    const admin = await getAdminUser();
    if (!admin) {
      return Response.json({ message: "Unauthorized." }, { status: 401 });
    }

    return Response.json({ admin }, { status: 200 });
  } catch (error) {
    return Response.json(
      { message: error instanceof Error ? error.message : "Unable to load admin session." },
      { status: 500 }
    );
  }
}
