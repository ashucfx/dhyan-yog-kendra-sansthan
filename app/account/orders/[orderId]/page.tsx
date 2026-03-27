import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { SiteShell } from "@/app/components/site-shell";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { formatCurrency, getOrderDetailForUser, loadCommerceSnapshot } from "@/lib/commerce";

export default async function OrderDetailPage({ params }: { params: Promise<{ orderId: string }> }) {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/sign-in?redirectTo=/account/orders");
  }

  const { orderId } = await params;
  const [detail, snapshot] = await Promise.all([getOrderDetailForUser(user.id, orderId), loadCommerceSnapshot()]);

  if (!detail) {
    notFound();
  }

  return (
    <SiteShell>
      <main className="admin-page">
        <section className="admin-shell account-order-shell">
          <div className="section-heading narrow">
            <p className="eyebrow">Order details</p>
            <h1 className="page-title">{detail.order.id}</h1>
          </div>

          <div className="commerce-admin-grid">
            <article className="admin-insight-card">
              <p className="admin-kicker">Payment</p>
              <strong>{detail.order.paymentStatus}</strong>
              <span>{detail.order.paymentProvider}</span>
            </article>
            <article className="admin-insight-card">
              <p className="admin-kicker">Fulfillment</p>
              <strong>{detail.order.fulfillmentStatus}</strong>
              <span>{detail.shipment ? detail.shipment.partner : "Shipment pending"}</span>
            </article>
            <article className="admin-insight-card">
              <p className="admin-kicker">Total</p>
              <strong>{formatCurrency(detail.order.total, snapshot.settings)}</strong>
              <span>{detail.items.length} line items</span>
            </article>
          </div>

          <div className="checkout-layout">
            <article className="commerce-panel">
              <div className="commerce-panel-heading">
                <div>
                  <p className="admin-kicker">Items</p>
                  <h2>What you ordered</h2>
                </div>
              </div>

              <div className="commerce-list">
                {detail.items.map((item) => (
                  <div className="commerce-list-item" key={item.id}>
                    <div>
                      <strong>{item.productName}</strong>
                      <p>
                        {item.sku} | Qty {item.quantity}
                      </p>
                    </div>
                    <div className="commerce-list-side">
                      <span>{formatCurrency(item.totalPrice, snapshot.settings)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </article>

            <article className="commerce-panel">
              <div className="commerce-panel-heading">
                <div>
                  <p className="admin-kicker">Tracking</p>
                  <h2>Shipment status</h2>
                </div>
              </div>

              <div className="commerce-stack">
                <div className="commerce-status-card">
                  <div>
                    <strong>Status</strong>
                    <p>{detail.shipment?.status ?? detail.order.fulfillmentStatus}</p>
                  </div>
                  <span className="status-pill status-neutral">{detail.shipment?.awb ?? "AWB pending"}</span>
                </div>
                <div className="commerce-status-card">
                  <div>
                    <strong>Delivery address</strong>
                    <p>
                      {detail.order.shippingAddress?.line1 ?? "Address unavailable"}
                      <br />
                      {detail.order.shippingAddress
                        ? `${detail.order.shippingAddress.city}, ${detail.order.shippingAddress.state} ${detail.order.shippingAddress.postalCode}`
                        : ""}
                    </p>
                  </div>
                </div>
                {detail.shipment?.trackingUrl ? (
                  <a className="button button-secondary" href={detail.shipment.trackingUrl} target="_blank" rel="noreferrer">
                    Track Shipment
                  </a>
                ) : null}
                <Link className="button" href="/account/orders">
                  Back to Orders
                </Link>
              </div>
            </article>
          </div>
        </section>
      </main>
    </SiteShell>
  );
}
