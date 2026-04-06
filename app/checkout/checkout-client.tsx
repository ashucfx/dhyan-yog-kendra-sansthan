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
  const paypalCancelled = searchParams.get("paypal_cancel");

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
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<CheckoutFieldErrors>({});
  const [addressWarning, setAddressWarning] = useState("");
  const [busy, setBusy] = useState(false);
  const [couponBusy, setCouponBusy] = useState(false);
  const [shippingBusy, setShippingBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [messageTone, setMessageTone] = useState<"success" | "error">("success");
  const isPhoneReadyForCheckout = validateIndianMobile(customerPhone);

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

    setCustomerName(selectedAddress.fullName || initialName);
    setCustomerPhone(selectedAddress.phone || initialPhone);
    setLine1(selectedAddress.line1);
    setLandmark(selectedAddress.landmark ?? "");
    setCity(selectedAddress.city);
    setStateName(selectedAddress.state);
    setPostalCode(selectedAddress.postalCode);
    setCountry(selectedAddress.country);
    setFieldErrors({});
  }, [initialAddresses, initialName, initialPhone, selectedAddressId]);

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

  useEffect(() => {
    if (paypalCancelled) {
      setMessageTone("error");
      setMessage("PayPal checkout was cancelled. Your cart is still available.");
    }
  }, [paypalCancelled]);

  const selectedItems = useMemo(
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

  const subtotal = selectedItems.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const discount = appliedCoupon?.discount ?? 0;
  const shipping = shippingEstimate?.shippingCharge ?? (subtotal - discount >= 1499 || subtotal === 0 ? 0 : 120);
  const total = Math.max(0, subtotal - discount + shipping);

  useEffect(() => {
    if (appliedCoupon && appliedCoupon.code !== couponCode.trim().toUpperCase()) {
      setAppliedCoupon(null);
    }
  }, [appliedCoupon, couponCode]);

  useEffect(() => {
    setShippingEstimate((current) =>
      current && current.postalCode === postalCode.trim() ? current : null
    );
    setAddressWarning("");
  }, [postalCode, line1, city, stateName, landmark, country]);

  useEffect(() => {
    if (!selectedAddressId || !postalCode.trim() || !country.trim()) {
      return;
    }

    let active = true;

    async function validateSelectedAddress() {
      setShippingBusy(true);

      try {
        const response = await fetch("/api/shipping/estimate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            postalCode: postalCode.trim(),
            subtotal: Math.max(0, subtotal - discount),
            country
          })
        });
        const result = (await response.json()) as {
          postalCode?: string;
          shippingCharge?: number;
          etaLabel?: string;
          message?: string;
        };

        if (!active) {
          return;
        }

        if (!response.ok || typeof result.shippingCharge !== "number" || !result.postalCode) {
          setShippingEstimate(null);
          setAddressWarning(result.message || "Delivery is not available for this pincode.");
          return;
        }

        setShippingEstimate({
          postalCode: result.postalCode,
          shippingCharge: result.shippingCharge,
          etaLabel: result.etaLabel,
          message: result.message || "Delivery is available."
        });
        setAddressWarning("");
      } finally {
        if (active) {
          setShippingBusy(false);
        }
      }
    }

    void validateSelectedAddress();

    return () => {
      active = false;
    };
  }, [selectedAddressId, postalCode, country, subtotal, discount]);

  function validateCheckoutFields() {
    const nextErrors: CheckoutFieldErrors = {};

    if (!customerName.trim()) {
      nextErrors.customerName = "Full name is required.";
    }
    if (!validateEmail(customerEmail)) {
      nextErrors.customerEmail = "Enter a valid email address.";
    }
    if (!validateIndianMobile(customerPhone)) {
      nextErrors.customerPhone = "Enter a valid 10-digit Indian mobile number.";
    }
    if (!line1.trim()) {
      nextErrors.line1 = "Address line is required.";
    }
    if (!city.trim()) {
      nextErrors.city = "City is required.";
    }
    if (!stateName.trim()) {
      nextErrors.stateName = "State is required.";
    }
    if (!isValidIndianPostalCode(postalCode)) {
      nextErrors.postalCode = "Enter a valid 6-digit Indian pincode.";
    }
    if (country.trim().toLowerCase() !== "india") {
      nextErrors.country = "Only India is supported right now.";
    }

    setFieldErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
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
        body: JSON.stringify({
          code: normalizedCode,
          subtotal
        })
      });
      const result = (await response.json()) as {
        message?: string;
        coupon?: { code: string };
        discount?: number;
      };

      if (!response.ok || !result.coupon || typeof result.discount !== "number") {
        throw new Error(result.message || "Coupon is not valid.");
      }

      setAppliedCoupon({
        code: result.coupon.code,
        discount: result.discount
      });
      setCouponCode(result.coupon.code);
      setMessageTone("success");
      setMessage(result.message || "Coupon applied successfully.");
    } catch (error) {
      setAppliedCoupon(null);
      setMessageTone("error");
      setMessage(error instanceof Error ? error.message : "Coupon is not valid.");
    } finally {
      setCouponBusy(false);
    }
  }

  async function validateShippingPin(silent = false) {
    const normalizedPostalCode = postalCode.trim();
    if (!normalizedPostalCode) {
      if (!silent) {
        setMessageTone("error");
        setMessage("Enter a pincode to check delivery.");
      }
      return null;
    }

    setShippingBusy(true);
    if (!silent) {
      setMessage("");
    }

    try {
      const response = await fetch("/api/shipping/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          postalCode: normalizedPostalCode,
          subtotal: Math.max(0, subtotal - discount),
          country
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

      const nextEstimate = {
        postalCode: result.postalCode,
        shippingCharge: result.shippingCharge,
        etaLabel: result.etaLabel,
        message: result.message || "Delivery is available."
      } satisfies ShippingEstimateState;

      setShippingEstimate(nextEstimate);
      setAddressWarning("");
      if (!silent) {
        setMessageTone("success");
        setMessage(nextEstimate.message);
      }
      return nextEstimate;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Delivery is not available for this pincode.";
      setShippingEstimate(null);
      setAddressWarning(errorMessage);
      if (!silent) {
        setMessageTone("error");
        setMessage(errorMessage);
      }
      return null;
    } finally {
      setShippingBusy(false);
    }
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

    if (!selectedItems.length) {
      setMessageTone("error");
      setMessage("Add products to your cart before checkout.");
      return;
    }

    if (!validateCheckoutFields()) {
      setMessageTone("error");
      setMessage("Correct the highlighted fields before payment.");
      return;
    }

    const estimate = await validateShippingPin(true);
    if (!estimate) {
      setMessageTone("error");
      setMessage("This pincode is not serviceable. Please choose or enter a deliverable address.");
      return;
    }

    setBusy(true);
    setMessage("");
    setPaymentSheetOpen(false);

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
            landmark,
            city,
            state: stateName,
            postalCode,
            country
          },
          items: selectedItems.map((item) => ({
            productId: item.product.id,
            quantity: item.quantity
          })),
          couponCode: appliedCoupon?.code ?? couponCode.trim().toUpperCase(),
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

  async function handleProceedToPayment() {
    if (!authenticated) {
      window.location.href = "/auth/sign-in?redirectTo=/checkout";
      return;
    }

    if (!selectedItems.length) {
      setMessageTone("error");
      setMessage("Add products to your cart before checkout.");
      return;
    }

    if (!validateCheckoutFields()) {
      setMessageTone("error");
      setMessage("Correct the highlighted fields before payment.");
      return;
    }

    if (!customerPhone.trim()) {
      setMessageTone("error");
      setMessage("Complete your mobile number before payment.");
      return;
    }

    const estimate = await validateShippingPin();
    if (!estimate) {
      return;
    }

    setPaymentSheetOpen(true);
  }

  return (
    <section className="section checkout-layout page-end-section">
      <div className="commerce-panel">
        <div className="section-heading narrow">
          <p className="eyebrow">Checkout</p>
          <h1 className="page-title">Review your cart and complete your order.</h1>
        </div>

        {!isPhoneReadyForCheckout ? (
          <p className="form-status form-status-error">
            Add a valid 10-digit mobile number before proceeding with payment.
          </p>
        ) : null}

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
            <>
              <select value={selectedAddressId} onChange={(event) => setSelectedAddressId(event.target.value)}>
                <option value="">Use a custom address</option>
                {initialAddresses.map((address) => (
                  <option key={address.id} value={address.id}>
                    {address.label || address.fullName} - {address.city}
                  </option>
                ))}
              </select>
              {addressWarning ? <p className="form-status form-status-error">Selected pincode is not serviceable. Choose another address.</p> : null}
            </>
          ) : (
            <div className="checkout-inline-note">
              <span>No saved address yet.</span>
              <Link className="inline-link" href="/account">
                Add one in My Account
              </Link>
            </div>
          )}

          <div className="checkout-field">
            <input placeholder="Full name" value={customerName} onChange={(event) => setCustomerName(event.target.value)} />
            {fieldErrors.customerName ? <p className="account-field-error">{fieldErrors.customerName}</p> : null}
          </div>
          <div className="checkout-field">
            <input placeholder="Email" value={customerEmail} onChange={(event) => setCustomerEmail(event.target.value)} />
            {fieldErrors.customerEmail ? <p className="account-field-error">{fieldErrors.customerEmail}</p> : null}
          </div>
          <div className="checkout-field">
            <input placeholder="Phone number" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
            {fieldErrors.customerPhone ? <p className="account-field-error">{fieldErrors.customerPhone}</p> : null}
          </div>
          <div className="checkout-field">
            <input placeholder="Address line" value={line1} onChange={(event) => setLine1(event.target.value)} />
            {fieldErrors.line1 ? <p className="account-field-error">{fieldErrors.line1}</p> : null}
          </div>
          <div className="checkout-field">
            <input placeholder="Landmark (optional)" value={landmark} onChange={(event) => setLandmark(event.target.value)} />
          </div>
          <div className="checkout-field">
            <input placeholder="City" value={city} onChange={(event) => setCity(event.target.value)} />
            {fieldErrors.city ? <p className="account-field-error">{fieldErrors.city}</p> : null}
          </div>
          <div className="checkout-field">
            <input placeholder="State" value={stateName} onChange={(event) => setStateName(event.target.value)} />
            {fieldErrors.stateName ? <p className="account-field-error">{fieldErrors.stateName}</p> : null}
          </div>
          <div className="checkout-field">
            <input placeholder="Postal code" value={postalCode} onChange={(event) => setPostalCode(event.target.value.replace(/\D/g, "").slice(0, 6))} />
            {fieldErrors.postalCode ? <p className="account-field-error">{fieldErrors.postalCode}</p> : null}
          </div>
          <div className="checkout-field">
            <input placeholder="Country" value={country} onChange={(event) => setCountry(event.target.value)} />
            {fieldErrors.country ? <p className="account-field-error">{fieldErrors.country}</p> : null}
          </div>

          <div className="checkout-coupon-row">
            <button className="button button-secondary button-small" type="button" disabled={shippingBusy || !postalCode.trim()} onClick={() => void validateShippingPin()}>
              {shippingBusy ? "Checking..." : "Check delivery"}
            </button>
            <div className="checkout-inline-note">
              <span>{shippingEstimate?.etaLabel ? `ETA ${shippingEstimate.etaLabel}` : "Dispatches from 127021, India"}</span>
            </div>
          </div>

          <div className="checkout-coupon-row">
            <input placeholder="Coupon code" value={couponCode} onChange={(event) => setCouponCode(event.target.value.toUpperCase())} />
            <button className="button button-secondary button-small" type="button" disabled={couponBusy || !subtotal} onClick={() => void validateCoupon()}>
              {couponBusy ? "Checking..." : appliedCoupon ? "Reapply" : "Apply"}
            </button>
          </div>
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
            <span className="status-pill status-warning">{shippingEstimate?.etaLabel ?? "Estimate pending"}</span>
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
        <button
          className="button"
          type="button"
          disabled={busy || loading || !selectedItems.length || Boolean(addressWarning) || !isPhoneReadyForCheckout}
          onClick={() => void handleProceedToPayment()}
        >
          {busy ? "Processing..." : `Proceed to pay ${formatStoreCurrency(total, settings)}`}
        </button>

        {paymentSheetOpen ? (
          <div className="checkout-payment-sheet">
            <div className="checkout-payment-sheet-head">
              <div>
                <p className="eyebrow">Choose payment</p>
                <h2>Select your payment method</h2>
              </div>
              <button className="button button-secondary button-small" type="button" onClick={() => setPaymentSheetOpen(false)}>
                Close
              </button>
            </div>

            <div className="checkout-payment-options">
              <button className="checkout-payment-option" type="button" disabled={busy} onClick={() => void handleCheckout("Razorpay")}>
                <span className="checkout-payment-logo checkout-payment-logo-razorpay">R</span>
                <div>
                  <strong>Razorpay</strong>
                  <p>UPI, cards, netbanking, and wallets</p>
                </div>
              </button>

              <button className="checkout-payment-option" type="button" disabled={busy} onClick={() => void handleCheckout("PayPal")}>
                <span className="checkout-payment-logo checkout-payment-logo-paypal">P</span>
                <div>
                  <strong>PayPal</strong>
                  <p>Best for international card and PayPal accounts</p>
                </div>
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
