import { Suspense } from "react";
import { SiteShell } from "../components/site-shell";
import { getUserProfile, listAddressesForUser, loadCommerceSnapshot } from "@/lib/commerce";
import { CheckoutClient } from "./checkout-client";
import { getAuthenticatedUser } from "@/lib/auth-user";
import { redirect } from "next/navigation";

export default async function CheckoutPage() {
  const user = await getAuthenticatedUser();
  if (!user) {
    redirect("/auth/sign-in?redirectTo=/checkout");
  }

  const [snapshot, profile, addresses] = await Promise.all([
    loadCommerceSnapshot(),
    getUserProfile(user.id, {
      email: user.email,
      name: user.name,
      phone: user.phone
    }),
    listAddressesForUser(user.id)
  ]);

  return (
    <SiteShell>
      <Suspense fallback={<div className="loading-state">Loading checkout...</div>}>
        <CheckoutClient
          products={snapshot.products}
          coupons={snapshot.coupons}
          settings={snapshot.settings}
          initialName={profile.fullName || user.name}
          initialEmail={profile.email || user.email}
          initialPhone={profile.phone || user.phone}
          initialAddresses={addresses}
        />
      </Suspense>
    </SiteShell>
  );
}
