import { isAdminKeyConfigured, setAdminSession, validateAdminPassword } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const formData = await request.formData();
  const password = String(formData.get("password") || "").trim();
  const redirectTo = String(formData.get("redirectTo") || "/admin/submissions");

  if (!isAdminKeyConfigured()) {
    return Response.redirect(new URL(`/admin/submissions?error=config`, request.url), 303);
  }

  if (!validateAdminPassword(password)) {
    return Response.redirect(new URL(`/admin/submissions?error=invalid`, request.url), 303);
  }

  await setAdminSession();
  return Response.redirect(new URL(redirectTo, request.url), 303);
}
