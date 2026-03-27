import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteShell } from "@/app/components/site-shell";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { formatCurrency, getOrderDetailForUser, loadCommerceSnapshot } from "@/lib/commerce";

export default async function CheckoutSuccessPage({
  searchParams
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/sign-in?redirectTo=/account/orders");
  }

  const { order } = await searchParams;
  if (!order) {
    redirect("/account/orders");
  }

  const [detail, snapshot] = await Promise.all([getOrderDetailForUser(user.id, order), loadCommerceSnapshot()]);
  if (!detail) {
    redirect("/account/orders");
  }

  return (
    <SiteShell>
      <main className="admin-page">
        <section className="admin-shell">
          <div className="section-heading narrow">
            <p className="eyebrow">Order placed</p>
            <h1 className="page-title">Your order is confirmed.</h1>
            <p className="admin-copy">We have saved your order and linked it to your account for tracking and future support.</p>
          </div>

          <div className="commerce-admin-grid">
            <article className="admin-insight-card">
              <p className="admin-kicker">Order id</p>
              <strong>{detail.order.id}</strong>
              <span>Use this for support and tracking.</span>
            </article>
            <article className="admin-insight-card">
              <p className="admin-kicker">Total paid</p>
              <strong>{formatCurrency(detail.order.total, snapshot.settings)}</strong>
              <span>{detail.order.paymentProvider}</span>
            </article>
            <article className="admin-insight-card">
              <p className="admin-kicker">Status</p>
              <strong>{detail.order.fulfillmentStatus}</strong>
              <span>{detail.shipment ? detail.shipment.partner : "Shipment will be assigned soon."}</span>
            </article>
          </div>

          <div className="admin-actions">
            <Link className="button" href={`/account/orders/${detail.order.id}`}>
              View Tracking
            </Link>
            <Link className="button button-secondary" href="/store">
              Continue Shopping
            </Link>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
