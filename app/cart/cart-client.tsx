"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import type { CommerceProduct, CommerceSettings } from "@/lib/commerce";
import { formatStoreCurrency } from "@/lib/commerce-ui";
import { useCart } from "@/app/components/cart-provider";

type AppliedCoupon = {
  code: string;
  discount: number;
  discountLabel: string;
};

export function CartClient({ products, settings }: { products: CommerceProduct[]; settings: CommerceSettings }) {
  const { items, loading, authenticated, removeItem, updateQuantity } = useCart();

  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

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
  const discount = appliedCoupon ? Math.min(appliedCoupon.discount, subtotal) : 0;
  const amountAfterDiscount = subtotal - discount;
  const shipping = amountAfterDiscount >= 1499 || amountAfterDiscount === 0 ? 0 : 120;
  const total = amountAfterDiscount + shipping;

  async function handleApplyCoupon() {
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal })
      });
      const data = (await res.json()) as {
        valid?: boolean;
        message?: string;
        discount?: number;
        discountLabel?: string;
        coupon?: { code: string };
      };

      if (!res.ok || !data.valid) {
        setCouponError(data.message ?? "Coupon is not valid.");
        setAppliedCoupon(null);
        return;
      }

      setAppliedCoupon({
        code: data.coupon?.code ?? code,
        discount: data.discount ?? 0,
        discountLabel: data.discountLabel ?? ""
      });
      setCouponCode("");
    } catch {
      setCouponError("Unable to apply coupon. Please try again.");
    } finally {
      setCouponLoading(false);
    }
  }

  function handleRemoveCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
  }

  return (
    <section className="section cart-shell page-end-section">
      <div className="cart-main-panel">
        <div className="cart-header">
          <div>
            <p className="eyebrow">Cart</p>
            <h1 className="page-title">Review your selected products before checkout.</h1>
          </div>
          <Link className="button button-secondary cart-header-action" href="/store">
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
          <div className="cart-summary-head">
            <p className="eyebrow">Order summary</p>
            <h2>{cartItems.length} {cartItems.length === 1 ? "item" : "items"}</h2>
          </div>

          {cartItems.length > 0 ? (
            <div className="cart-coupon-row">
              {appliedCoupon ? (
                <div className="cart-coupon-applied">
                  <div>
                    <span className="entity-chip entity-chip-dark">{appliedCoupon.code}</span>
                    <span className="cart-coupon-label">{appliedCoupon.discountLabel}</span>
                  </div>
                  <button className="button button-secondary button-small" type="button" onClick={handleRemoveCoupon}>
                    Remove
                  </button>
                </div>
              ) : (
                <>
                  <div className="cart-coupon-input-row">
                    <input
                      className="field-input cart-coupon-input"
                      type="text"
                      placeholder="Coupon code"
                      value={couponCode}
                      onChange={(e) => { setCouponCode(e.target.value); setCouponError(null); }}
                      onKeyDown={(e) => { if (e.key === "Enter") void handleApplyCoupon(); }}
                      disabled={couponLoading || subtotal === 0}
                      maxLength={32}
                      aria-label="Coupon code"
                    />
                    <button
                      className="button button-secondary button-small"
                      type="button"
                      onClick={() => void handleApplyCoupon()}
                      disabled={couponLoading || !couponCode.trim() || subtotal === 0}
                    >
                      {couponLoading ? "..." : "Apply"}
                    </button>
                  </div>
                  {couponError ? <p className="cart-coupon-error">{couponError}</p> : null}
                </>
              )}
            </div>
          ) : null}

          <div className="cart-summary-rows">
            <div className="cart-summary-row">
              <span>Subtotal</span>
              <strong>{formatStoreCurrency(subtotal, settings)}</strong>
            </div>
            {discount > 0 ? (
              <div className="cart-summary-row cart-summary-row-discount">
                <span>Discount ({appliedCoupon!.code})</span>
                <strong>−{formatStoreCurrency(discount, settings)}</strong>
              </div>
            ) : null}
            <div className="cart-summary-row">
              <span>Shipping</span>
              <strong>{shipping ? formatStoreCurrency(shipping, settings) : "Free"}</strong>
            </div>
            <div className="cart-summary-row cart-summary-row-total">
              <span>Total</span>
              <strong>{formatStoreCurrency(total, settings)}</strong>
            </div>
          </div>
          <p className="cart-summary-note">
            Free shipping applies on orders above {formatStoreCurrency(1499, settings)}.
          </p>
        </div>

        <Link className="button" href={authenticated ? "/checkout" : "/auth/sign-in?redirectTo=/checkout"}>
          {authenticated ? "Proceed to checkout" : "Sign in to checkout"}
        </Link>
      </aside>
    </section>
  );
}
