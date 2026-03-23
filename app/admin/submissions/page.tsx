import Link from "next/link";
import { isAdminAuthenticated, isAdminKeyConfigured } from "@/lib/admin-auth";
import { getStorageLabel, listSubmissions } from "@/lib/submissions";

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
        <div className="admin-header">
          <div>
            <p className="eyebrow">Client dashboard</p>
            <h1>Submission table</h1>
            <p className="admin-copy">Every inquiry sent from the website appears here, with blood group and batch preference included.</p>
          </div>
          <div className="admin-actions">
            <span className="entity-chip">Storage: {storageLabel}</span>
            <form action="/api/admin/logout" method="post">
              <button className="button button-secondary" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>

        <div className="admin-table-shell">
          {dashboardError ? (
            <p className="form-status form-status-error">Dashboard error: {dashboardError}</p>
          ) : null}
          <table className="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Country</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Blood group</th>
                <th>Condition</th>
                <th>Batch</th>
                <th>Goal</th>
                <th>Notes</th>
                <th>Submitted</th>
              </tr>
            </thead>
            <tbody>
              {submissions.length ? (
                submissions.map((item) => (
                  <tr key={item.id}>
                    <td>{item.name}</td>
                    <td>{item.country} ({item.countryCode})</td>
                    <td>{item.phone}</td>
                    <td>{item.email}</td>
                    <td>{item.bloodGroup}</td>
                    <td>{item.condition}</td>
                    <td>{item.batchType}</td>
                    <td>{item.goal}</td>
                    <td>{item.notes || "-"}</td>
                    <td>{new Date(item.createdAt).toLocaleString("en-IN")}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10}>No submissions yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
