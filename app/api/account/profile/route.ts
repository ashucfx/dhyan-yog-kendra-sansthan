import { getAuthenticatedUser } from "@/lib/auth-user";
import { getUserProfile, upsertUserProfile } from "@/lib/commerce";

export async function GET() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ message: "Please sign in to access your account." }, { status: 401 });
  }

  const profile = await getUserProfile(user.id, {
    email: user.email,
    name: user.name,
    phone: user.phone
  });
  return Response.json({ profile }, { status: 200 });
}

export async function PUT(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return Response.json({ message: "Please sign in to update your account." }, { status: 401 });
  }

  const payload = (await request.json()) as { fullName?: string; phone?: string };
  const profile = await upsertUserProfile({
    userId: user.id,
    email: user.email,
    fullName: payload.fullName ?? "",
    phone: payload.phone ?? ""
  });
  return Response.json({ message: "Profile updated successfully.", profile }, { status: 200 });
}
