import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteShell } from "@/app/components/site-shell";
import { formatCurrency, getDiscountPercent, getStoreProduct, loadCommerceSnapshot } from "@/lib/commerce";

export default async function ProductDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [product, snapshot] = await Promise.all([getStoreProduct(slug), loadCommerceSnapshot()]);

  if (!product) {
    notFound();
  }

  const galleryItems = [...(product.gallery ?? [product.image])];

  return (
    <SiteShell>
      <section className="section product-detail-shell">
        <div className="product-media-column">
          <div className="product-main-media">
            <Image src={galleryItems[0] ?? product.image} alt={product.name} fill className="product-image" />
          </div>

          <div className="product-thumb-grid">
            {galleryItems.map((image, index) => (
              <div className="product-thumb-card" key={`${image}-${index}`}>
                <Image src={image} alt={`${product.name} image ${index + 1}`} fill className="product-image" />
              </div>
            ))}
            {product.videoUrl ? (
              <div className="product-thumb-card product-video-card">
                <iframe
                  title={`${product.name} video`}
                  src={product.videoUrl}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
          </div>
        </div>

        <div className="product-info-column">
          <p className="shopper-category">{product.badge}</p>
          <h1>{product.name}</h1>
          <div className="product-rating-row">
            <span>{product.rating?.toFixed(1) ?? "4.7"} / 5</span>
            <span>{product.reviewCount ?? 0} ratings</span>
            <span>{(product.reviews ?? []).length} comments</span>
          </div>
          <div className="commerce-price-row">
            <strong>{formatCurrency(product.salePrice, snapshot.settings)}</strong>
            <span>{formatCurrency(product.basePrice, snapshot.settings)}</span>
            <em>{getDiscountPercent(product)}% off</em>
          </div>
          <p className="lead product-summary">{product.shortDescription}</p>
          <div className="mini-benefits">
            {product.benefits.map((benefit) => (
              <span key={benefit}>{benefit}</span>
            ))}
          </div>
          <div className="product-cta-row">
            <Link className="button" href={`/checkout?product=${product.id}`}>
              Buy Now
            </Link>
            <Link className="button button-secondary" href="/store">
              Back to Store
            </Link>
          </div>
        </div>
      </section>

      <section className="section product-detail-sections page-end-section">
        <article className="product-detail-panel">
          <h2>Description</h2>
          <p>{product.description}</p>
        </article>

        <article className="product-detail-panel">
          <h2>Highlights</h2>
          <ul className="check-list">
            {product.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </article>

        <article className="product-detail-panel">
          <h2>Ratings and comments</h2>
          <div className="product-review-list">
            {(product.reviews ?? []).map((review, index) => (
              <div className="product-review-card" key={`${review.author}-${index}`}>
                <div className="product-review-head">
                  <strong>{review.author}</strong>
                  <span>{review.rating} / 5</span>
                </div>
                <p>{review.comment}</p>
              </div>
            ))}
          </div>
        </article>
      </section>
    </SiteShell>
  );
}
