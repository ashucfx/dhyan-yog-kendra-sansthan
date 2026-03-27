import Link from "next/link";
import { Suspense } from "react";
import { isAdminAuthenticated, isAdminKeyConfigured } from "@/lib/admin-auth";
import { getStorageLabel, listSubmissions } from "@/lib/submissions";
import { DashboardClient } from "./dashboard-client";

export default async function AdminSubmissionsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: "invalid" | "config" }>;
}) {
  const authenticated = await isAdminAuthenticated();
  const configured = isAdminKeyConfigured();
  const resolvedSearchParams = await searchParams;

  if (!authenticated) {
    return (
      <main className="admin-page">
        <section className="admin-card">
          <p className="eyebrow">Admin access</p>
          <h1>View website submissions</h1>
          <p className="admin-copy">
            This page lets the organization view every inquiry in one place after deployment. Enter the admin access
            key to continue.
          </p>
          <form className="admin-login" action="/api/admin/login" method="post">
            <input type="hidden" name="redirectTo" value="/admin/submissions" />
            <label htmlFor="password">
              Admin password
              <input id="password" name="password" type="password" placeholder="Enter admin access key" required />
            </label>
            <button className="button" type="submit">
              Open submissions
            </button>
          </form>
          {resolvedSearchParams.error === "invalid" ? (
            <p className="form-status form-status-error">Password did not match the configured ADMIN_ACCESS_KEY.</p>
          ) : null}
          {resolvedSearchParams.error === "config" ? (
            <p className="form-status form-status-error">ADMIN_ACCESS_KEY is missing in runtime environment.</p>
          ) : null}
          {!configured ? (
            <p className="form-status form-status-error">
              Runtime config is missing. Set ADMIN_ACCESS_KEY in .env.local (for local) or deployment env settings.
            </p>
          ) : null}
          <p className="microcopy">
            Important: <code>.env.example</code> is only a template. Use <code>.env.local</code> locally and set
            deployment environment variables in your host dashboard.
          </p>
          <Link className="card-cta" href="/">
            Back to website
          </Link>
        </section>
      </main>
    );
  }

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
        <Suspense fallback={<div className="loading-state">Loading submissions...</div>}>
          <DashboardClient initialSubmissions={submissions} storageLabel={storageLabel} initialError={dashboardError} />
        </Suspense>
      </section>
    </main>
  );
}
