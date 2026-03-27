import { SiteShell } from "../components/site-shell";
import { getProductReviews, loadCommerceSnapshot } from "@/lib/commerce";
import { StorefrontClient } from "./storefront-client";

export default async function StorePage() {
  const snapshot = await loadCommerceSnapshot();
  const activeProducts = snapshot.products.filter((product) => product.active);
  const reviewSummaryByProduct = Object.fromEntries(
    activeProducts.map((product) => {
      const summary = getProductReviews(snapshot, product.id);
      return [product.id, { rating: summary.rating, reviewCount: summary.reviewCount }];
    })
  );

  return (
    <SiteShell>
      <StorefrontClient
        products={activeProducts}
        categories={snapshot.categories}
        settings={snapshot.settings}
        reviewSummaryByProduct={reviewSummaryByProduct}
      />
    </SiteShell>
  );
}
