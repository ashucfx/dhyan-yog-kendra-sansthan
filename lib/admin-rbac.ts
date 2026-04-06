import { redirect } from "next/navigation";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type AdminRole = "admin" | "super_admin";

export type AdminUser = {
  id: string;
  email: string;
  role: AdminRole;
  status: "active" | "disabled";
};

async function fetchAdminRecord(userId: string) {
  const supabase = getSupabaseServiceClient();
  if (!supabase) {
    throw new Error("Supabase service role is required for RBAC admin access.");
  }

  const { data, error } = await supabase
    .from("admin_users")
    .select("id, role, status, profiles(email)")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as {
    id: string;
    role: AdminRole;
    status: "active" | "disabled";
    profiles?: { email?: string } | { email?: string }[] | null;
  };

  return {
    id: row.id,
    email: Array.isArray(row.profiles) ? "" : row.profiles?.email ?? "",
    role: row.role,
    status: row.status
  } satisfies AdminUser;
}

export async function getAdminUser() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return null;
  }

  const admin = await fetchAdminRecord(user.id);
  if (!admin || admin.status !== "active") {
    return null;
  }

  return {
    ...admin,
    email: admin.email || user.email
  } satisfies AdminUser;
}

export async function requireAdminUser(options?: {
  redirectTo?: string;
  minimumRole?: AdminRole;
}) {
  const redirectTo = options?.redirectTo ?? "/admin/sign-in";
  const admin = await getAdminUser();
  if (!admin) {
    redirect(redirectTo);
  }

  if (options?.minimumRole === "super_admin" && admin.role !== "super_admin") {
    redirect("/admin/sign-in?error=forbidden");
  }

  return admin;
}

export async function assertAdminUser(minimumRole: AdminRole = "admin") {
  const admin = await getAdminUser();
  if (!admin) {
    throw new Error("Unauthorized.");
  }

  if (minimumRole === "super_admin" && admin.role !== "super_admin") {
    throw new Error("Forbidden.");
  }

  return admin;
}

export async function signOutAdminSession() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return;
  }

  await supabase.auth.signOut();
}

export async function isAdminRouteAuthorized() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return { authenticated: false, authorized: false };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { authenticated: false, authorized: false };
  }

  const admin = await fetchAdminRecord(user.id);
  return {
    authenticated: true,
    authorized: Boolean(admin && admin.status === "active"),
    role: admin?.role
  };
}
