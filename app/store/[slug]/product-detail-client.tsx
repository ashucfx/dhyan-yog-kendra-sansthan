"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, type ChangeEvent } from "react";
import type { CommerceProduct, CommerceProductReview, CommerceSettings } from "@/lib/commerce";
import { formatStoreCurrency, getStoreDiscountPercent } from "@/lib/commerce-ui";
import { AddToCartButton } from "@/app/components/add-to-cart-button";
import { Reveal, StaggerItem } from "@/app/components/reveal";
import { RatingStars } from "@/app/components/rating-stars";

type ProductDetailClientProps = {
  product: CommerceProduct;
  settings: CommerceSettings;
  initialReviews: CommerceProductReview[];
  initialRating: number;
  initialReviewCount: number;
  reviewMediaEnabled: boolean;
};

type MediaItem =
  | { kind: "image"; value: string }
  | { kind: "video"; value: string };

type ProductShippingEstimate = {
  postalCode: string;
  shippingCharge: number;
  etaLabel?: string;
  message: string;
};

export function ProductDetailClient({
  product,
  settings,
  initialReviews,
  initialRating,
  initialReviewCount,
  reviewMediaEnabled
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
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [reviewMedia, setReviewMedia] = useState<Array<{ kind: "image" | "video"; url: string }>>([]);
  const [shippingBusy, setShippingBusy] = useState(false);
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingEstimate, setShippingEstimate] = useState<ProductShippingEstimate | null>(null);
  const [deliveryMessage, setDeliveryMessage] = useState("");
  const [deliveryMessageTone, setDeliveryMessageTone] = useState<"success" | "error">("success");
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  async function handleReviewMediaChange(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []).slice(0, 4);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    setUploadingMedia(true);
    setMessage("");

    try {
      const formData = new FormData();
      for (const file of files) {
        formData.append("files", file);
      }

      const response = await fetch("/api/store/reviews/media", {
        method: "POST",
        body: formData
      });
      const result = (await response.json()) as {
        message?: string;
        media?: Array<{ kind: "image" | "video"; url: string }>;
      };

      if (!response.ok || !result.media?.length) {
        throw new Error(result.message || "Unable to upload review media.");
      }

      const uploadedMedia = result.media;
      setReviewMedia((current) => [...current, ...uploadedMedia].slice(0, 4));
      setMessageTone("success");
      setMessage(result.message || "Media uploaded and ready to attach.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Unable to upload review media.");
    } finally {
      setUploadingMedia(false);
    }
  }

  function removeReviewMedia(url: string) {
    setReviewMedia((current) => current.filter((item) => item.url !== url));
  }

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
          comment,
          media: reviewMedia
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
      setReviewMedia([]);
      setMessageTone("success");
      setMessage(result.message || "Review submitted.");
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Unable to submit review.");
    } finally {
      setBusy(false);
    }
  }

  async function checkDelivery() {
    setShippingBusy(true);
    setDeliveryMessage("");

    try {
      const response = await fetch("/api/shipping/estimate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          postalCode: shippingPostalCode,
          subtotal: product.salePrice,
          country: "India"
        })
      });

      const result = (await response.json()) as {
        postalCode?: string;
        shippingCharge?: number;
        etaLabel?: string;
        message?: string;
      };

      if (!response.ok || typeof result.shippingCharge !== "number" || !result.postalCode) {
        throw new Error(result.message || "Delivery is not available for this pincode.");
      }

      setShippingEstimate({
        postalCode: result.postalCode,
        shippingCharge: result.shippingCharge,
        etaLabel: result.etaLabel,
        message: result.message || "Delivery is available."
      });
      setDeliveryMessageTone("success");
      setDeliveryMessage(result.message || "Delivery is available.");
    } catch (error) {
      setShippingEstimate(null);
      setDeliveryMessageTone("error");
      setDeliveryMessage(error instanceof Error ? error.message : "Delivery is not available for this pincode.");
    } finally {
      setShippingBusy(false);
    }
  }

  return (
    <div className="product-shell">
      <section className="section product-hero">
        <div className="product-media-stage">
          <div className="product-main-media">
            {selectedMedia.kind === "image" ? (
              <Image src={selectedMedia.value} alt={product.name} fill className="product-image" style={{ objectFit: "cover" }} sizes="(max-width: 1100px) 100vw, 55vw" />
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
                  <Image src={item.value} alt={`${product.name} media ${index + 1}`} fill className="product-image" style={{ objectFit: "cover" }} sizes="100px" />
                ) : (
                  <div className="product-video-thumb">
                    <span>Video</span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <Reveal>
          <div className="product-summary-panel">
            <p className="shopper-category">{product.badge}</p>
            <h1>{product.name}</h1>
            <p className="product-summary-copy">{product.shortDescription}</p>
            <p className="product-summary-welcome">Chosen to support a steadier, healthier daily rhythm with simple guidance and dependable delivery.</p>

            <div className="product-rating-row">
              {reviewCount ? <RatingStars rating={rating} reviewCount={reviewCount} /> : <span className="rating-stars-empty">No ratings yet</span>}
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

          <div className="product-delivery-card">
            <div className="product-delivery-head">
              <div>
                <p className="eyebrow">Delivery check</p>
                <h2>Check delivery by pincode</h2>
                <p className="product-delivery-copy">See when this item can reach you and what the final shipping charge will look like before checkout.</p>
              </div>
              <span className="status-pill status-neutral">Delivery estimate available</span>
            </div>
            <div className="product-delivery-form">
              <input
                placeholder="Enter 6-digit pincode"
                value={shippingPostalCode}
                onChange={(event) => setShippingPostalCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              />
              <button className="button button-secondary button-small" type="button" disabled={shippingBusy} onClick={() => void checkDelivery()}>
                {shippingBusy ? "Checking..." : "Check"}
              </button>
            </div>
            {shippingEstimate ? (
              <div className="product-delivery-result">
                <span>ETA {shippingEstimate.etaLabel ?? "Available"}</span>
                <span>Shipping {formatStoreCurrency(shippingEstimate.shippingCharge, settings)}</span>
              </div>
            ) : null}
            {deliveryMessage ? <p className={`form-status form-status-${deliveryMessageTone}`}>{deliveryMessage}</p> : null}
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
        </Reveal>
      </section>

      <section className="section product-detail-grid page-end-section">
        <Reveal>
          <article className="product-detail-panel">
            <p className="eyebrow">Product details</p>
            <h2>What this product is designed to support</h2>
            <p>{product.description}</p>
          </article>
        </Reveal>

        <Reveal delay={0.08}>
          <article className="product-detail-panel">
            <p className="eyebrow">Highlights</p>
            <h2>Key benefits</h2>
            <ul className="check-list">
              {product.benefits.map((benefit) => (
                <li key={benefit}>{benefit}</li>
              ))}
            </ul>
          </article>
        </Reveal>

        <Reveal delay={0.12}>
          <article className="product-detail-panel product-review-panel">
            <p className="eyebrow">Reviews</p>
            <h2>Ratings and comments</h2>
            <p className="product-review-intro">Share what helped, what felt different, and anything that could guide the next customer with more confidence.</p>

            <div className="product-review-list">
              {reviews.length ? (
                reviews.map((review) => (
                  <StaggerItem className="product-review-card" key={review.id}>
                    <div className="product-review-head">
                      <strong>{review.author}</strong>
                      <RatingStars rating={review.rating} size="sm" />
                    </div>
                    <p>{review.comment}</p>
                    {review.media?.length ? (
                      <div className="review-media-grid">
                        {review.media.map((item) =>
                          item.kind === "video" ? (
                            <video className="review-media-card" key={item.url} controls preload="metadata">
                              <source src={item.url} />
                            </video>
                          ) : (
                            <Image
                              className="review-media-card"
                              key={item.url}
                              src={item.url}
                              alt="Customer review attachment"
                              width={480}
                              height={480}
                              unoptimized
                            />
                          )
                        )}
                      </div>
                    ) : null}
                  </StaggerItem>
                ))
              ) : (
                <p className="admin-copy">No reviews yet. The first review helps future buyers decide faster.</p>
              )}
            </div>

            <div className="product-review-form">
              <h3>Add your review</h3>
              <p className="product-review-form-copy">A short, honest note about your experience is enough. You can also attach a few photos or a short video when uploads are available.</p>
              <select value={score} onChange={(event) => setScore(Number(event.target.value))}>
                <option value={5}>5</option>
                <option value={4}>4</option>
                <option value={3}>3</option>
                <option value={2}>2</option>
                <option value={1}>1</option>
              </select>
              <textarea placeholder="Write your comment" value={comment} onChange={(event) => setComment(event.target.value)} />
              {reviewMediaEnabled ? (
                <label className="review-upload-field">
                  <span className="account-field-label">Photos or video</span>
                  <input accept="image/*,video/mp4,video/webm,video/quicktime" multiple type="file" onChange={handleReviewMediaChange} />
                  <span className="review-upload-copy">{uploadingMedia ? "Uploading selected files..." : "Upload up to 4 files. Images: 6 MB max. Videos: 25 MB max."}</span>
                </label>
              ) : (
                <p className="product-review-form-copy">Photo and video uploads are enabled when Supabase review storage is configured.</p>
              )}
              {reviewMedia.length ? (
                <div className="review-media-grid review-media-grid-edit">
                  {reviewMedia.map((item) => (
                    <div className="review-media-preview-shell" key={item.url}>
                      {item.kind === "video" ? (
                        <video className="review-media-card" controls preload="metadata">
                          <source src={item.url} />
                        </video>
                      ) : (
                        <Image className="review-media-card" src={item.url} alt="Review media preview" width={480} height={480} unoptimized />
                      )}
                      <button className="button button-secondary button-small review-media-remove" type="button" onClick={() => removeReviewMedia(item.url)}>
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
              {message ? <p className={`form-status form-status-${messageTone}`}>{message}</p> : null}
              <button className="button button-small" type="button" disabled={busy || uploadingMedia} onClick={() => void submitReview()}>
                {busy ? "Submitting..." : "Submit review"}
              </button>
            </div>
          </article>
        </Reveal>
      </section>
    </div>
  );
}
