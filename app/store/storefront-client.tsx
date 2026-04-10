"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CommerceCategory, CommerceProduct, CommerceSettings } from "@/lib/commerce";
import { formatStoreCurrency, getStoreDiscountPercent, getStoreProductCategoryName } from "@/lib/commerce-ui";
import { AddToCartButton } from "@/app/components/add-to-cart-button";
import { RatingStars } from "@/app/components/rating-stars";
import { Reveal, StaggerItem, StaggerList } from "@/app/components/reveal";

type StorefrontClientProps = {
  products: CommerceProduct[];
  categories: CommerceCategory[];
  settings: CommerceSettings;
  reviewSummaryByProduct: Record<string, { rating: number; reviewCount: number }>;
};

const priceRanges = [
  { label: "All prices", min: 0, max: Number.MAX_SAFE_INTEGER },
  { label: "Under Rs. 1,000", min: 0, max: 999 },
  { label: "Rs. 1,000 - Rs. 1,999", min: 1000, max: 1999 },
  { label: "Rs. 2,000+", min: 2000, max: Number.MAX_SAFE_INTEGER }
];

export function StorefrontClient({ products, categories, settings, reviewSummaryByProduct }: StorefrontClientProps) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priceFilter, setPriceFilter] = useState(priceRanges[0].label);

  const filteredProducts = useMemo(() => {
    const range = priceRanges.find((item) => item.label === priceFilter) ?? priceRanges[0];
    const normalizedQuery = query.trim().toLowerCase();

    return products.filter((product) => {
      const matchesQuery =
        !normalizedQuery ||
        [product.name, product.shortDescription, product.description, ...(product.benefits ?? [])]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery);
      const matchesCategory = categoryFilter === "all" || product.categorySlug === categoryFilter;
      const matchesPrice = product.salePrice >= range.min && product.salePrice <= range.max;
      return matchesQuery && matchesCategory && matchesPrice;
    });
  }, [categoryFilter, priceFilter, products, query]);

  const featuredCount = products.filter((product) => product.featured).length;
  const inStockCount = products.filter((product) => product.stock > 0).length;

  return (
    <div className="shop-shell">
      <section className="section shop-hero">
        <Reveal className="shop-hero-copy">
          <p className="eyebrow">Dhyan wellness store</p>
          <h1 className="shop-hero-title">Clean formulations, home-practice essentials, and therapeutic support products.</h1>
          <p className="lead">
            Browse by concern, compare pricing clearly, and choose products that feel aligned with a calmer, healthier routine.
          </p>
          <div className="shop-hero-actions">
            <Link className="button button-small" href="/cart">
              View cart
            </Link>
            <Link className="button button-secondary button-small" href="/checkout">
              Checkout
            </Link>
          </div>
          <div className="shop-hero-highlights">
            <span>{featuredCount} featured picks</span>
            <span>{inStockCount} ready to ship</span>
            <span>{categories.length} wellness categories</span>
          </div>
        </Reveal>
      </section>

      <section className="section shop-toolbar-shell">
        <div className="shop-toolbar-card">
          <input
            type="search"
            placeholder="Search herbs, wellness kits, and accessories"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <select value={priceFilter} onChange={(event) => setPriceFilter(event.target.value)}>
            {priceRanges.map((range) => (
              <option key={range.label} value={range.label}>
                {range.label}
              </option>
            ))}
          </select>
          <Link className="button button-secondary" href="/checkout">
            Checkout
          </Link>
        </div>

        <div className="shop-filter-row">
          <button
            className={`shop-filter-chip ${categoryFilter === "all" ? "shop-filter-chip-active" : ""}`}
            type="button"
            onClick={() => setCategoryFilter("all")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`shop-filter-chip ${categoryFilter === category.slug ? "shop-filter-chip-active" : ""}`}
              type="button"
              onClick={() => setCategoryFilter(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className="section shop-results-section page-end-section">
        <div className="shop-results-head">
          <div>
            <p className="eyebrow">Storefront</p>
            <h2>{filteredProducts.length} products ready to order</h2>
          </div>
          <p className="shop-results-copy">The catalog is sorted for practical browsing on phone and desktop.</p>
        </div>

        {filteredProducts.length ? (
          <StaggerList className="shop-grid">
            {filteredProducts.map((product) => {
            const reviewSummary = reviewSummaryByProduct[product.id] ?? { rating: 0, reviewCount: 0 };
            const discountPercent = getStoreDiscountPercent(product);

            return (
              <StaggerItem className="shop-card" key={product.id}>
                <Link className="shop-card-media" href={`/store/${product.slug}`}>
                  <Image src={product.image} alt={product.name} fill className="product-image" style={{ objectFit: "cover" }} sizes="(max-width: 720px) 100vw, (max-width: 1100px) 50vw, 33vw" />
                  <span className="shop-card-badge">{product.badge || getStoreProductCategoryName(product, categories)}</span>
                </Link>

                <div className="shop-card-copy">
                  <div className="shop-card-head">
                    <div>
                      <p className="shop-card-category">{getStoreProductCategoryName(product, categories)}</p>
                      <h3>{product.name}</h3>
                    </div>
                    <span className={`shop-stock-pill ${product.stock > 0 ? "shop-stock-pill-live" : "shop-stock-pill-out"}`}>
                      {product.stock > 0 ? `${product.stock} in stock` : "Out of stock"}
                    </span>
                  </div>

                  <p className="shop-card-description">{product.shortDescription}</p>

                  <div className="shop-card-meta">
                    {reviewSummary.reviewCount ? (
                      <RatingStars rating={reviewSummary.rating} reviewCount={reviewSummary.reviewCount} size="sm" />
                    ) : (
                      <span>New arrival</span>
                    )}
                    <span>{product.stock > 0 ? "Ready to ship" : "Back soon"}</span>
                    <span>{discountPercent}% off</span>
                  </div>

                  <div className="commerce-price-row shop-price-row">
                    <strong>{formatStoreCurrency(product.salePrice, settings)}</strong>
                    <span>{formatStoreCurrency(product.basePrice, settings)}</span>
                  </div>

                  <div className="shop-benefit-row">
                    {product.benefits.slice(0, 3).map((benefit) => (
                      <span key={benefit}>{benefit}</span>
                    ))}
                  </div>
                </div>

                <div className="shop-card-actions">
                  <Link className="card-cta" href={`/store/${product.slug}`}>
                    View details
                  </Link>
                  <AddToCartButton productId={product.id} checkoutHref={`/checkout?product=${product.id}`} compact />
                </div>
              </StaggerItem>
            );
            })}
          </StaggerList>
        ) : (
          <div className="shop-empty-state">
            <h3>No products match this filter yet.</h3>
            <p>Try a broader search or switch categories to see more wellness essentials.</p>
          </div>
        )}
      </section>
    </div>
  );
}
