"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CommerceAddress, CommerceCoupon, CommerceProduct, CommerceSettings } from "@/lib/commerce";
import { formatStoreCurrency } from "@/lib/commerce-ui";
import { useCart } from "@/app/components/cart-provider";

type CheckoutClientProps = {
  products: CommerceProduct[];
  coupons: CommerceCoupon[];
  settings: CommerceSettings;
  initialName: string;
  initialEmail: string;
  initialPhone: string;
  initialAddresses: CommerceAddress[];
};

type RazorpayWindow = Window & {
  Razorpay?: new (options: Record<string, unknown>) => {
    open: () => void;
  };
};

async function loadRazorpayScript() {
  if ((window as RazorpayWindow).Razorpay) {
    return true;
  }

  return await new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export function CheckoutClient({
  products,
  coupons,
  settings,
  initialName,
  initialEmail,
  initialPhone,
  initialAddresses
}: CheckoutClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, addItem, clearCart, loading, authenticated } = useCart();
  const selectedProductId = searchParams.get("product");
  const paypalInternalOrder = searchParams.get("internal_order");
  const paypalToken = searchParams.get("token");
  const [customerName, setCustomerName] = useState(initialName);
  const [customerEmail, setCustomerEmail] = useState(initialEmail);
  const [customerPhone, setCustomerPhone] = useState(initialPhone);
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddresses[0]?.id ?? "");
  const [line1, setLine1] = useState(initialAddresses[0]?.line1 ?? "");
  const [city, setCity] = useState(initialAddresses[0]?.city ?? "");
  const [stateName, setStateName] = useState(initialAddresses[0]?.state ?? "");
  const [postalCode, setPostalCode] = useState(initialAddresses[0]?.postalCode ?? "");
  const [country, setCountry] = useState(initialAddresses[0]?.country ?? "India");
  const [couponCode, setCouponCode] = useState("");
  const [paymentProvider, setPaymentProvider] = useState<"Razorpay" | "PayPal">("Razorpay");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  useEffect(() => {
    if (!selectedProductId) {
      return;
    }

    const existing = items.find((item) => item.productId === selectedProductId);
    if (existing || loading) {
      return;
    }

    void addItem(selectedProductId, 1).then((result) => {
      if (result.requiresAuth) {
        window.location.href = "/auth/sign-in?redirectTo=/checkout";
      }
    });
  }, [addItem, items, loading, selectedProductId]);

  useEffect(() => {
    const selectedAddress = initialAddresses.find((address) => address.id === selectedAddressId);
    if (!selectedAddress) {
      return;
    }

    setCustomerName(selectedAddress.fullName || customerName);
    setCustomerPhone(selectedAddress.phone || customerPhone);
    setLine1(selectedAddress.line1);
    setCity(selectedAddress.city);
    setStateName(selectedAddress.state);
    setPostalCode(selectedAddress.postalCode);
    setCountry(selectedAddress.country);
  }, [customerName, customerPhone, initialAddresses, selectedAddressId]);

  useEffect(() => {
    async function capturePayPalReturn() {
      if (!paypalInternalOrder || !paypalToken) {
        return;
      }

      setBusy(true);
      try {
        const response = await fetch("/api/payments/paypal/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            internalOrderId: paypalInternalOrder,
            paypalOrderId: paypalToken
          })
        });
        const result = (await response.json()) as { message?: string };
        if (!response.ok) {
          throw new Error(result.message || "Unable to confirm PayPal payment.");
        }
        await clearCart();
        router.replace(`/checkout/success?order=${paypalInternalOrder}`);
      } catch (error) {
        setMessageTone("error");
        setMessage(error instanceof Error ? error.message : "Unable to confirm PayPal payment.");
      } finally {
        setBusy(false);
      }
    }

    void capturePayPalReturn();
  }, [clearCart, paypalInternalOrder, paypalToken, router]);

  const selectedItems = useMemo(
    () =>
      items
        .map((item) => {
          const product = products.find((entry) => entry.id === item.productId);
          return product ? { product, quantity: item.quantity } : null;
        })
        .filter((item): item is { product: CommerceProduct; quantity: number } => Boolean(item)),
    [items, products]
  );

  const subtotal = selectedItems.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const appliedCoupon = coupons.find((coupon) => coupon.active && coupon.code === couponCode.trim().toUpperCase()) ?? null;
  const discount =
    appliedCoupon && subtotal >= appliedCoupon.minimumOrderAmount
      ? appliedCoupon.discountType === "percent"
        ? Math.round((subtotal * appliedCoupon.discountValue) / 100)
        : appliedCoupon.discountValue
      : 0;
  const shipping = subtotal - discount >= 1499 || subtotal === 0 ? 0 : 120;
  const total = Math.max(0, subtotal - discount + shipping);

  async function redirectToSuccess(orderId: string) {
    await clearCart();
    router.push(`/checkout/success?order=${orderId}`);
    router.refresh();
  }

  async function handleCheckout() {
    if (!authenticated) {
      window.location.href = "/auth/sign-in?redirectTo=/checkout";
      return;
    }

    if (!selectedItems.length) {
      setMessageTone("error");
      setMessage("Add products to your cart before checkout.");
      return;
    }

    setBusy(true);
    setMessage("");

    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName,
          customerEmail,
          customerPhone,
          shippingAddress: {
            line1,
            city,
            state: stateName,
            postalCode,
            country
          },
          items: selectedItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          couponCode,
          paymentProvider
        })
      });

      const result = (await response.json()) as {
        message?: string;
        order?: { id: string };
        gateway?: Record<string, unknown>;
      };

      if (response.status === 401) {
        window.location.href = "/auth/sign-in?redirectTo=/checkout";
        return;
      }

      if (!response.ok || !result.order || !result.gateway) {
        throw new Error(result.message || "Unable to create order.");
      }

      if (paymentProvider === "Razorpay") {
        if (result.gateway.mock) {
          const confirm = await fetch("/api/payments/mock/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: result.order.id })
          });
          const confirmResult = (await confirm.json()) as { message?: string };
          if (!confirm.ok) {
            throw new Error(confirmResult.message || "Unable to confirm mock payment.");
          }
          await redirectToSuccess(result.order.id);
          return;
        }

        const loaded = await loadRazorpayScript();
        if (!loaded || !(window as RazorpayWindow).Razorpay) {
          throw new Error("Razorpay checkout could not be loaded.");
        }

        const gateway = result.gateway as {
          keyId: string;
          orderId: string;
          amount: number;
          currency: string;
        };

        const razorpay = new (window as RazorpayWindow).Razorpay!({
          key: gateway.keyId,
          amount: gateway.amount,
          currency: gateway.currency,
          name: "Dhyan Yog Kendra",
          description: "Wellness store order",
          order_id: gateway.orderId,
          prefill: {
            name: customerName,
            email: customerEmail,
            contact: customerPhone
          },
          handler: async (paymentResponse: Record<string, string>) => {
            const verifyResponse = await fetch("/api/payments/razorpay/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                internalOrderId: result.order?.id,
                razorpayOrderId: paymentResponse.razorpay_order_id,
                razorpayPaymentId: paymentResponse.razorpay_payment_id,
                razorpaySignature: paymentResponse.razorpay_signature
              })
            });
            const verifyResult = (await verifyResponse.json()) as { message?: string };
            if (!verifyResponse.ok) {
              throw new Error(verifyResult.message || "Unable to verify payment.");
            }
            await redirectToSuccess(result.order!.id);
          },
          theme: {
            color: "#8f251b"
          }
        });

        razorpay.open();
        return;
      }

      const gateway = result.gateway as { approveLink?: string; mock?: boolean };
      if (gateway.mock || !gateway.approveLink) {
        const confirm = await fetch("/api/payments/mock/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: result.order.id })
        });
        const confirmResult = (await confirm.json()) as { message?: string };
        if (!confirm.ok) {
          throw new Error(confirmResult.message || "Unable to confirm demo payment.");
        }
        await redirectToSuccess(result.order.id);
        return;
      }

      window.location.href = gateway.approveLink;
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Unable to process checkout.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="section checkout-layout page-end-section">
      <div className="commerce-panel">
        <div className="section-heading narrow">
          <p className="eyebrow">Checkout</p>
          <h1 className="page-title">Review your cart and complete your order.</h1>
        </div>

        <div className="commerce-list">
          {loading ? (
            <p className="admin-copy">Loading your cart...</p>
          ) : selectedItems.length ? (
            selectedItems.map((item) => (
              <div className="commerce-list-item" key={item.product.id}>
                <div>
                  <strong>{item.product.name}</strong>
                  <p>
                    {formatStoreCurrency(item.product.salePrice, settings)} x {item.quantity}
                  </p>
                </div>
                <div className="commerce-list-side">
                  <span>{formatStoreCurrency(item.product.salePrice * item.quantity, settings)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="admin-copy">Your cart is empty.</p>
          )}
        </div>
      </div>

      <div className="commerce-panel">
        <div className="admin-form-grid">
          {initialAddresses.length ? (
            <select value={selectedAddressId} onChange={(event) => setSelectedAddressId(event.target.value)}>
              <option value="">Use a custom address</option>
              {initialAddresses.map((address) => (
                <option key={address.id} value={address.id}>
                  {address.label || address.fullName} - {address.city}
                </option>
              ))}
            </select>
          ) : null}
          <input placeholder="Full name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
          <input placeholder="Email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
          <input placeholder="Phone number" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
          <input placeholder="Address line" value={line1} onChange={(event) => setLine1(event.target.value)} />
          <input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
          <input placeholder="State" value={stateName} onChange={(event) => setStateName(event.target.value)} />
          <input placeholder="Postal code" value={postalCode} onChange={(event) => setPostalCode(event.target.value)} />
          <input placeholder="Country" value={country} onChange={(event) => setCountry(event.target.value)} />
          <input placeholder="Coupon code" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} />
          <select value={paymentProvider} onChange={(event) => setPaymentProvider(event.target.value as "Razorpay" | "PayPal")}>
            <option value="Razorpay">Razorpay</option>
            <option value="PayPal">PayPal</option>
          </select>
        </div>

        <div className="commerce-stack">
          <div className="commerce-status-card">
            <div>
              <strong>Subtotal</strong>
              <p>{formatStoreCurrency(subtotal, settings)}</p>
            </div>
            <span className="status-pill status-neutral">{selectedItems.length} items</span>
          </div>
          <div className="commerce-status-card">
            <div>
              <strong>Discount</strong>
              <p>{formatStoreCurrency(discount, settings)}</p>
            </div>
            <span className="status-pill status-neutral">{appliedCoupon ? appliedCoupon.code : "No coupon"}</span>
          </div>
          <div className="commerce-status-card">
            <div>
              <strong>Shipping</strong>
              <p>{formatStoreCurrency(shipping, settings)}</p>
            </div>
            <span className="status-pill status-warning">{paymentProvider}</span>
          </div>
          <div className="commerce-status-card">
            <div>
              <strong>Total</strong>
              <p>{formatStoreCurrency(total, settings)}</p>
            </div>
            <span className="status-pill status-success">Ready to pay</span>
          </div>
        </div>

        {message ? <p className={`form-status form-status-${messageTone}`}>{message}</p> : null}
        <button className="button" type="button" disabled={busy || loading || !selectedItems.length} onClick={() => void handleCheckout()}>
          {busy ? "Processing..." : `Pay ${formatStoreCurrency(total, settings)}`}
        </button>
      </div>
    </section>
  );
}
