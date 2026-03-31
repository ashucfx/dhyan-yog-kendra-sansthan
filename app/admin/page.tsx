import Link from "next/link";
import { isAdminAuthenticated, isAdminKeyConfigured } from "@/lib/admin-auth";
import { formatCurrency, getCommerceOverview, listCustomerProfiles, loadCommerceSnapshot } from "@/lib/commerce";
import { CommerceDashboardClient } from "./commerce-dashboard-client";

function getStatusTone(status: string) {
  if (["captured", "paid", "active", "pickup_scheduled", "in_transit"].includes(status)) {
    return "success";
  }

  if (["planned", "pending_payment", "awaiting_payment", "created"].includes(status)) {
    return "warning";
  }

  return "neutral";
}

export default async function AdminCommercePage({
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
          <p className="eyebrow">Commerce admin</p>
          <h1>Run the store from one dashboard</h1>
          <p className="admin-copy">
            Use this dashboard to manage catalog, promotions, payment readiness, orders, and logistics operations.
          </p>
          <form className="admin-login" action="/api/admin/login" method="post">
            <input type="hidden" name="redirectTo" value="/admin" />
            <label htmlFor="password">
              Admin password
              <input id="password" name="password" type="password" placeholder="Enter admin access key" required />
            </label>
            <button className="button" type="submit">
              Open dashboard
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
              Runtime config is missing. Set ADMIN_ACCESS_KEY in .env.local or deployment environment variables.
            </p>
          ) : null}
        </section>
      </main>
    );
  }

  const snapshot = await loadCommerceSnapshot();
  const overview = getCommerceOverview(snapshot);
  const customers = await listCustomerProfiles();
  const featuredProducts = snapshot.products.filter((product) => product.featured).slice(0, 4);
  const latestOrders = snapshot.orders.slice(0, 5);
  const logisticsQueue = snapshot.shipments.slice(0, 5);

  return (
    <main className="admin-page admin-page--commerce">
      <section className="admin-shell commerce-admin-shell">
        <div className="admin-header">
          <div>
            <p className="eyebrow">Commerce control room</p>
            <h1>Production commerce dashboard</h1>
            <p className="admin-copy">
              Catalog, coupons, offers, payment readiness, and shipping visibility now sit in one operational surface.
            </p>
          </div>
          <div className="admin-actions">
            <span className="entity-chip">Data source: {snapshot.source === "supabase" ? "Supabase" : "Local starter data"}</span>
            <Link className="button button-secondary button-small" href="/admin/submissions">
              Lead dashboard
            </Link>
            <form action="/api/admin/logout" method="post">
              <button className="button button-secondary button-small" type="submit">
                Log out
              </button>
            </form>
          </div>
        </div>

        <section className="commerce-admin-grid">
          <article className="admin-insight-card">
            <p className="admin-kicker">Captured revenue</p>
            <strong>{formatCurrency(overview.revenue, snapshot.settings)}</strong>
            <span>Based on paid orders already marked captured.</span>
          </article>
          <article className="admin-insight-card">
            <p className="admin-kicker">Orders</p>
            <strong>{overview.totalOrders}</strong>
            <span>Total orders in the connected data source.</span>
          </article>
          <article className="admin-insight-card">
            <p className="admin-kicker">Registered customers</p>
            <strong>{customers.length}</strong>
            <span>Profiles synced from Supabase (empty if using local data only).</span>
          </article>
          <article className="admin-insight-card">
            <p className="admin-kicker">Live catalog</p>
            <strong>{overview.activeProducts}</strong>
            <span>Products currently in stock and ready to sell.</span>
          </article>
          <article className="admin-insight-card">
            <p className="admin-kicker">Promotions</p>
            <strong>
              {overview.activeOffers} offers / {overview.activeCoupons} coupons
            </strong>
            <span>Admin-driven campaigns ready for sitewide and checkout usage.</span>
          </article>
          <article className="admin-insight-card">
            <p className="admin-kicker">Logistics queue</p>
            <strong>{overview.activeShipments}</strong>
            <span>Shipments still in operational flow.</span>
          </article>
        </section>

        <section className="commerce-admin-panels">
          <article className="commerce-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="admin-kicker">Catalog focus</p>
                <h2>Featured products</h2>
              </div>
              <span className={`status-pill status-${overview.lowStockProducts ? "warning" : "success"}`}>
                {overview.lowStockProducts} low stock
              </span>
            </div>
            <div className="commerce-list">
              {featuredProducts.map((product) => (
                <div className="commerce-list-item" key={product.id}>
                  <div>
                    <strong>{product.name}</strong>
                    <p>
                      {product.sku} | Stock {product.stock}
                    </p>
                  </div>
                  <div className="commerce-list-side">
                    <span>{formatCurrency(product.salePrice, snapshot.settings)}</span>
                    <span className={`status-pill status-${product.stock <= 12 ? "warning" : "success"}`}>{product.badge}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="commerce-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="admin-kicker">Checkout readiness</p>
                <h2>Payments and shipping</h2>
              </div>
            </div>
            <div className="commerce-stack">
              {snapshot.settings.payments.map((payment) => (
                <div className="commerce-status-card" key={payment.provider}>
                  <div>
                    <strong>{payment.provider}</strong>
                    <p>{payment.description}</p>
                  </div>
                  <span className={`status-pill status-${getStatusTone(payment.status)}`}>{payment.status}</span>
                </div>
              ))}
              {snapshot.settings.shippingPartners.map((partner) => (
                <div className="commerce-status-card" key={partner.name}>
                  <div>
                    <strong>{partner.name}</strong>
                    <p>{partner.coverage}</p>
                  </div>
                  <span className={`status-pill status-${getStatusTone(partner.status)}`}>{partner.status}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="commerce-admin-panels">
          <article className="commerce-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="admin-kicker">Orders</p>
                <h2>Latest transactions</h2>
              </div>
            </div>
            <div className="commerce-list">
              {latestOrders.map((order) => (
                <div className="commerce-list-item" key={order.id}>
                  <div>
                    <strong>{order.customerName}</strong>
                    <p>
                      {order.id} | {order.paymentProvider} | {new Date(order.createdAt).toLocaleString("en-IN")}
                    </p>
                  </div>
                  <div className="commerce-list-side">
                    <span>{formatCurrency(order.total, snapshot.settings)}</span>
                    <span className={`status-pill status-${getStatusTone(order.paymentStatus)}`}>{order.paymentStatus}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="commerce-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="admin-kicker">Logistics</p>
                <h2>Shipment queue</h2>
              </div>
            </div>
            <div className="commerce-list">
              {logisticsQueue.map((shipment) => (
                <div className="commerce-list-item" key={shipment.id}>
                  <div>
                    <strong>{shipment.partner}</strong>
                    <p>
                      {shipment.orderId} | AWB {shipment.awb}
                    </p>
                  </div>
                  <div className="commerce-list-side">
                    <a className="card-cta commerce-inline-cta" href={shipment.trackingUrl} target="_blank" rel="noreferrer">
                      Track
                    </a>
                    <span className={`status-pill status-${getStatusTone(shipment.status)}`}>{shipment.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="commerce-admin-panels">
          <article className="commerce-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="admin-kicker">Customers</p>
                <h2>Registered accounts</h2>
              </div>
            </div>
            <div className="commerce-list">
              {customers.length ? (
                customers.slice(0, 20).map((customer) => (
                  <div className="commerce-list-item" key={customer.id}>
                    <div>
                      <strong>{customer.fullName || customer.email}</strong>
                      <p>
                        {customer.email}
                        {customer.phone ? ` | ${customer.phone}` : ""}
                      </p>
                    </div>
                    <div className="commerce-list-side">
                      <span className="status-pill status-neutral">{new Date(customer.createdAt).toLocaleDateString("en-IN")}</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="admin-copy">
                  No customer profiles returned. With Supabase connected, profiles appear after users sign up or place orders.
                </p>
              )}
            </div>
          </article>

          <article className="commerce-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="admin-kicker">Promotions</p>
                <h2>Offers and coupons</h2>
              </div>
            </div>
            <div className="commerce-stack">
              {snapshot.offers.map((offer) => (
                <div className="commerce-status-card" key={offer.id}>
                  <div>
                    <strong>{offer.title}</strong>
                    <p>{offer.description}</p>
                  </div>
                  <span className={`status-pill status-${offer.active ? "success" : "neutral"}`}>
                    {offer.discountType === "percent" ? `${offer.discountValue}%` : formatCurrency(offer.discountValue, snapshot.settings)}
                  </span>
                </div>
              ))}
              {snapshot.coupons.map((coupon) => (
                <div className="commerce-status-card" key={coupon.id}>
                  <div>
                    <strong>{coupon.code}</strong>
                    <p>{coupon.description}</p>
                  </div>
                  <span className={`status-pill status-${coupon.active ? "success" : "neutral"}`}>
                    Min {formatCurrency(coupon.minimumOrderAmount, snapshot.settings)}
                  </span>
                </div>
              ))}
            </div>
          </article>

          <article className="commerce-panel">
            <div className="commerce-panel-heading">
              <div>
                <p className="admin-kicker">Build map</p>
                <h2>Operational readiness notes</h2>
              </div>
            </div>
            <ul className="check-list">
              <li>Supabase should run the updated `supabase/commerce.sql` schema before production rollout.</li>
              <li>Razorpay, PayPal, and Shiprocket remain environment-driven and stay in mock-safe mode without secrets.</li>
              <li>Orders now move from creation to payment capture before stock is reduced.</li>
              <li>Coupons respect minimum order value, usage limits, and active date windows.</li>
              <li>Admin should review RLS policies and storage bucket permissions before exposing uploads publicly.</li>
            </ul>
          </article>
        </section>

        <CommerceDashboardClient initialSnapshot={snapshot} />
      </section>
    </main>
  );
}
