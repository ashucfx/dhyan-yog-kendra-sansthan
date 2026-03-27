"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "./cart-provider";

export function AddToCartButton({
  productId,
  checkoutHref,
  compact = false
}: {
  productId: string;
  checkoutHref: string;
  compact?: boolean;
}) {
  const { addItem } = useCart();
  const pathname = usePathname();
  const [added, setAdded] = useState(false);

  async function handleAdd() {
    const result = await addItem(productId, 1);
    if (!result.ok) {
      if (result.requiresAuth) {
        window.location.href = `/auth/sign-in?redirectTo=${encodeURIComponent(pathname || checkoutHref)}`;
      }
      return;
    }
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <>
      <button className={`button ${compact ? "button-small" : ""}`} type="button" onClick={handleAdd}>
        {added ? "Added" : "Add to Cart"}
      </button>
      <Link className={`button button-secondary ${compact ? "button-small" : ""}`} href={checkoutHref}>
        Buy Now
      </Link>
    </>
  );
}
