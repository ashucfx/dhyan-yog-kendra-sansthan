"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { CommerceAddress, CommerceProduct, CommerceSettings } from "@/lib/commerce";
import { isValidIndianPostalCode } from "@/lib/commerce-pricing";
import { validateEmail, validateIndianMobile } from "@/lib/customer-validation";
import { formatStoreCurrency } from "@/lib/commerce-ui";
import { useCart } from "@/app/components/cart-provider";

type CheckoutClientProps = {
  products: CommerceProduct[];
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

type AppliedCouponState = {
  code: string;
  discount: number;
};

type ShippingEstimateState = {
  postalCode: string;
  shippingCharge: number;
  etaLabel?: string;
  message: string;
};

type CheckoutFieldErrors = {
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  line1?: string;
  city?: string;
  stateName?: string;
  postalCode?: string;
  country?: string;
};

async function loadRazorpayScript() {
  if ((window as RazorpayWindow).Razorpay) return true;
  return new Promise<boolean>((resolve) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function StepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const steps = ["Cart", "Delivery", "Payment"] as const;
  return (
    <div className="checkout-steps">
      {steps.map((label, index) => {
        const num = (index + 1) as 1 | 2 | 3;
        const done = step > num;
        const active = step === num;
        return (
          <div className="checkout-step-track" key={label}>
            <div className={`checkout-step-item ${active ? "checkout-step-active" : ""} ${done ? "checkout-step-done" : ""}`}>
              <span className="checkout-step-num">{done ? "✓" : num}</span>
              <span className="checkout-step-label">{label}</span>
            </div>
            {index < 2 ? <div className={`checkout-step-connector ${done ? "checkout-step-connector-done" : ""}`} /> : null}
          </div>
        );
      })}
    </div>
  );
}

export function CheckoutClient({
  products,
  settings,
  initialName,
  initialEmail,
  initialPhone,
  initialAddresses,
}: CheckoutClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { items, addItem, clearCart, loading, authenticated } = useCart();

  const selectedProductId = searchParams.get("product");
  const paypalInternalOrder = searchParams.get("internal_order");
  const paypalToken = searchParams.get("token");
  const paypalCancelled = searchParams.get("paypal_cancel");

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [customerName, setCustomerName] = useState(initialName);
  const [customerEmail, setCustomerEmail] = useState(initialEmail);
  const [customerPhone, setCustomerPhone] = useState(initialPhone);
  const [selectedAddressId, setSelectedAddressId] = useState(initialAddresses[0]?.id ?? "");
  const [line1, setLine1] = useState(initialAddresses[0]?.line1 ?? "");
  const [landmark, setLandmark] = useState(initialAddresses[0]?.landmark ?? "");
  const [city, setCity] = useState(initialAddresses[0]?.city ?? "");
  const [stateName, setStateName] = useState(initialAddresses[0]?.state ?? "");
  const [postalCode, setPostalCode] = useState(initialAddresses[0]?.postalCode ?? "");
  const [country, setCountry] = useState(initialAddresses[0]?.country ?? "India");
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCouponState | null>(null);
  const [shippingEstimate, setShippingEstimate] = useState<ShippingEstimateState | null>(null);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [addressWarning, setAddressWarning] = useState("");
  const [busy, setBusy] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [shippingBusy, setShippingBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");

  // "Buy Now" flow — add the product if not in cart
  useEffect(() => {
    if (!selectedProductId) return;
    const existing = items.find((item) => item.productId === selectedProductId);
    if (existing || loading) return;
    void addItem(selectedProductId, 1).then((result) => {
      if (result.requiresAuth) {
        window.location.href = "/auth/sign-in?redirectTo=/checkout";
      }
    });
  }, [addItem, items, loading, selectedProductId]);

  // Populate form when a saved address is selected
  useEffect(() => {
    const addr = initialAddresses.find((a) => a.id === selectedAddressId);
    if (!addr) return;
    setCustomerName(addr.fullName || initialName);
    setCustomerPhone(addr.phone || initialPhone);
    setLine1(addr.line1);
    setLandmark(addr.landmark ?? "");
    setCity(addr.city);
    setStateName(addr.state);
    setPostalCode(addr.postalCode);
    setCountry(addr.country);
    setFieldErrors({});
  }, [initialAddresses, initialName, initialPhone, selectedAddressId]);

  // Reset coupon when code changes
  useEffect(() => {
    if (appliedCoupon && appliedCoupon.code !== couponCode.trim().toUpperCase()) {
      setAppliedCoupon(null);
    }
  }, [appliedCoupon, couponCode]);

  // Reset shipping when address changes
  useEffect(() => {
    setShippingEstimate((current) =>
      current && current.postalCode === postalCode.trim() ? current : null
    );
    setAddressWarning("");
  }, [postalCode, line1, city, stateName, landmark, country]);

  // Auto-validate shipping when a saved address is loaded
  useEffect(() => {
    if (!selectedAddressId || !postalCode.trim() || !country.trim()) return;
    let active = true;

    async function autoValidate() {
      setShippingBusy(true);
      try {
        const response = await fetch("/api/shipping/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postalCode: postalCode.trim(), subtotal: Math.max(0, subtotal - discount), country }),
        });
        const result = (await response.json()) as {
          postalCode?: string;
          shippingCharge?: number;
          etaLabel?: string;
          message?: string;
        };
        if (!active) return;
        if (!response.ok || typeof result.shippingCharge !== "number" || !result.postalCode) {
          setShippingEstimate(null);
          setAddressWarning(result.message || "Delivery is not available for this pincode.");
          return;
        }
        setShippingEstimate({ postalCode: result.postalCode, shippingCharge: result.shippingCharge, etaLabel: result.etaLabel, message: result.message || "Delivery available." });
        setAddressWarning("");
      } finally {
        if (active) setShippingBusy(false);
      }
    }

    void autoValidate();
    return () => { active = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAddressId]);

  // Capture PayPal return
  useEffect(() => {
    async function capturePayPalReturn() {
      if (!paypalInternalOrder || !paypalToken) return;
      setBusy(true);
      try {
        const response = await fetch("/api/payments/paypal/capture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ internalOrderId: paypalInternalOrder, paypalOrderId: paypalToken }),
        });
        const result = (await response.json()) as { message?: string };
        if (!response.ok) throw new Error(result.message || "Unable to confirm PayPal payment.");
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

  useEffect(() => {
    if (paypalCancelled) {
      setMessageTone("error");
      setMessage("PayPal payment was cancelled. Select a payment method to try again.");
    }
  }, [paypalCancelled]);

  const selectedItems = useMemo(
    () =>
      items
        .map((item) => {
          const product =
            products.find((p) => p.id === item.productId) ??
            products.find((p) => p.slug === item.productId);
          return product ? { product, quantity: item.quantity } : null;
        })
        .filter((item): item is { product: CommerceProduct; quantity: number } => Boolean(item)),
    [items, products]
  );

  const subtotal = selectedItems.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const discount = appliedCoupon?.discount ?? 0;
  const shipping = shippingEstimate?.shippingCharge ?? (subtotal - discount >= 1499 || subtotal === 0 ? 0 : 120);
  const total = Math.max(0, subtotal - discount + shipping);

  function validateCheckoutFields() {
    const errors: CheckoutFieldErrors = {};
    if (!customerName.trim()) errors.customerName = "Full name is required.";
    if (!validateEmail(customerEmail)) errors.customerEmail = "Enter a valid email address.";
    if (!validateIndianMobile(customerPhone)) errors.customerPhone = "Enter a valid 10-digit mobile number.";
    if (!line1.trim()) errors.line1 = "Address line is required.";
    if (!city.trim()) errors.city = "City is required.";
    if (!stateName.trim()) errors.stateName = "State is required.";
    if (!isValidIndianPostalCode(postalCode)) errors.postalCode = "Enter a valid 6-digit pincode.";
    if (country.trim().toLowerCase() !== "india") errors.country = "Only India is supported right now.";
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function validateCoupon() {
    const normalizedCode = couponCode.trim().toUpperCase();
    if (!normalizedCode) {
      setAppliedCoupon(null);
      setMessageTone("error");
      setMessage("Enter a coupon code first.");
      return;
    }
    setCouponBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: normalizedCode, subtotal }),
      });
      const result = (await response.json()) as { message?: string; coupon?: { code: string }; discount?: number };
      if (!response.ok || !result.coupon || typeof result.discount !== "number") {
        throw new Error(result.message || "Coupon is not valid.");
      }
      setAppliedCoupon({ code: result.coupon.code, discount: result.discount });
      setCouponCode(result.coupon.code);
      setMessageTone("success");
      setMessage(result.message || "Coupon applied.");
    } catch (error) {
      setAppliedCoupon(null);
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Coupon is not valid.");
    } finally {
      setCouponBusy(false);
    }
  }

  async function validateShippingPin(silent = false) {
    const pin = postalCode.trim();
    if (!pin) {
      if (!silent) { setMessageTone("error"); setMessage("Enter a pincode to check delivery."); }
      return null;
    }
    setShippingBusy(true);
    if (!silent) setMessage("");
    try {
      const response = await fetch("/api/shipping/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ postalCode: pin, subtotal: Math.max(0, subtotal - discount), country }),
      });
      const result = (await response.json()) as { postalCode?: string; shippingCharge?: number; etaLabel?: string; message?: string };
      if (!response.ok || typeof result.shippingCharge !== "number" || !result.postalCode) {
        throw new Error(result.message || "Delivery not available for this pincode.");
      }
      const estimate: ShippingEstimateState = { postalCode: result.postalCode, shippingCharge: result.shippingCharge, etaLabel: result.etaLabel, message: result.message || "Delivery available." };
      setShippingEstimate(estimate);
      setAddressWarning("");
      if (!silent) { setMessageTone("success"); setMessage(estimate.message); }
      return estimate;
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Delivery not available.";
      setShippingEstimate(null);
      setAddressWarning(msg);
      if (!silent) { setMessageTone("error"); setMessage(msg); }
      return null;
    } finally {
      setShippingBusy(false);
    }
  }

  function handleContinueToDelivery() {
    if (!selectedItems.length) {
      setMessageTone("error");
      setMessage("Add items to your cart before continuing.");
      return;
    }
    setMessage("");
    setStep(2);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleContinueToPayment() {
    if (!authenticated) {
      window.location.href = "/auth/sign-in?redirectTo=/checkout";
      return;
    }
    if (!validateCheckoutFields()) {
      setMessageTone("error");
      setMessage("Fix the highlighted fields before continuing.");
      return;
    }
    const estimate = await validateShippingPin();
    if (!estimate) return;
    setMessage("");
    setStep(3);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function redirectToSuccess(orderId: string) {
    await clearCart();
    router.push(`/checkout/success?order=${orderId}`);
    router.refresh();
  }

  async function handleCheckout(paymentProvider: "Razorpay" | "PayPal") {
    if (!authenticated) {
      window.location.href = "/auth/sign-in?redirectTo=/checkout";
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
          shippingAddress: { line1, landmark, city, state: stateName, postalCode, country },
          items: selectedItems.map((item) => ({ productId: item.product.id, quantity: item.quantity })),
          couponCode: appliedCoupon?.code ?? couponCode.trim().toUpperCase(),
          paymentProvider,
        }),
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

      // ── Razorpay ──────────────────────────────────────────────────────────
      if (paymentProvider === "Razorpay") {
        if (result.gateway.mock) {
          const confirm = await fetch("/api/payments/mock/confirm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: result.order.id }),
          });
          const confirmResult = (await confirm.json()) as { message?: string };
          if (!confirm.ok) throw new Error(confirmResult.message || "Mock payment failed.");
          await redirectToSuccess(result.order.id);
          return;
        }

        const loaded = await loadRazorpayScript();
        if (!loaded || !(window as RazorpayWindow).Razorpay) {
          throw new Error("Razorpay checkout could not be loaded. Check your connection and try again.");
        }

        const gw = result.gateway as { keyId: string; orderId: string; amount: number; currency: string };
        const internalOrderId = result.order.id;

        // setBusy(false) here so the UI is interactive while the modal is open.
        // The handler and ondismiss callbacks manage state from this point.
        setBusy(false);

        const razorpay = new (window as RazorpayWindow).Razorpay!({
          key: gw.keyId,
          amount: gw.amount,
          currency: gw.currency,
          name: "Dhyan Yog Kendra",
          description: "Wellness store order",
          order_id: gw.orderId,
          prefill: { name: customerName, email: customerEmail, contact: customerPhone },
          theme: { color: "#8f251b" },
          handler: async (paymentResponse: Record<string, string>) => {
            setBusy(true);
            setMessageTone("success");
            setMessage("Verifying payment…");
            try {
              const verifyResponse = await fetch("/api/payments/razorpay/verify", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  internalOrderId,
                  razorpayOrderId: paymentResponse.razorpay_order_id,
                  razorpayPaymentId: paymentResponse.razorpay_payment_id,
                  razorpaySignature: paymentResponse.razorpay_signature,
                }),
              });
              const verifyResult = (await verifyResponse.json()) as { message?: string };
              if (!verifyResponse.ok) {
                throw new Error(verifyResult.message || "Payment verification failed.");
              }
              await redirectToSuccess(internalOrderId);
            } catch (error) {
              setBusy(false);
              setMessageTone("error");
              setMessage(error instanceof Error ? error.message : "Payment verification failed. Contact support with your order reference.");
            }
          },
          modal: {
            ondismiss: () => {
              setMessageTone("error");
              setMessage("Payment was cancelled. Select a payment method below to try again.");
            },
          },
        });

        razorpay.open();
        return;
      }

      // ── PayPal ────────────────────────────────────────────────────────────
      const gw = result.gateway as { approveLink?: string; mock?: boolean };
      if (gw.mock || !gw.approveLink) {
        const confirm = await fetch("/api/payments/mock/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: result.order.id }),
        });
        const confirmResult = (await confirm.json()) as { message?: string };
        if (!confirm.ok) throw new Error(confirmResult.message || "Demo payment failed.");
        await redirectToSuccess(result.order.id);
        return;
      }

      window.location.href = gw.approveLink;
    } catch (error) {
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Unable to process payment.");
    } finally {
      // Only clear busy here if we didn't explicitly clear it before (Razorpay path).
      // For Razorpay we returned early after opening the modal.
      setBusy((current) => (current ? false : current));
    }
  }

  // ── Order summary ─────────────────────────────────────────────────────────
  const orderSummary = (
    <aside className="checkout-summary-panel">
      <p className="eyebrow">Order summary</p>
      <div className="checkout-summary-items">
        {selectedItems.map((item) => (
          <div className="checkout-summary-line" key={item.product.id}>
            <span>{item.product.name} × {item.quantity}</span>
            <strong>{formatStoreCurrency(item.product.salePrice * item.quantity, settings)}</strong>
          </div>
        ))}
        {!selectedItems.length ? (
          <p className="admin-copy" style={{ fontSize: "0.88rem" }}>No items yet.</p>
        ) : null}
      </div>
      <div className="checkout-summary-totals">
        <div className="checkout-summary-row">
          <span>Subtotal</span>
          <strong>{formatStoreCurrency(subtotal, settings)}</strong>
        </div>
        {discount > 0 ? (
          <div className="checkout-summary-row checkout-summary-discount">
            <span>Discount ({appliedCoupon?.code})</span>
            <strong>− {formatStoreCurrency(discount, settings)}</strong>
          </div>
        ) : null}
        <div className="checkout-summary-row">
          <span>Shipping</span>
          <strong>{shipping > 0 ? formatStoreCurrency(shipping, settings) : "Free"}</strong>
        </div>
        <div className="checkout-summary-row checkout-summary-total">
          <span>Total</span>
          <strong>{formatStoreCurrency(total, settings)}</strong>
        </div>
      </div>
      {shippingEstimate?.etaLabel ? (
        <p className="checkout-summary-eta">
          Estimated arrival: {shippingEstimate.etaLabel}
        </p>
      ) : null}
    </aside>
  );

  // ── Redirect during PayPal capture ────────────────────────────────────────
  if (paypalInternalOrder && paypalToken) {
    return (
      <section className="section checkout-capture-state page-end-section">
        <div className="commerce-panel">
          <p className="eyebrow">Payment</p>
          <h1 className="page-title">{busy ? "Confirming your PayPal payment…" : "Processing complete."}</h1>
          {message ? <p className={`form-status form-status-${messageTone}`}>{message}</p> : null}
          {!busy && messageTone === "error" ? (
            <div className="admin-actions">
              <Link className="button button-secondary" href="/checkout">Back to Checkout</Link>
              <Link className="button button-secondary" href="/account/orders">My Orders</Link>
            </div>
          ) : null}
        </div>
      </section>
    );
  }

  return (
    <section className="section checkout-layout page-end-section">
      {/* ── Left: steps ─────────────────────────────────────────────────── */}
      <div className="commerce-panel checkout-steps-panel">
        <StepIndicator step={step} />

        {/* ── Step 1: Cart review ───────────────────────────────────────── */}
        {step === 1 ? (
          <div className="checkout-step-content">
            <div className="checkout-step-heading">
              <p className="eyebrow">Step 1</p>
              <h2>Review your cart</h2>
            </div>

            {loading ? (
              <p className="admin-copy">Loading cart…</p>
            ) : selectedItems.length ? (
              <div className="commerce-list">
                {selectedItems.map((item) => (
                  <div className="commerce-list-item" key={item.product.id}>
                    <div>
                      <strong>{item.product.name}</strong>
                      <p>{formatStoreCurrency(item.product.salePrice, settings)} each</p>
                    </div>
                    <div className="commerce-list-side">
                      <span className="status-pill status-neutral">× {item.quantity}</span>
                      <strong>{formatStoreCurrency(item.product.salePrice * item.quantity, settings)}</strong>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="checkout-empty-cart">
                <p>Your cart is empty.</p>
                <Link className="button button-secondary button-small" href="/store">Browse store</Link>
              </div>
            )}

            <div className="checkout-coupon-row">
              <input
                placeholder="Coupon code"
                value={couponCode}
                onChange={(event) => setCouponCode(event.target.value.toUpperCase())}
              />
              <button
                className="button button-secondary button-small"
                type="button"
                disabled={couponBusy || !subtotal}
                onClick={() => void validateCoupon()}
              >
                {couponBusy ? "Checking…" : appliedCoupon ? "Reapply" : "Apply"}
              </button>
            </div>
            {appliedCoupon ? (
              <p className="form-status form-status-success">
                Coupon {appliedCoupon.code} applied — {formatStoreCurrency(appliedCoupon.discount, settings)} off
              </p>
            ) : null}

            {message ? <p className={`form-status form-status-${messageTone}`}>{message}</p> : null}

            <div className="checkout-step-actions">
              <button
                className="button"
                type="button"
                disabled={loading || !selectedItems.length}
                onClick={handleContinueToDelivery}
              >
                Continue to Delivery
              </button>
              <Link className="button button-secondary" href="/cart">Edit Cart</Link>
            </div>
          </div>
        ) : null}

        {/* ── Step 2: Delivery ──────────────────────────────────────────── */}
        {step === 2 ? (
          <div className="checkout-step-content">
            <div className="checkout-step-heading">
              <p className="eyebrow">Step 2</p>
              <h2>Delivery address</h2>
            </div>

            <div className="admin-form-grid">
              {initialAddresses.length ? (
                <div className="admin-span-2">
                  <span className="account-field-label">Saved address</span>
                  <select
                    value={selectedAddressId}
                    onChange={(event) => setSelectedAddressId(event.target.value)}
                    style={{ marginTop: "0.4rem" }}
                  >
                    <option value="">Enter a new address</option>
                    {initialAddresses.map((address) => (
                      <option key={address.id} value={address.id}>
                        {address.label || address.fullName} — {address.city}
                      </option>
                    ))}
                  </select>
                  {addressWarning ? (
                    <p className="account-field-error" style={{ marginTop: "0.35rem" }}>{addressWarning}</p>
                  ) : null}
                </div>
              ) : (
                <div className="checkout-inline-note admin-span-2">
                  <span>No saved address.</span>
                  <Link className="inline-link" href="/account">Add one in My Account</Link>
                </div>
              )}

              <div className={`checkout-field ${fieldErrors.customerName ? "checkout-field-error" : ""}`}>
                <span className="account-field-label">Full name</span>
                <input placeholder="Full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
                {fieldErrors.customerName ? <p className="account-field-error">{fieldErrors.customerName}</p> : null}
              </div>

              <div className={`checkout-field ${fieldErrors.customerEmail ? "checkout-field-error" : ""}`}>
                <span className="account-field-label">Email</span>
                <input placeholder="Email address" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} />
                {fieldErrors.customerEmail ? <p className="account-field-error">{fieldErrors.customerEmail}</p> : null}
              </div>

              <div className={`checkout-field ${fieldErrors.customerPhone ? "checkout-field-error" : ""}`}>
                <span className="account-field-label">Mobile number</span>
                <input placeholder="10-digit mobile" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
                {fieldErrors.customerPhone ? <p className="account-field-error">{fieldErrors.customerPhone}</p> : null}
              </div>

              <div className={`checkout-field admin-span-2 ${fieldErrors.line1 ? "checkout-field-error" : ""}`}>
                <span className="account-field-label">Address line</span>
                <input placeholder="House / flat / building" value={line1} onChange={(e) => setLine1(e.target.value)} />
                {fieldErrors.line1 ? <p className="account-field-error">{fieldErrors.line1}</p> : null}
              </div>

              <div className="checkout-field">
                <span className="account-field-label">Landmark</span>
                <input placeholder="Landmark (optional)" value={landmark} onChange={(e) => setLandmark(e.target.value)} />
              </div>

              <div className={`checkout-field ${fieldErrors.city ? "checkout-field-error" : ""}`}>
                <span className="account-field-label">City</span>
                <input placeholder="City" value={city} onChange={(e) => setCity(e.target.value)} />
                {fieldErrors.city ? <p className="account-field-error">{fieldErrors.city}</p> : null}
              </div>

              <div className={`checkout-field ${fieldErrors.stateName ? "checkout-field-error" : ""}`}>
                <span className="account-field-label">State</span>
                <input placeholder="State" value={stateName} onChange={(e) => setStateName(e.target.value)} />
                {fieldErrors.stateName ? <p className="account-field-error">{fieldErrors.stateName}</p> : null}
              </div>

              <div className={`checkout-field ${fieldErrors.postalCode ? "checkout-field-error" : ""}`}>
                <span className="account-field-label">Pincode</span>
                <input
                  placeholder="6-digit pincode"
                  value={postalCode}
                  onChange={(e) => setPostalCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                />
                {fieldErrors.postalCode ? <p className="account-field-error">{fieldErrors.postalCode}</p> : null}
              </div>

              <div className={`checkout-field ${fieldErrors.country ? "checkout-field-error" : ""}`}>
                <span className="account-field-label">Country</span>
                <input placeholder="Country" value={country} onChange={(e) => setCountry(e.target.value)} />
                {fieldErrors.country ? <p className="account-field-error">{fieldErrors.country}</p> : null}
              </div>

              <div className="checkout-coupon-row admin-span-2">
                <button
                  className="button button-secondary button-small"
                  type="button"
                  disabled={shippingBusy || !postalCode.trim()}
                  onClick={() => void validateShippingPin()}
                >
                  {shippingBusy ? "Checking…" : "Check delivery"}
                </button>
                <div className="checkout-inline-note">
                  <span>
                    {shippingEstimate?.etaLabel
                      ? `${shippingEstimate.etaLabel} · ${formatStoreCurrency(shippingEstimate.shippingCharge, settings)}`
                      : "Enter pincode to confirm delivery."}
                  </span>
                </div>
              </div>
            </div>

            {message ? <p className={`form-status form-status-${messageTone}`}>{message}</p> : null}

            <div className="checkout-step-actions">
              <button
                className="button"
                type="button"
                disabled={busy || shippingBusy || Boolean(addressWarning)}
                onClick={() => void handleContinueToPayment()}
              >
                {busy || shippingBusy ? "Checking…" : "Continue to Payment"}
              </button>
              <button className="button button-secondary" type="button" onClick={() => setStep(1)}>
                Back
              </button>
            </div>
          </div>
        ) : null}

        {/* ── Step 3: Payment ───────────────────────────────────────────── */}
        {step === 3 ? (
          <div className="checkout-step-content">
            <div className="checkout-step-heading">
              <p className="eyebrow">Step 3</p>
              <h2>Choose payment method</h2>
            </div>

            <p className="checkout-step-copy">
              Paying {formatStoreCurrency(total, settings)} to {customerName} ({customerEmail})
            </p>

            <div className="checkout-payment-options">
              <button
                className="checkout-payment-option"
                type="button"
                disabled={busy}
                onClick={() => void handleCheckout("Razorpay")}
              >
                <svg className="checkout-payment-logo" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Razorpay" role="img">
                  <rect width="44" height="44" rx="9" fill="#2B66F6"/>
                  <path d="M13 10h12c3.866 0 7 3.134 7 7 0 2.9-1.765 5.397-4.32 6.566L32 34h-6.5l-4-10H16v10h-5V10h2zm3 4.5v6H23c1.657 0 3-1.343 3-3s-1.343-3-3-3h-7z" fill="white"/>
                </svg>
                <div>
                  <strong>Razorpay</strong>
                  <p>UPI, cards, netbanking, and wallets</p>
                </div>
                {busy ? <span className="checkout-payment-spinner" /> : null}
              </button>

              <button
                className="checkout-payment-option"
                type="button"
                disabled={busy}
                onClick={() => void handleCheckout("PayPal")}
              >
                <svg className="checkout-payment-logo" viewBox="0 0 44 44" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="PayPal" role="img">
                  <rect width="44" height="44" rx="9" fill="#003087"/>
                  {/* PayPal double-P icon */}
                  <path d="M11 12h9c3.5 0 6 2.2 6 5.5 0 4-3 6.5-7 6.5H15l-1.5 8H9L11 12zm4 3.5-1 5h3.5c1.6 0 2.8-.9 2.8-2.5s-1.2-2.5-2.8-2.5H15z" fill="#009CDE"/>
                  <path d="M21 17h7c3.5 0 6 2.2 6 5.5 0 4-3 6.5-7 6.5H23l-1.5 7H17L19 14h4.5c-.6 1-.9 2-.9 3h-1.6z" fill="white" opacity="0.82"/>
                </svg>
                <div>
                  <strong>PayPal</strong>
                  <p>International cards and PayPal accounts</p>
                </div>
                {busy ? <span className="checkout-payment-spinner" /> : null}
              </button>
            </div>

            {message ? <p className={`form-status form-status-${messageTone}`}>{message}</p> : null}

            <div className="checkout-step-actions">
              <button className="button button-secondary" type="button" disabled={busy} onClick={() => { setStep(2); setMessage(""); }}>
                Back to Delivery
              </button>
            </div>
          </div>
        ) : null}
      </div>

      {/* ── Right: sticky order summary ──────────────────────────────────── */}
      {orderSummary}
    </section>
  );
}
