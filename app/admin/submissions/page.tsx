import Link from "next/link";
import { Suspense } from "react";
import { requireAdminUser } from "@/lib/admin-rbac";
import { getStorageLabel, listSubmissions } from "@/lib/submissions";
import { DashboardClient } from "./dashboard-client";

export default async function AdminSubmissionsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  await searchParams;
  const admin = await requireAdminUser({ redirectTo: "/admin/sign-in?redirectTo=/admin/submissions" });

  let submissions = [] as Awaited<ReturnType<typeof listSubmissions>>;
  let dashboardError = "";
  const storageLabel = getStorageLabel();

  try {
    submissions = await listSubmissions();
  } catch (error) {
    dashboardError = error instanceof Error ? error.message : "Unable to load submissions.";
  }

  return (
    <main className="admin-page">
      <section className="admin-shell">
        <div className="admin-actions">
          <span className="entity-chip">Signed in as {admin.email} ({admin.role})</span>
          <Link className="button button-secondary button-small" href="/admin">
            Commerce dashboard
          </Link>
        </div>
        <Suspense fallback={<div className="loading-state">Loading submissions...</div>}>
          <DashboardClient initialSubmissions={submissions} storageLabel={storageLabel} initialError={dashboardError} />
        </Suspense>
      </section>
    </main>
  );
}
