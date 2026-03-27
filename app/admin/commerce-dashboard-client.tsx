"use client";

import { startTransition, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { CommerceSnapshot, CouponInput, OfferInput, ProductInput } from "@/lib/commerce";

type CommerceDashboardClientProps = {
  initialSnapshot: CommerceSnapshot;
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
  active: true
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

export function CommerceDashboardClient({ initialSnapshot }: CommerceDashboardClientProps) {
  const router = useRouter();
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [toast, setToast] = useState<ToastState>(null);
  const [productForm, setProductForm] = useState<ProductInput>(emptyProduct);
  const [offerForm, setOfferForm] = useState<OfferInput>(emptyOffer);
  const [couponForm, setCouponForm] = useState<CouponInput>(emptyCoupon);
  const [busyAction, setBusyAction] = useState("");
  const [productQuery, setProductQuery] = useState("");
  const [productFilter, setProductFilter] = useState<"all" | "active" | "inactive" | "featured">("all");

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

  async function removeProduct(id: string) {
    setBusyAction(`product-delete-${id}`);
    try {
      const result = await postJson<{ message: string }>("/api/admin/commerce/products/delete", { id });
      setSnapshot((current) => ({
        ...current,
        products: current.products.filter((item) => item.id !== id)
      }));
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
      setSnapshot((current) => {
        const nextCoupons = [...current.coupons];
        const index = nextCoupons.findIndex((item) => item.id === result.coupon.id);
        if (index >= 0) {
          nextCoupons[index] = result.coupon;
        } else {
          nextCoupons.unshift(result.coupon);
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

      <div className="commerce-admin-panels">
        <article className="commerce-panel">
          <div className="commerce-panel-heading">
            <div>
              <p className="admin-kicker">Products</p>
              <h2>Catalog manager</h2>
            </div>
          </div>
          <div className="admin-form-grid">
            <input
              placeholder="Product name"
              value={productForm.name}
              onChange={(event) => setProductForm((current) => ({ ...current, name: event.target.value }))}
            />
            <input
              placeholder="Slug"
              value={productForm.slug}
              onChange={(event) => setProductForm((current) => ({ ...current, slug: event.target.value }))}
            />
            <input
              placeholder="SKU"
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
              placeholder="Badge"
              value={productForm.badge}
              onChange={(event) => setProductForm((current) => ({ ...current, badge: event.target.value }))}
            />
            <input
              placeholder="Image path"
              value={productForm.image}
              onChange={(event) => setProductForm((current) => ({ ...current, image: event.target.value }))}
            />
            <input
              placeholder="Gallery image paths comma separated"
              value={productForm.gallery.join(", ")}
              onChange={(event) =>
                setProductForm((current) => ({
                  ...current,
                  gallery: event.target.value.split(",").map((item) => item.trim()).filter(Boolean)
                }))
              }
            />
            <input
              placeholder="Base price"
              type="number"
              value={productForm.basePrice}
              onChange={(event) => setProductForm((current) => ({ ...current, basePrice: Number(event.target.value) }))}
            />
            <input
              placeholder="Sale price"
              type="number"
              value={productForm.salePrice}
              onChange={(event) => setProductForm((current) => ({ ...current, salePrice: Number(event.target.value) }))}
            />
            <input
              placeholder="Stock"
              type="number"
              value={productForm.stock}
              onChange={(event) => setProductForm((current) => ({ ...current, stock: Number(event.target.value) }))}
            />
            <input
              placeholder="Video URL"
              value={productForm.videoUrl}
              onChange={(event) => setProductForm((current) => ({ ...current, videoUrl: event.target.value }))}
            />
            <input
              placeholder="Short description"
              value={productForm.shortDescription}
              onChange={(event) => setProductForm((current) => ({ ...current, shortDescription: event.target.value }))}
            />
            <input
              placeholder="Benefits comma separated"
              value={productForm.benefits.join(", ")}
              onChange={(event) =>
                setProductForm((current) => ({
                  ...current,
                  benefits: event.target.value.split(",").map((item) => item.trim()).filter(Boolean)
                }))
              }
            />
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={productForm.featured}
                onChange={(event) => setProductForm((current) => ({ ...current, featured: event.target.checked }))}
              />
              Featured
            </label>
            <label className="admin-checkbox">
              <input
                type="checkbox"
                checked={productForm.active}
                onChange={(event) => setProductForm((current) => ({ ...current, active: event.target.checked }))}
              />
              Visible on store
            </label>
            <textarea
              placeholder="Description"
              value={productForm.description}
              onChange={(event) => setProductForm((current) => ({ ...current, description: event.target.value }))}
            />
          </div>
          <div className="admin-actions">
            <button className="button button-small" type="button" disabled={busyAction === "product-save"} onClick={saveProduct}>
              {busyAction === "product-save" ? "Saving..." : productForm.id ? "Update Product" : "Add Product"}
            </button>
            <button className="button button-secondary button-small" type="button" onClick={() => setProductForm(emptyProduct)}>
              Reset
            </button>
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
            {filteredProducts.map((product) => (
              <div className="commerce-list-item" key={product.id}>
                <div>
                  <strong>{product.name}</strong>
                  <p>
                    {product.sku} | Stock {product.stock} | {product.active ? "Visible" : "Hidden"}
                  </p>
                </div>
                <div className="commerce-list-side">
                  <button className="button button-secondary button-small" type="button" onClick={() => loadProductIntoForm(product)}>
                    Edit
                  </button>
                  <button
                    className="button button-secondary button-small"
                    type="button"
                    disabled={busyAction === `product-delete-${product.id}`}
                    onClick={() => removeProduct(product.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
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
                  <p>{coupon.description}</p>
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
        <div className="commerce-list">
          {snapshot.orders.map((order) => (
            <div className="commerce-list-item" key={order.id}>
              <div>
                <strong>{order.customerName}</strong>
                <p>
                  {order.id} | {order.paymentProvider} | {order.paymentStatus}
                </p>
              </div>
              <div className="commerce-list-side">
                <select
                  value={order.fulfillmentStatus}
                  onChange={(event) => updateFulfillment(order.id, event.target.value)}
                  disabled={busyAction === `fulfillment-${order.id}`}
                >
                  <option value="awaiting_payment">Awaiting payment</option>
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
        </div>
      </article>
    </section>
  );
}
