import { notFound } from "next/navigation";
import { SiteShell } from "@/app/components/site-shell";
import { getProductReviews, getStoreProduct, loadCommerceSnapshot } from "@/lib/commerce";
import { getSupabaseServiceClient } from "@/lib/supabase/service";
import { ProductDetailClient } from "./product-detail-client";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const snapshot = await loadCommerceSnapshot();
  const product = snapshot.products.find((item) => item.slug === slug && item.active) ?? (await getStoreProduct(slug));

  if (!product) {
    notFound();
  }

  const reviewSummary = getProductReviews(snapshot, product.id);

  return (
    <SiteShell>
      <ProductDetailClient
        product={product}
        settings={snapshot.settings}
        initialReviews={reviewSummary.reviews}
        initialRating={reviewSummary.rating}
        initialReviewCount={reviewSummary.reviewCount}
        reviewMediaEnabled={Boolean(getSupabaseServiceClient())}
      />
    </SiteShell>
  );
}
