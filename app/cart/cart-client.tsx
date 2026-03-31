"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import type { CommerceProduct, CommerceSettings } from "@/lib/commerce";
import { formatStoreCurrency } from "@/lib/commerce-ui";
import { useCart } from "@/app/components/cart-provider";

export function CartClient({ products, settings }: { products: CommerceProduct[]; settings: CommerceSettings }) {
  const { items, loading, authenticated, removeItem, updateQuantity } = useCart();

  const cartItems = useMemo(
    () =>
      items
        .map((item) => {
          const product =
            products.find((entry) => entry.id === item.productId) ??
            products.find((entry) => entry.slug === item.productId);
          return product ? { product, quantity: item.quantity } : null;
        })
        .filter((item): item is { product: CommerceProduct; quantity: number } => Boolean(item)),
    [items, products]
  );

  const subtotal = cartItems.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const shipping = subtotal >= 1499 || subtotal === 0 ? 0 : 120;
  const total = subtotal + shipping;

  return (
    <section className="section cart-shell page-end-section">
      <div className="cart-main-panel">
        <div className="cart-header">
          <div>
            <p className="eyebrow">Cart</p>
            <h1 className="page-title">Review your selected products before checkout.</h1>
          </div>
          <Link className="button button-secondary" href="/store">
            Continue shopping
          </Link>
        </div>

        {!authenticated && !loading ? (
          <div className="cart-guest-banner">
            <div>
              <strong>Guest cart active</strong>
              <p>Sign in to sync your cart, addresses, and orders across devices.</p>
            </div>
            <Link className="button button-small" href="/auth/sign-in?redirectTo=/cart">
              Sign in
            </Link>
          </div>
        ) : null}

        <div className="cart-list">
          {loading ? (
            <p className="admin-copy">Loading your cart...</p>
          ) : cartItems.length ? (
            cartItems.map(({ product, quantity }) => (
              <article className="cart-line-card" key={product.id}>
                <div className="cart-line-identity">
                  <div className="cart-line-thumb">
                    <Image src={product.image} alt={product.name} fill className="product-image" sizes="96px" />
                  </div>
                  <div className="cart-line-copy">
                    <p className="shopper-category">{product.badge}</p>
                    <strong>{product.name}</strong>
                    <p>{product.shortDescription}</p>
                    <span>{formatStoreCurrency(product.salePrice, settings)} each</span>
                  </div>
                </div>

                <div className="cart-line-controls">
                  <div className="cart-qty-control">
                    <button className="button button-secondary button-small" type="button" onClick={() => void updateQuantity(product.id, quantity - 1)}>
                      -
                    </button>
                    <span className="entity-chip entity-chip-dark">{quantity}</span>
                    <button className="button button-secondary button-small" type="button" onClick={() => void updateQuantity(product.id, quantity + 1)}>
                      +
                    </button>
                  </div>
                  <strong>{formatStoreCurrency(product.salePrice * quantity, settings)}</strong>
                  <button className="button button-secondary button-small" type="button" onClick={() => void removeItem(product.id)}>
                    Remove
                  </button>
                </div>
              </article>
            ))
          ) : (
            <div className="cart-empty-state">
              <h2>Your cart is empty.</h2>
              <p>Browse the store to add herbal support, wellness kits, and home-practice essentials.</p>
              <Link className="button" href="/store">
                Explore the store
              </Link>
            </div>
          )}
        </div>
      </div>

      <aside className="cart-summary-panel">
        <div className="cart-summary-card">
          <div className="commerce-status-card">
            <div>
              <strong>Subtotal</strong>
              <p>{formatStoreCurrency(subtotal, settings)}</p>
            </div>
            <span className="status-pill status-neutral">{cartItems.length} products</span>
          </div>
          <div className="commerce-status-card">
            <div>
              <strong>Shipping</strong>
              <p>{formatStoreCurrency(shipping, settings)}</p>
            </div>
            <span className="status-pill status-warning">{shipping ? "Applied" : "Free"}</span>
          </div>
          <div className="commerce-status-card">
            <div>
              <strong>Total</strong>
              <p>{formatStoreCurrency(total, settings)}</p>
            </div>
            <span className="status-pill status-success">Ready</span>
          </div>
        </div>

        <Link className="button" href={authenticated ? "/checkout" : "/auth/sign-in?redirectTo=/checkout"}>
          {authenticated ? "Proceed to checkout" : "Sign in to checkout"}
        </Link>
      </aside>
    </section>
  );
}
