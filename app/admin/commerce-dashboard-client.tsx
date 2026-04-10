"use client";

import Image from "next/image";
import { startTransition, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommerceCustomerSummary, CommerceSnapshot, CouponInput, OfferInput, ProductInput } from "@/lib/commerce";

type CommerceDashboardClientProps = {
  initialSnapshot: CommerceSnapshot;
  initialCustomers: CommerceCustomerSummary[];
};

type ToastState = {
  tone: "success" | "error";
  message: string;
} | null;

const emptyProduct: ProductInput = {
  slug: "",
  name: "",
  sku: "",
  categorySlug: "herbal-support",
  shortDescription: "",
  description: "",
  badge: "",
  image: "/media/store-herbal-support.svg",
  gallery: ["/media/store-herbal-support.svg"],
  basePrice: 0,
  salePrice: 0,
  stock: 0,
  featured: false,
  active: true,
  videoUrl: "",
  benefits: []
};

const emptyOffer: OfferInput = {
  title: "",
  description: "",
  kind: "sitewide",
  discountType: "percent",
  discountValue: 10,
  active: true
};

const emptyCoupon: CouponInput = {
  code: "",
  description: "",
  discountType: "percent",
  discountValue: 10,
  minimumOrderAmount: 999,
  usageLimit: null,
  usageCount: 0,
  maxDiscountAmount: null,
  perUserLimit: null,
  active: true,
  startsAt: "",
  endsAt: ""
};

async function postJson<T>(url: string, payload: unknown) {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  const result = (await response.json()) as T & { message?: string };
  if (!response.ok) {
    throw new Error(result.message || "Request failed.");
  }
  return result;
}

export function CommerceDashboardClient({ initialSnapshot, initialCustomers }: CommerceDashboardClientProps) {
  const router = useRouter();
  const productFormRef = useRef<HTMLElement>(null);
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [toast, setToast] = useState<ToastState>(null);
  const [productForm, setProductForm] = useState<ProductInput>(emptyProduct);
  const [offerForm, setOfferForm] = useState<OfferInput>(emptyOffer);
  const [couponForm, setCouponForm] = useState<CouponInput>(emptyCoupon);
  const [busyAction, setBusyAction] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productFilter, setProductFilter] = useState<"all" | "active" | "inactive" | "featured">("all");
  const [orderQuery, setOrderQuery] = useState("");
  const [paymentFilter, setPaymentFilter] = useState<"all" | "captured" | "created" | "failed">("all");
  const [customerQuery, setCustomerQuery] = useState("");

  function notify(tone: "success" | "error", message: string) {
    setToast({ tone, message });
    window.setTimeout(() => setToast(null), 2800);
  }

  function loadProductIntoForm(product: CommerceSnapshot["products"][number]) {
    setProductForm({
      id: product.id,
      slug: product.slug,
      name: product.name,
      sku: product.sku,
      categorySlug: product.categorySlug,
      shortDescription: product.shortDescription,
      description: product.description,
      badge: product.badge,
      image: product.image,
      gallery: product.gallery ?? [product.image],
      basePrice: product.basePrice,
      salePrice: product.salePrice,
      stock: product.stock,
      featured: product.featured,
      active: product.active,
      videoUrl: product.videoUrl ?? "",
      benefits: product.benefits
    });
    window.setTimeout(() => {
      productFormRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  }

  const filteredProducts = useMemo(() => {
    return snapshot.products.filter((product) => {
      const matchesQuery =
        !productQuery ||
        [product.name, product.sku, product.slug].some((value) => value.toLowerCase().includes(productQuery.toLowerCase()));
      const matchesFilter =
        productFilter === "all"
          ? true
          : productFilter === "featured"
            ? product.featured
            : productFilter === "active"
              ? product.active
              : !product.active;
      return matchesQuery && matchesFilter;
    });
  }, [productFilter, productQuery, snapshot.products]);

  const filteredOrders = useMemo(() => {
    return snapshot.orders.filter((order) => {
      const matchesQuery =
        !orderQuery ||
        [order.id, order.customerName, order.customerEmail, order.paymentProvider]
          .join(" ")
          .toLowerCase()
          .includes(orderQuery.toLowerCase());
      const matchesPayment = paymentFilter === "all" ? true : order.paymentStatus === paymentFilter;
      return matchesQuery && matchesPayment;
    });
  }, [orderQuery, paymentFilter, snapshot.orders]);

  const filteredCustomers = useMemo(() => {
    return initialCustomers.filter((customer) =>
      !customerQuery
        ? true
        : [customer.fullName, customer.email, customer.phone].join(" ").toLowerCase().includes(customerQuery.toLowerCase())
    );
  }, [customerQuery, initialCustomers]);

  const analytics = useMemo(() => {
    const paidOrders = snapshot.orders.filter((order) => order.paymentStatus === "captured");
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recentOrders = snapshot.orders.filter((order) => new Date(order.createdAt).getTime() >= sevenDaysAgo);
    const recentRevenue = paidOrders
      .filter((order) => new Date(order.createdAt).getTime() >= sevenDaysAgo)
      .reduce((sum, order) => sum + order.total, 0);
    const averageOrderValue = paidOrders.length
      ? Math.round(paidOrders.reduce((sum, order) => sum + order.total, 0) / paidOrders.length)
      : 0;
    const purchasingCustomers = new Set(paidOrders.map((order) => order.userId).filter(Boolean)).size;
    const conversionRate = initialCustomers.length ? Math.round((purchasingCustomers / initialCustomers.length) * 100) : 0;

    return {
      recentOrders: recentOrders.length,
      recentRevenue,
      averageOrderValue,
      conversionRate
    };
  }, [initialCustomers.length, snapshot.orders]);

  async function handleImageUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    setBusyAction("product-image-upload");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/commerce/products/upload", {
        method: "POST",
        body: formData
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Upload failed.");

      setProductForm((current) => ({
        ...current,
        image: result.url,
        gallery: current.gallery.includes(result.url) ? current.gallery : [...current.gallery, result.url]
      }));
      notify("success", "Image uploaded successfully.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to upload image.");
    } finally {
      setBusyAction("");
    }
  }

  async function handleGalleryUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setBusyAction("product-gallery-upload");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/commerce/products/upload", {
        method: "POST",
        body: formData
      });
      const result = await response.json() as { url?: string; message?: string };
      if (!response.ok) throw new Error(result.message || "Upload failed.");
      const url = result.url as string;
      setProductForm((current) => ({
        ...current,
        gallery: current.gallery.includes(url) ? current.gallery : [...current.gallery, url]
      }));
      notify("success", "Gallery image added.");
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to upload gallery image.");
    } finally {
      setBusyAction("");
    }
  }

  async function saveProduct() {
    setBusyAction("product-save");
    try {
      const result = await postJson<{ product: ProductInput & { id: string } }>("/api/admin/commerce/products/upsert", productForm);
      setSnapshot((current) => {
        const nextProducts = [...current.products];
        const index = nextProducts.findIndex((item) => item.id === result.product.id);
        if (index >= 0) {
          nextProducts[index] = result.product;
        } else {
          nextProducts.unshift(result.product);
        }
        return { ...current, products: nextProducts };
      });
      setProductForm(emptyProduct);
      notify("success", result.message || "Product saved.");
      startTransition(() => router.refresh());
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to save product.");
    } finally {
      setBusyAction("");
    }
  }

  async function removeProduct(id: string, name: string) {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    setBusyAction(`product-delete-${id}`);
    try {
      const result = await postJson<{ message: string }>("/api/admin/commerce/products/delete", { id });
      setSnapshot((current) => ({
        ...current,
        products: current.products.filter((item) => item.id !== id)
      }));
      if (productForm.id === id) setProductForm(emptyProduct);
      notify("success", result.message || "Product deleted.");
      startTransition(() => router.refresh());
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to delete product.");
    } finally {
      setBusyAction("");
    }
  }

  async function saveOffer() {
    setBusyAction("offer-save");
    try {
      const result = await postJson<{ offer: OfferInput & { id: string } }>("/api/admin/commerce/offers/upsert", offerForm);
      setSnapshot((current) => {
        const nextOffers = [...current.offers];
        const index = nextOffers.findIndex((item) => item.id === result.offer.id);
        if (index >= 0) {
          nextOffers[index] = result.offer;
        } else {
          nextOffers.unshift(result.offer);
        }
        return { ...current, offers: nextOffers };
      });
      setOfferForm(emptyOffer);
      notify("success", result.message || "Offer saved.");
      startTransition(() => router.refresh());
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to save offer.");
    } finally {
      setBusyAction("");
    }
  }

  async function removeOffer(id: string) {
    setBusyAction(`offer-delete-${id}`);
    try {
      const result = await postJson<{ message: string }>("/api/admin/commerce/offers/delete", { id });
      setSnapshot((current) => ({
        ...current,
        offers: current.offers.filter((item) => item.id !== id)
      }));
      notify("success", result.message || "Offer deleted.");
      startTransition(() => router.refresh());
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to delete offer.");
    } finally {
      setBusyAction("");
    }
  }

  async function saveCoupon() {
    setBusyAction("coupon-save");
    try {
      const result = await postJson<{ coupon: CouponInput & { id: string } }>("/api/admin/commerce/coupons/upsert", couponForm);
      const normalizedCoupon = {
        ...result.coupon,
        usageLimit: result.coupon.usageLimit ?? null,
        usageCount: result.coupon.usageCount ?? 0
      };
      setSnapshot((current) => {
        const nextCoupons = [...current.coupons];
        const index = nextCoupons.findIndex((item) => item.id === result.coupon.id);
        if (index >= 0) {
          nextCoupons[index] = normalizedCoupon;
        } else {
          nextCoupons.unshift(normalizedCoupon);
        }
        return { ...current, coupons: nextCoupons };
      });
      setCouponForm(emptyCoupon);
      notify("success", result.message || "Coupon saved.");
      startTransition(() => router.refresh());
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to save coupon.");
    } finally {
      setBusyAction("");
    }
  }

  async function removeCoupon(id: string) {
    setBusyAction(`coupon-delete-${id}`);
    try {
      const result = await postJson<{ message: string }>("/api/admin/commerce/coupons/delete", { id });
      setSnapshot((current) => ({
        ...current,
        coupons: current.coupons.filter((item) => item.id !== id)
      }));
      notify("success", result.message || "Coupon deleted.");
      startTransition(() => router.refresh());
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to delete coupon.");
    } finally {
      setBusyAction("");
    }
  }

  async function updateFulfillment(orderId: string, fulfillmentStatus: string) {
    setBusyAction(`fulfillment-${orderId}`);
    try {
      const result = await postJson<{ message: string }>("/api/admin/commerce/orders/fulfillment", {
        orderId,
        fulfillmentStatus
      });
      setSnapshot((current) => ({
        ...current,
        orders: current.orders.map((item) => (item.id === orderId ? { ...item, fulfillmentStatus } : item))
      }));
      notify("success", result.message || "Fulfillment updated.");
      startTransition(() => router.refresh());
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to update fulfillment.");
    } finally {
      setBusyAction("");
    }
  }

  async function createShipment(orderId: string) {
    setBusyAction(`shipment-${orderId}`);
    try {
      const result = await postJson<{ message: string; shipment: CommerceSnapshot["shipments"][number] }>(
        "/api/admin/commerce/shipments/create",
        { orderId }
      );
      setSnapshot((current) => ({
        ...current,
        shipments: [result.shipment, ...current.shipments]
      }));
      notify("success", result.message || "Shipment created.");
      startTransition(() => router.refresh());
    } catch (error) {
      notify("error", error instanceof Error ? error.message : "Unable to create shipment.");
    } finally {
      setBusyAction("");
    }
  }

  return (
    <section className="commerce-admin-manager">
      {toast ? <p className={`form-status form-status-${toast.tone}`}>{toast.message}</p> : null}

      <div className="commerce-admin-grid">
        <article className="admin-insight-card">
          <p className="admin-kicker">7-day orders</p>
          <strong>{analytics.recentOrders}</strong>
          <span>Recent order velocity across all payment states.</span>
        </article>
        <article className="admin-insight-card">
          <p className="admin-kicker">7-day revenue</p>
          <strong>{analytics.recentRevenue}</strong>
          <span>Captured revenue in the last 7 days.</span>
        </article>
        <article className="admin-insight-card">
          <p className="admin-kicker">Average order value</p>
          <strong>{analytics.averageOrderValue}</strong>
          <span>Mean ticket size across captured orders.</span>
        </article>
        <article className="admin-insight-card">
          <p className="admin-kicker">Customer conversion</p>
          <strong>{analytics.conversionRate}%</strong>
          <span>Registered customers with at least one captured order.</span>
        </article>
      </div>

      <div className="commerce-admin-panels">
        <article className="commerce-panel" ref={productFormRef}>
          <div className="commerce-panel-heading">
            <div>
              <p className="admin-kicker">Products</p>
              <h2>Catalog manager</h2>
            </div>
          </div>

          <div className="admin-form-grid">
            {productForm.id ? (
              <div className="admin-editing-banner">
                <span>Editing: {productForm.name || "Untitled"}</span>
                <button className="button button-secondary button-small" type="button" onClick={() => setProductForm(emptyProduct)}>
                  Cancel
                </button>
              </div>
            ) : null}

            <span className="admin-form-section">Identity</span>
            <input
              className="admin-span-2"
              placeholder="Product name *"
              value={productForm.name}
              onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
            />
            <input
              placeholder="Slug (auto-generated if blank)"
              value={productForm.slug}
              onChange={(event) => setProductForm((current) => ({ ...current, slug: event.target.value }))}
            />
            <input
              placeholder="SKU *"
              value={productForm.sku}
              onChange={(event) => setProductForm((current) => ({ ...current, sku: event.target.value }))}
            />
            <select
              value={productForm.categorySlug}
              onChange={(event) => setProductForm((current) => ({ ...current, categorySlug: event.target.value }))}
            >
              {snapshot.categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
            <input
              placeholder="Badge label"
              value={productForm.badge}
              onChange={(event) => setProductForm((current) => ({ ...current, badge: event.target.value }))}
            />

            <span className="admin-form-section">Main image</span>
            <input
              placeholder="Image URL or path *"
              value={productForm.image}
              onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))}
            />
            <div className="admin-upload-field">
              <label className="admin-upload-button">
                {busyAction === "product-image-upload" ? "Uploading..." : "Upload main image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleImageUpload}
                  disabled={busyAction === "product-image-upload"}
                  hidden
                />
              </label>
              {productForm.image ? (
                <div className="admin-thumbnail">
                  <Image src={productForm.image} alt="Main image preview" fill style={{ objectFit: "cover" }} sizes="60px" unoptimized />
                </div>
              ) : null}
            </div>
            {productForm.image ? (
              <div className="admin-image-preview">
                <Image src={productForm.image} alt="Preview" fill style={{ objectFit: "cover" }} sizes="600px" unoptimized />
              </div>
            ) : null}

            <span className="admin-form-section">Gallery</span>
            <div className="admin-upload-field">
              <label className="admin-upload-button">
                {busyAction === "product-gallery-upload" ? "Uploading..." : "Add gallery image"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/avif"
                  onChange={handleGalleryUpload}
                  disabled={busyAction === "product-gallery-upload"}
                  hidden
                />
              </label>
              <span className="admin-copy" style={{ fontSize: "0.82rem" }}>
                {productForm.gallery.length} image{productForm.gallery.length !== 1 ? "s" : ""}
              </span>
            </div>
            {productForm.gallery.length > 0 ? (
              <div className="admin-gallery-grid">
                {productForm.gallery.map((url) => (
                  <div className="admin-gallery-item" key={url}>
                    <Image src={url} alt="Gallery" fill style={{ objectFit: "cover" }} sizes="90px" unoptimized />
                    <button
                      className="admin-gallery-remove"
                      type="button"
                      title="Remove from gallery"
                      onClick={() =>
                        setProductForm((current) => ({
                          ...current,
                          gallery: current.gallery.filter((item) => item !== url),
                          image: current.image === url && current.gallery.length > 1
                            ? (current.gallery.find((item) => item !== url) ?? current.image)
                            : current.image
                        }))
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : null}

            <span className="admin-form-section">Pricing &amp; inventory</span>
            <input
              placeholder="Base price *"
              type="number"
              min={0}
              value={productForm.basePrice}
              onChange={(event) => setProductForm((current) => ({ ...current, basePrice: Number(event.target.value) }))}
            />
            <input
              placeholder="Sale price *"
              type="number"
              min={0}
              value={productForm.salePrice}
              onChange={(event) => setProductForm((current) => ({ ...current, salePrice: Number(event.target.value) }))}
            />
            <input
              placeholder="Stock quantity"
              type="number"
              min={0}
              value={productForm.stock}
              onChange={(event) => setProductForm((current) => ({ ...current, stock: Number(event.target.value) }))}
            />
            <input
              placeholder="Video embed URL (YouTube /embed/...)"
              value={productForm.videoUrl}
              onChange={(event) => setProductForm((current) => ({ ...current, videoUrl: event.target.value }))}
            />

            <span className="admin-form-section">Content</span>
            <input
              className="admin-span-2"
              placeholder="Short description *"
              value={productForm.shortDescription}
              onChange={(event) => setProductForm((current) => ({ ...current, shortDescription: event.target.value }))}
            />
            <input
              className="admin-span-2"
              placeholder="Benefits — comma separated (e.g. Reduces stress, Improves sleep)"
              value={productForm.benefits.join(", ")}
              onChange={(event) =>
                setProductForm((current) => ({
                  ...current,
                  benefits: event.target.value.split(",").map((item) => item.trim()).filter(Boolean)
                }))
              }
            />
            <textarea
              placeholder="Full description *"
              value={productForm.description}
              onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
            />

            <span className="admin-form-section">Visibility</span>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={productForm.featured}
                onChange={(event) => setProductForm((current) => ({ ...current, featured: event.target.checked }))}
              />
              Featured on store
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={productForm.active}
                onChange={(event) => setProductForm((current) => ({ ...current, active: event.target.checked }))}
              />
              Visible on store
            </label>
          </div>

          <div className="admin-actions">
            <button className="button button-small" type="button" disabled={busyAction === "product-save"} onClick={saveProduct}>
              {busyAction === "product-save" ? "Saving..." : productForm.id ? "Update Product" : "Add Product"}
            </button>
            {productForm.id ? (
              <button className="button button-secondary button-small" type="button" onClick={() => setProductForm(emptyProduct)}>
                Cancel edit
              </button>
            ) : (
              <button className="button button-secondary button-small" type="button" onClick={() => setProductForm(emptyProduct)}>
                Reset
              </button>
            )}
          </div>

          <div className="admin-form-grid admin-form-grid-compact">
            <input placeholder="Search products" value={productQuery} onChange={(event) => setProductQuery(event.target.value)} />
            <select value={productFilter} onChange={(event) => setProductFilter(event.target.value as typeof productFilter)}>
              <option value="all">All products</option>
              <option value="active">Visible</option>
              <option value="inactive">Hidden</option>
              <option value="featured">Featured</option>
            </select>
          </div>

          <div className="commerce-list">
            {filteredProducts.length ? filteredProducts.map((product) => (
              <div className="commerce-list-item" key={product.id}>
                <div className="admin-list-thumb">
                  <Image src={product.image} alt={product.name} fill style={{ objectFit: "cover" }} sizes="45px" unoptimized />
                </div>
                <div style={{ flex: "1 1 0", minWidth: 0 }}>
                  <strong>{product.name}</strong>
                  <p>
                    {product.sku} &nbsp;·&nbsp; Stock {product.stock} &nbsp;·&nbsp; Rs.{product.salePrice}
                  </p>
                </div>
                <div className="commerce-list-side">
                  <span className={`status-pill status-${product.active ? "success" : "neutral"}`}>
                    {product.active ? "Live" : "Hidden"}
                  </span>
                  {product.featured ? <span className="status-pill status-warning">Featured</span> : null}
                  <button className="button button-secondary button-small" type="button" onClick={() => loadProductIntoForm(product)}>
                    Edit
                  </button>
                  <button
                    className="button button-secondary button-small"
                    type="button"
                    disabled={busyAction === `product-delete-${product.id}`}
                    onClick={() => removeProduct(product.id, product.name)}
                  >
                    {busyAction === `product-delete-${product.id}` ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </div>
            )) : (
              <p className="admin-copy">No products match the current filter.</p>
            )}
          </div>
        </article>

        <article className="commerce-panel">
          <div className="commerce-panel-heading">
            <div>
              <p className="admin-kicker">Campaigns</p>
              <h2>Offers and coupons</h2>
            </div>
          </div>
          <div className="admin-form-grid">
            <input placeholder="Offer title" value={offerForm.title} onChange={(event) => setOfferForm((current) => ({ ...current, title: event.target.value }))} />
            <input placeholder="Offer kind" value={offerForm.kind} onChange={(event) => setOfferForm((current) => ({ ...current, kind: event.target.value }))} />
            <select
              value={offerForm.discountType}
              onChange={(event) => setOfferForm((current) => ({ ...current, discountType: event.target.value as OfferInput["discountType"] }))}
            >
              <option value="percent">Percent</option>
              <option value="flat">Flat</option>
            </select>
            <input
              type="number"
              placeholder="Discount value"
              value={offerForm.discountValue}
              onChange={(event) => setOfferForm((current) => ({ ...current, discountValue: Number(event.target.value) }))}
            />
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={offerForm.active}
                onChange={(event) => setOfferForm((current) => ({ ...current, active: event.target.checked }))}
              />
              Active
            </label>
            <textarea placeholder="Offer description" value={offerForm.description} onChange={(event) => setOfferForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <div className="admin-actions">
            <button className="button button-small" type="button" disabled={busyAction === "offer-save"} onClick={saveOffer}>
              {busyAction === "offer-save" ? "Saving..." : offerForm.id ? "Update Offer" : "Add Offer"}
            </button>
            <button className="button button-secondary button-small" type="button" onClick={() => setOfferForm(emptyOffer)}>
              Reset
            </button>
          </div>
          <div className="commerce-list">
            {snapshot.offers.map((offer) => (
              <div className="commerce-list-item" key={offer.id}>
                <div>
                  <strong>{offer.title}</strong>
                  <p>{offer.description}</p>
                </div>
                <div className="commerce-list-side">
                  <button className="button button-secondary button-small" type="button" onClick={() => setOfferForm(offer)}>
                    Edit
                  </button>
                  <button
                    className="button button-secondary button-small"
                    type="button"
                    disabled={busyAction === `offer-delete-${offer.id}`}
                    onClick={() => removeOffer(offer.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="admin-form-grid admin-form-grid-compact">
            <input placeholder="Coupon code" value={couponForm.code} onChange={(event) => setCouponForm((current) => ({ ...current, code: event.target.value }))} />
            <select
              value={couponForm.discountType}
              onChange={(event) => setCouponForm((current) => ({ ...current, discountType: event.target.value as CouponInput["discountType"] }))}
            >
              <option value="percent">Percent</option>
              <option value="flat">Flat</option>
            </select>
            <input
              type="number"
              placeholder="Discount value"
              value={couponForm.discountValue}
              onChange={(event) => setCouponForm((current) => ({ ...current, discountValue: Number(event.target.value) }))}
            />
            <input
              type="number"
              placeholder="Minimum order"
              value={couponForm.minimumOrderAmount}
              onChange={(event) => setCouponForm((current) => ({ ...current, minimumOrderAmount: Number(event.target.value) }))}
            />
            <input
              type="number"
              placeholder="Usage limit"
              value={couponForm.usageLimit ?? ""}
              onChange={(event) =>
                setCouponForm((current) => ({
                  ...current,
                  usageLimit: event.target.value ? Number(event.target.value) : null
                }))
              }
            />
            <input
              type="number"
              placeholder="Max discount amount (percent cap)"
              value={couponForm.maxDiscountAmount ?? ""}
              onChange={(event) =>
                setCouponForm((current) => ({
                  ...current,
                  maxDiscountAmount: event.target.value ? Number(event.target.value) : null
                }))
              }
            />
            <input
              type="number"
              placeholder="Per-user limit"
              value={couponForm.perUserLimit ?? ""}
              onChange={(event) =>
                setCouponForm((current) => ({
                  ...current,
                  perUserLimit: event.target.value ? Number(event.target.value) : null
                }))
              }
            />
            <input
              type="datetime-local"
              value={couponForm.startsAt ? couponForm.startsAt.slice(0, 16) : ""}
              onChange={(event) => setCouponForm((current) => ({ ...current, startsAt: event.target.value }))}
            />
            <input
              type="datetime-local"
              value={couponForm.endsAt ? couponForm.endsAt.slice(0, 16) : ""}
              onChange={(event) => setCouponForm((current) => ({ ...current, endsAt: event.target.value }))}
            />
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={couponForm.active}
                onChange={(event) => setCouponForm((current) => ({ ...current, active: event.target.checked }))}
              />
              Active
            </label>
            <textarea placeholder="Coupon description" value={couponForm.description} onChange={(event) => setCouponForm((current) => ({ ...current, description: event.target.value }))} />
          </div>
          <div className="admin-actions">
            <button className="button button-small" type="button" disabled={busyAction === "coupon-save"} onClick={saveCoupon}>
              {busyAction === "coupon-save" ? "Saving..." : couponForm.id ? "Update Coupon" : "Add Coupon"}
            </button>
            <button className="button button-secondary button-small" type="button" onClick={() => setCouponForm(emptyCoupon)}>
              Reset
            </button>
          </div>
          <div className="commerce-list">
            {snapshot.coupons.map((coupon) => (
              <div className="commerce-list-item" key={coupon.id}>
                <div>
                  <strong>{coupon.code}</strong>
                  <p>
                    {coupon.description} | Used {coupon.usageCount}
                    {coupon.usageLimit !== null ? ` / ${coupon.usageLimit}` : ""}
                    {coupon.maxDiscountAmount ? ` | Cap Rs.\u00a0${coupon.maxDiscountAmount}` : ""}
                    {coupon.perUserLimit ? ` | ${coupon.perUserLimit}/user` : ""}
                  </p>
                </div>
                <div className="commerce-list-side">
                  <button className="button button-secondary button-small" type="button" onClick={() => setCouponForm(coupon)}>
                    Edit
                  </button>
                  <button
                    className="button button-secondary button-small"
                    type="button"
                    disabled={busyAction === `coupon-delete-${coupon.id}`}
                    onClick={() => removeCoupon(coupon.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="commerce-panel">
        <div className="commerce-panel-heading">
          <div>
            <p className="admin-kicker">Orders</p>
            <h2>Fulfillment and dispatch</h2>
          </div>
        </div>
        <div className="admin-form-grid admin-form-grid-compact">
          <input placeholder="Search orders" value={orderQuery} onChange={(event) => setOrderQuery(event.target.value)} />
          <select value={paymentFilter} onChange={(event) => setPaymentFilter(event.target.value as typeof paymentFilter)}>
            <option value="all">All payment states</option>
            <option value="captured">Captured</option>
            <option value="created">Created</option>
            <option value="failed">Failed</option>
          </select>
        </div>
        <div className="commerce-list">
          {filteredOrders.map((order) => (
            <div className="commerce-list-item" key={order.id}>
              <div>
                <strong>{order.customerName}</strong>
                <p>
                  {order.id} | {order.paymentProvider} | {order.paymentStatus} | {order.total}
                </p>
              </div>
              <div className="commerce-list-side">
                <select
                  value={order.fulfillmentStatus}
                  onChange={(event) => updateFulfillment(order.id, event.target.value)}
                  disabled={busyAction === `fulfillment-${order.id}`}
                >
                  <option value="awaiting_payment">Awaiting payment</option>
                  <option value="processing">Processing</option>
                  <option value="packed">Packed</option>
                  <option value="pickup_scheduled">Pickup scheduled</option>
                  <option value="shipped">Shipped</option>
                  <option value="delivered">Delivered</option>
                </select>
                <button
                  className="button button-secondary button-small"
                  type="button"
                  disabled={busyAction === `shipment-${order.id}`}
                  onClick={() => createShipment(order.id)}
                >
                  {busyAction === `shipment-${order.id}` ? "Creating..." : "Create Shipment"}
                </button>
              </div>
            </div>
          ))}
          {!filteredOrders.length ? <p className="admin-copy">No orders match the current filters.</p> : null}
        </div>
      </article>

      <article className="commerce-panel">
        <div className="commerce-panel-heading">
          <div>
            <p className="admin-kicker">Users</p>
            <h2>Customer directory</h2>
          </div>
        </div>
        <div className="admin-form-grid admin-form-grid-compact">
          <input placeholder="Search customers" value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} />
        </div>
        <div className="commerce-list">
          {filteredCustomers.slice(0, 40).map((customer) => (
            <div className="commerce-list-item" key={customer.id}>
              <div>
                <strong>{customer.fullName || customer.email}</strong>
                <p>
                  {customer.email}
                  {customer.phone ? ` | ${customer.phone}` : ""}
                </p>
              </div>
              <div className="commerce-list-side">
                <span>{new Date(customer.createdAt).toLocaleDateString("en-IN")}</span>
              </div>
            </div>
          ))}
          {!filteredCustomers.length ? <p className="admin-copy">No customers match the current search.</p> : null}
        </div>
      </article>
    </section>
  );
}
