import Link from "next/link";
import { redirect } from "next/navigation";
import { SiteShell } from "../components/site-shell";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { getUserProfile, listAddressesForUser, listOrdersForUser } from "@/lib/commerce";
import { AccountClient } from "./account-client";

export default async function AccountPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/sign-in?redirectTo=/account");
  }

  const [orders, profile, addresses] = await Promise.all([
    listOrdersForUser(user.id),
    getUserProfile(user.id, {
      email: user.email,
      name: user.name,
      phone: user.phone
    }),
    listAddressesForUser(user.id)
  ]);

  return (
    <SiteShell>
      <main className="admin-page">
        <section className="admin-shell">
          <div className="admin-header">
            <div>
              <p className="eyebrow">My account</p>
              <h1>{profile.fullName || user.name || user.email}</h1>
              <p className="admin-copy">
                {profile.email}
                {profile.phone ? ` | ${profile.phone}` : ""}
              </p>
            </div>
            <div className="admin-actions">
              <Link className="button button-secondary button-small" href="/account/orders">
                My Orders
              </Link>
            </div>
          </div>

          <section className="commerce-admin-grid">
            <article className="admin-insight-card">
              <p className="admin-kicker">Orders</p>
              <strong>{orders.length}</strong>
              <span>Total account-linked orders.</span>
            </article>
            <article className="admin-insight-card">
              <p className="admin-kicker">Account email</p>
              <strong>{profile.email}</strong>
              <span>Used for order confirmations and sign-in.</span>
            </article>
            <article className="admin-insight-card">
              <p className="admin-kicker">Saved addresses</p>
              <strong>{addresses.length}</strong>
              <span>Ready for faster checkout and repeat orders.</span>
            </article>
          </section>

          <AccountClient initialProfile={profile} initialAddresses={addresses} />
        </section>
      </main>
    </SiteShell>
  );
}
