"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

type CartItem = {
  id?: string;
  productId: string;
  quantity: number;
};

type CartActionResult = {
  ok: boolean;
  requiresAuth?: boolean;
  message?: string;
};

type CartContextValue = {
  items: CartItem[];
  loading: boolean;
  authenticated: boolean;
  addItem: (productId: string, quantity?: number) => Promise<CartActionResult>;
  removeItem: (productId: string) => Promise<CartActionResult>;
  updateQuantity: (productId: string, quantity: number) => Promise<CartActionResult>;
  clearCart: () => Promise<CartActionResult>;
  refreshCart: () => Promise<void>;
};

const CartContext = createContext<CartContextValue | null>(null);
const guestCartStorageKey = "dhyan_guest_cart";

async function parseResponse(response: Response) {
  const payload = (await response.json().catch(() => ({}))) as {
    items?: CartItem[];
    message?: string;
  };

  return payload;
}

function readGuestCart() {
  if (typeof window === "undefined") {
    return [] as CartItem[];
  }

  try {
    const raw = window.localStorage.getItem(guestCartStorageKey);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as CartItem[];
    return parsed
      .map((item) => ({
        productId: item.productId,
        quantity: Math.max(1, Math.round(item.quantity))
      }))
      .filter((item) => item.productId);
  } catch {
    return [];
  }
}

function writeGuestCart(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  if (!items.length) {
    window.localStorage.removeItem(guestCartStorageKey);
    return;
  }

  window.localStorage.setItem(guestCartStorageKey, JSON.stringify(items));
}

function mergeGuestItem(items: CartItem[], productId: string, quantity: number) {
  const normalizedQuantity = Math.max(1, Math.round(quantity));
  const existing = items.find((item) => item.productId === productId);

  if (existing) {
    return items.map((item) =>
      item.productId === productId
        ? {
            ...item,
            quantity: item.quantity + normalizedQuantity
          }
        : item
    );
  }

  return [...items, { productId, quantity: normalizedQuantity }];
}

function setGuestItemQuantity(items: CartItem[], productId: string, quantity: number) {
  const normalizedQuantity = Math.max(0, Math.round(quantity));
  if (normalizedQuantity <= 0) {
    return items.filter((item) => item.productId !== productId);
  }

  const existing = items.find((item) => item.productId === productId);
  if (!existing) {
    return [...items, { productId, quantity: normalizedQuantity }];
  }

  return items.map((item) =>
    item.productId === productId
      ? {
          ...item,
          quantity: normalizedQuantity
        }
      : item
  );
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);

  const refreshCart = useCallback(async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/cart", { cache: "no-store" });
      const payload = await parseResponse(response);

      if (response.status === 401) {
        setItems(readGuestCart());
        setAuthenticated(false);
        return;
      }

      if (!response.ok) {
        throw new Error(payload.message || "Unable to load cart.");
      }

      setItems(payload.items ?? []);
      setAuthenticated(true);
    } catch {
      setItems(readGuestCart());
      setAuthenticated(false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshCart();
  }, [refreshCart]);

  useEffect(() => {
    let active = true;

    let subscription: { unsubscribe: () => void } | null = null;

    try {
      const supabase = getSupabaseBrowserClient();
      const listener = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
        if (!active) {
          return;
        }

        if (!session?.user) {
          setAuthenticated(false);
          setItems(readGuestCart());
          return;
        }

        void refreshCart();
      });

      subscription = listener.data.subscription;
    } catch {
      subscription = null;
    }

    return () => {
      active = false;
      subscription?.unsubscribe();
    };
  }, [refreshCart]);

  useEffect(() => {
    if (!authenticated || loading) {
      return;
    }

    const syncGuestCart = async () => {
      const guestItems = readGuestCart();
      if (!guestItems.length) {
        return;
      }

      try {
        for (const item of guestItems) {
          await fetch("/api/cart", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productId: item.productId, quantity: item.quantity })
          });
        }

        writeGuestCart([]);
        await refreshCart();
      } catch {
        // Keep the local cart so the merge can be retried later.
      }
    };

    void syncGuestCart();
  }, [authenticated, loading, refreshCart]);

  const value = useMemo<CartContextValue>(
    () => ({
      items,
      loading,
      authenticated,
      async addItem(productId, quantity = 1) {
        if (!authenticated) {
          const nextItems = mergeGuestItem(items, productId, quantity);
          setItems(nextItems);
          writeGuestCart(nextItems);
          return { ok: true };
        }

        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity })
        });
        const payload = await parseResponse(response);
        if (response.status === 401) {
          setAuthenticated(false);
          setItems(readGuestCart());
          return { ok: false, requiresAuth: true, message: payload.message };
        }
        if (!response.ok) {
          return { ok: false, message: payload.message || "Unable to add to cart." };
        }
        setItems(payload.items ?? []);
        setAuthenticated(true);
        return { ok: true };
      },
      async removeItem(productId) {
        if (!authenticated) {
          const nextItems = items.filter((item) => item.productId !== productId);
          setItems(nextItems);
          writeGuestCart(nextItems);
          return { ok: true };
        }

        const response = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId })
        });
        const payload = await parseResponse(response);
        if (response.status === 401) {
          setAuthenticated(false);
          setItems(readGuestCart());
          return { ok: false, requiresAuth: true, message: payload.message };
        }
        if (!response.ok) {
          return { ok: false, message: payload.message || "Unable to remove this item." };
        }
        setItems(payload.items ?? []);
        return { ok: true };
      },
      async updateQuantity(productId, quantity) {
        if (!authenticated) {
          const nextItems = setGuestItemQuantity(items, productId, quantity);
          setItems(nextItems);
          writeGuestCart(nextItems);
          return { ok: true };
        }

        const response = await fetch("/api/cart", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity })
        });
        const payload = await parseResponse(response);
        if (response.status === 401) {
          setAuthenticated(false);
          setItems(readGuestCart());
          return { ok: false, requiresAuth: true, message: payload.message };
        }
        if (!response.ok) {
          return { ok: false, message: payload.message || "Unable to update cart." };
        }
        setItems(payload.items ?? []);
        return { ok: true };
      },
      async clearCart() {
        if (!authenticated) {
          setItems([]);
          writeGuestCart([]);
          return { ok: true };
        }

        const response = await fetch("/api/cart", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({})
        });
        if (!response.ok) {
          return { ok: false, message: "Unable to clear cart." };
        }
        setItems([]);
        return { ok: true };
      },
      refreshCart
    }),
    [authenticated, items, loading, refreshCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider.");
  }
  return context;
}
