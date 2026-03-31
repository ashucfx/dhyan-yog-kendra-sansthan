"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CommerceProduct, CommerceProductReview, CommerceSettings } from "@/lib/commerce";
import { formatStoreCurrency, getStoreDiscountPercent } from "@/lib/commerce-ui";
import { AddToCartButton } from "@/app/components/add-to-cart-button";

type ProductDetailClientProps = {
  product: CommerceProduct;
  settings: CommerceSettings;
  initialReviews: CommerceProductReview[];
  initialRating: number;
  initialReviewCount: number;
};

type MediaItem =
  | { kind: "image"; value: string }
  | { kind: "video"; value: string };

export function ProductDetailClient({
  product,
  settings,
  initialReviews,
  initialRating,
  initialReviewCount
}: ProductDetailClientProps) {
  const mediaItems = useMemo<MediaItem[]>(() => {
    const items: MediaItem[] = (product.gallery ?? [product.image]).map((image) => ({ kind: "image", value: image }));
    if (product.videoUrl) {
      items.push({ kind: "video", value: product.videoUrl });
    }
    return items;
  }, [product.gallery, product.image, product.videoUrl]);

  const [selectedMedia, setSelectedMedia] = useState<MediaItem>(mediaItems[0] ?? { kind: "image", value: product.image });
  const [reviews, setReviews] = useState(initialReviews);
  const [rating, setRating] = useState(initialRating);
  const [reviewCount, setReviewCount] = useState(initialReviewCount);
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function submitReview() {
    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/store/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          productId: product.id,
          rating: score,
          comment
        })
      });

      const result = (await response.json()) as {
        message?: string;
        review?: CommerceProductReview;
        summary?: {
          rating: number;
          reviewCount: number;
          reviews: CommerceProductReview[];
        };
      };

      if (!response.ok || !result.review || !result.summary) {
        throw new Error(result.message || "Unable to submit review.");
      }

      setReviews(result.summary.reviews);
      setRating(result.summary.rating);
      setReviewCount(result.summary.reviewCount);
      setScore(5);
      setComment("");
      setMessageTone("success");
      setMessage(result.message || "Review submitted.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit review.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="product-shell">
      <section className="section product-hero">
        <div className="product-media-stage">
          <div className="product-main-media">
            {selectedMedia.kind === "image" ? (
              <Image src={selectedMedia.value} alt={product.name} fill className="product-image" sizes="(max-width: 900px) 100vw, 55vw" />
            ) : (
              <iframe
                title={`${product.name} video`}
                src={selectedMedia.value}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            )}
          </div>

          <div className="product-thumb-grid">
            {mediaItems.map((item, index) => (
              <button
                key={`${item.kind}-${item.value}-${index}`}
                type="button"
                className={`product-thumb-card ${selectedMedia.value === item.value ? "active-thumb" : ""}`}
                onClick={() => setSelectedMedia(item)}
              >
                {item.kind === "image" ? (
                  <Image src={item.value} alt={`${product.name} media ${index + 1}`} fill className="product-image" sizes="100px" />
                ) : (
                  <div className="product-video-thumb">
                    <span>Video</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="product-summary-panel">
          <p className="shopper-category">{product.badge}</p>
          <h1>{product.name}</h1>
          <p className="product-summary-copy">{product.shortDescription}</p>

          <div className="product-rating-row">
            <span>{rating ? rating.toFixed(1) : "New"} / 5</span>
            <span>{reviewCount} ratings</span>
            <span>{reviews.length} comments</span>
          </div>

          <div className="commerce-price-row product-price-row">
            <strong>{formatStoreCurrency(product.salePrice, settings)}</strong>
            <span>{formatStoreCurrency(product.basePrice, settings)}</span>
            <em>{getStoreDiscountPercent(product)}% off</em>
          </div>

          <div className="shop-benefit-row product-benefit-row">
            {product.benefits.map((benefit) => (
              <span key={benefit}>{benefit}</span>
            ))}
          </div>

          <div className="product-summary-grid">
            <div>
              <strong>{product.stock}</strong>
              <span>Units in stock</span>
            </div>
            <div>
              <strong>{product.sku}</strong>
              <span>SKU reference</span>
            </div>
            <div>
              <strong>Fast</strong>
              <span>Checkout ready</span>
            </div>
          </div>

          <div className="product-cta-row">
            <AddToCartButton productId={product.id} checkoutHref={`/checkout?product=${product.id}`} />
            <Link className="button button-secondary" href="/store">
              Back to store
            </Link>
          </div>
        </div>
      </section>

      <section className="section product-detail-grid page-end-section">
        <article className="product-detail-panel">
          <p className="eyebrow">Product details</p>
          <h2>What this product is designed to support</h2>
          <p>{product.description}</p>
        </article>

        <article className="product-detail-panel">
          <p className="eyebrow">Highlights</p>
          <h2>Key benefits</h2>
          <ul className="check-list">
            {product.benefits.map((benefit) => (
              <li key={benefit}>{benefit}</li>
            ))}
          </ul>
        </article>

        <article className="product-detail-panel product-review-panel">
          <p className="eyebrow">Reviews</p>
          <h2>Ratings and comments</h2>

          <div className="product-review-list">
            {reviews.length ? (
              reviews.map((review) => (
                <div className="product-review-card" key={review.id}>
                  <div className="product-review-head">
                    <strong>{review.author}</strong>
                    <span>{review.rating} / 5</span>
                  </div>
                  <p>{review.comment}</p>
                </div>
              ))
            ) : (
              <p className="admin-copy">No reviews yet. The first review helps future buyers decide faster.</p>
            )}
          </div>

          <div className="product-review-form">
            <h3>Add your review</h3>
            <select value={score} onChange={(event) => setScore(Number(event.target.value))}>
              <option value={5}>5</option>
              <option value={4}>4</option>
              <option value={3}>3</option>
              <option value={2}>2</option>
              <option value={1}>1</option>
            </select>
            <textarea placeholder="Write your comment" value={comment} onChange={(event) => setComment(event.target.value)} />
            {message ? <p className={`form-status form-status-${messageTone}`}>{message}</p> : null}
            <button className="button button-small" type="button" disabled={busy} onClick={() => void submitReview()}>
              {busy ? "Submitting..." : "Submit review"}
            </button>
          </div>
        </article>
      </section>
    </div>
  );
}
