import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteShell } from "@/app/components/site-shell";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { formatCurrency, listOrdersForUser, loadCommerceSnapshot } from "@/lib/commerce";

export default async function OrdersPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/sign-in?redirectTo=/account/orders");
  }

  const [orders, snapshot] = await Promise.all([listOrdersForUser(user.id), loadCommerceSnapshot()]);

  return (
    <SiteShell>
      <main className="admin-page">
        <section className="admin-shell">
          <div className="section-heading narrow">
            <p className="eyebrow">My orders</p>
            <h1 className="page-title">Track your orders and payment status.</h1>
          </div>

          <div className="commerce-list">
            {orders.length ? (
              orders.map((order) => (
                <div className="commerce-list-item" key={order.id}>
                  <div>
                    <strong>{order.id}</strong>
                    <p>
                      {order.paymentProvider} | {order.paymentStatus} | {order.fulfillmentStatus}
                    </p>
                  </div>
                  <div className="commerce-list-side">
                    <span>{formatCurrency(order.total, snapshot.settings)}</span>
                    <span className="status-pill status-warning">{order.status}</span>
                    <Link className="button button-secondary button-small" href={`/account/orders/${order.id}`}>
                      View Order
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <p className="admin-copy">You do not have any orders yet.</p>
            )}
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
