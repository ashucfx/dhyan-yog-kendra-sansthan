import { signOutAdminSession } from "@/lib/admin-rbac";

export async function POST(request: Request) {
  await signOutAdminSession();
  return Response.redirect(new URL("/admin/sign-in", request.url), 303);
}
