"use client";

export function RatingStars({
  rating,
  reviewCount,
  size = "md"
}: {
  rating: number;
  reviewCount?: number;
  size?: "sm" | "md";
}) {
  const safeRating = Math.max(0, Math.min(5, Number.isFinite(rating) ? rating : 0));

  return (
    <div className={`rating-stars rating-stars-${size}`}>
      <span className="rating-stars-shell" aria-hidden="true">
        <span className="rating-stars-track">★★★★★</span>
        <span className="rating-stars-fill" style={{ width: `${(safeRating / 5) * 100}%` }}>
          ★★★★★
        </span>
      </span>
      <span className="rating-stars-value">{safeRating.toFixed(1)}</span>
      {typeof reviewCount === "number" ? <span className="rating-stars-count">{reviewCount} reviews</span> : null}
    </div>
  );
}
