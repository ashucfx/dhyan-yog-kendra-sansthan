import { SiteShell } from "@/app/components/site-shell";
import { getAdminUser } from "@/lib/admin-rbac";
import { redirect } from "next/navigation";
import { AdminSignInClient } from "./sign-in-client";

export default async function AdminSignInPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; redirectTo?: string }>;
}) {
  const admin = await getAdminUser();
  const resolvedSearchParams = await searchParams;

  if (admin) {
    redirect(resolvedSearchParams.redirectTo?.startsWith("/admin") ? resolvedSearchParams.redirectTo : "/admin");
  }

  return (
    <SiteShell>
      <main className="admin-page">
        <section className="admin-card admin-auth-card">
          <p className="eyebrow">Admin sign in</p>
          <h1>Secure access for operations</h1>
          <p className="admin-copy">
            Sign in with your assigned admin account. Access is controlled by Supabase Auth and role-based records in
            the admin users table.
          </p>
          <AdminSignInClient
            redirectTo={resolvedSearchParams.redirectTo}
            initialError={resolvedSearchParams.error ?? ""}
          />
        </section>
      </main>
    </SiteShell>
  );
}
