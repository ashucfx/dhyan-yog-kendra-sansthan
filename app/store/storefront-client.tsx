"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CommerceCategory, CommerceProduct, CommerceSettings } from "@/lib/commerce";
import { formatStoreCurrency, getStoreDiscountPercent, getStoreProductCategoryName } from "@/lib/commerce-ui";

type StorefrontClientProps = {
  products: CommerceProduct[];
  categories: CommerceCategory[];
  settings: CommerceSettings;
};

const priceRanges = [
  { label: "All Prices", min: 0, max: Number.MAX_SAFE_INTEGER },
  { label: "Under Rs. 1,000", min: 0, max: 999 },
  { label: "Rs. 1,000 - Rs. 1,999", min: 1000, max: 1999 },
  { label: "Rs. 2,000+", min: 2000, max: Number.MAX_SAFE_INTEGER }
];

export function StorefrontClient({ products, categories, settings }: StorefrontClientProps) {
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

  return (
    <>
      <section className="section store-intro-section">
        <div className="store-intro-copy">
          <p className="eyebrow">Wellness store</p>
          <h1 className="store-title">Wellness essentials, herbal support, and home-practice products.</h1>
          <p className="lead">
            Find the right product quickly, then open the detail page for gallery images, video, ratings, reviews, and
            a fuller description.
          </p>
        </div>
      </section>

      <section className="section store-toolbar-section">
        <div className="store-toolbar">
          <input
            type="search"
            placeholder="Search products"
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
          <Link className="button button-small" href="/checkout">
            Go to Checkout
          </Link>
        </div>

        <div className="filter-row store-filter-row">
          <button
            className={`filter-chip ${categoryFilter === "all" ? "active-filter" : ""}`}
            type="button"
            onClick={() => setCategoryFilter("all")}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`filter-chip ${categoryFilter === category.slug ? "active-filter" : ""}`}
              type="button"
              onClick={() => setCategoryFilter(category.slug)}
            >
              {category.name}
            </button>
          ))}
        </div>
      </section>

      <section className="section store-results-section page-end-section">
        <div className="store-results-head">
          <p>{filteredProducts.length} products</p>
        </div>
        <div className="store-grid shopper-store-grid">
          {filteredProducts.map((product) => (
            <article className="store-card shopper-product-card" key={product.id}>
              <Link className="shopper-product-link" href={`/store/${product.slug}`}>
                <div className="shopper-image-frame">
                  <Image src={product.image} alt={product.name} fill className="product-image" />
                </div>
                <div className="shopper-product-copy">
                  <p className="shopper-category">{getStoreProductCategoryName(product, categories)}</p>
                  <h3>{product.name}</h3>
                  <p className="shopper-description">{product.shortDescription}</p>
                  <p className="shopper-rating">
                    {product.rating?.toFixed(1) ?? "4.7"} / 5 | {product.reviewCount ?? 0} reviews
                  </p>
                  <div className="commerce-price-row">
                    <strong>{formatStoreCurrency(product.salePrice, settings)}</strong>
                    <span>{formatStoreCurrency(product.basePrice, settings)}</span>
                    <em>{getStoreDiscountPercent(product)}% off</em>
                  </div>
                </div>
              </Link>
              <div className="shopper-card-actions">
                <Link className="card-cta" href={`/store/${product.slug}`}>
                  View Details
                </Link>
                <Link className="button button-secondary button-small" href={`/checkout?product=${product.id}`}>
                  Buy
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
