/* eslint-disable @typescript-eslint/no-explicit-any */
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { estimateShippingForPostalCode, validateCouponForSubtotal } from "@/lib/commerce-pricing";
import { getCommerceShippingEstimate, isShadowfaxQuoteConfigured } from "@/lib/commerce-shipping";
import { normalizeEmail, normalizeIndianMobile, validateEmail, validateIndianMobile } from "@/lib/customer-validation";
import { getSupabaseServiceClient } from "@/lib/supabase/service";

export type PaymentProviderStatus = "planned" | "active" | "disabled";

export type CommerceSettings = {
  currencyCode: string;
  currencySymbol: string;
  supportEmail: string;
  supportPhone: string;
  payments: {
    provider: string;
    status: PaymentProviderStatus;
    description: string;
  }[];
  shippingPartners: {
    name: string;
    status: PaymentProviderStatus;
    coverage: string;
  }[];
};

export type CommerceCategory = {
  id: string;
  slug: string;
  name: string;
  description: string;
};

export type CommerceProduct = {
  id: string;
  slug: string;
  name: string;
  sku: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  badge: string;
  image: string;
  gallery?: string[];
  basePrice: number;
  salePrice: number;
  stock: number;
  featured: boolean;
  active: boolean;
  videoUrl?: string;
  benefits: string[];
};

export type CommerceProductReview = {
  id: string;
  productId: string;
  author: string;
  rating: number;
  comment: string;
  media?: {
    kind: "image" | "video";
    url: string;
  }[];
  createdAt: string;
};

export type CommerceOffer = {
  id: string;
  title: string;
  description: string;
  kind: string;
  discountType: "percent" | "flat";
  discountValue: number;
  active: boolean;
};

export type CommerceCoupon = {
  id: string;
  code: string;
  description: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minimumOrderAmount: number;
  usageLimit: number | null;
  usageCount: number;
  maxDiscountAmount?: number | null;
  perUserLimit?: number | null;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
};

export type CommerceOrder = {
  id: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: string;
  fulfillmentStatus: string;
  paymentProvider: string;
  paymentStatus: string;
  subtotal: number;
  discount: number;
  shipping: number;
  shippingMeta?: {
    provider: "shadowfax" | "standard";
    zone?: string;
    etaLabel?: string;
    live: boolean;
  };
  total: number;
  couponCode?: string;
  paymentReference?: string;
  shippingAddress?: {
    line1: string;
    landmark?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  createdAt: string;
};

export type CommerceShipment = {
  id: string;
  orderId: string;
  partner: string;
  awb: string;
  status: string;
  trackingUrl: string;
};

export type CommerceOrderItem = {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
};

export type CommerceProfile = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  createdAt: string;
  updatedAt: string;
};

export type CommerceAddress = {
  id: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  createdAt: string;
};

export type CommerceCartItem = {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  createdAt: string;
  updatedAt: string;
};

export type CommerceSnapshot = {
  settings: CommerceSettings;
  categories: CommerceCategory[];
  products: CommerceProduct[];
  offers: CommerceOffer[];
  coupons: CommerceCoupon[];
  orders: CommerceOrder[];
  orderItems: CommerceOrderItem[];
  shipments: CommerceShipment[];
  productReviews: CommerceProductReview[];
  source: "supabase" | "local";
};

export type ProductInput = {
  id?: string;
  slug: string;
  name: string;
  sku: string;
  categorySlug: string;
  shortDescription: string;
  description: string;
  badge: string;
  image: string;
  gallery: string[];
  basePrice: number;
  salePrice: number;
  stock: number;
  featured: boolean;
  active: boolean;
  videoUrl: string;
  benefits: string[];
};

export type OfferInput = {
  id?: string;
  title: string;
  description: string;
  kind: string;
  discountType: "percent" | "flat";
  discountValue: number;
  active: boolean;
};

export type CouponInput = {
  id?: string;
  code: string;
  description: string;
  discountType: "percent" | "flat";
  discountValue: number;
  minimumOrderAmount: number;
  usageLimit?: number | null;
  usageCount?: number;
  maxDiscountAmount?: number | null;
  perUserLimit?: number | null;
  active: boolean;
  startsAt?: string;
  endsAt?: string;
};

export type CheckoutItemInput = {
  productId: string;
  quantity: number;
};

export type CreateOrderInput = {
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: {
    line1: string;
    landmark?: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: CheckoutItemInput[];
  couponCode?: string;
  paymentProvider: "Razorpay" | "PayPal";
};

type OrderPaymentReference = {
  provider: "Razorpay" | "PayPal" | "Mock";
  paymentRecordId?: string;
  externalOrderId?: string;
  externalPaymentId?: string;
  mode?: "gateway" | "mock";
  verifiedAt?: string;
};

const commerceDataFile = join(process.cwd(), "data", "commerce.json");
const commerceUserDataFile = join(process.cwd(), "data", "commerce-users.json");

type LocalUserState = {
  profiles: CommerceProfile[];
  addresses: CommerceAddress[];
  cartItems: CommerceCartItem[];
};

function getSupabaseClient(): any {
  return getSupabaseServiceClient() as any;
}

async function readLocalSnapshot() {
  const content = await readFile(commerceDataFile, "utf8");
  const snapshot = JSON.parse(content) as Omit<CommerceSnapshot, "source">;
  return {
    ...snapshot,
    products: (snapshot.products ?? []).map((product) => ({
      ...product,
      active: product.active ?? true
    })),
    coupons: (snapshot.coupons ?? []).map((coupon) => ({
      ...coupon,
      usageLimit: coupon.usageLimit ?? null,
      usageCount: coupon.usageCount ?? 0,
      startsAt: coupon.startsAt ?? undefined,
      endsAt: coupon.endsAt ?? undefined
    })),
    source: "local" as const
  };
}

async function writeLocalSnapshot(snapshot: Omit<CommerceSnapshot, "source">) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(commerceDataFile, JSON.stringify(snapshot, null, 2), "utf8");
}

async function readLocalUserState(): Promise<LocalUserState> {
  try {
    const content = await readFile(commerceUserDataFile, "utf8");
    const parsed = JSON.parse(content) as Partial<LocalUserState>;
    return {
      profiles: parsed.profiles ?? [],
      addresses: parsed.addresses ?? [],
      cartItems: parsed.cartItems ?? []
    };
  } catch {
    return {
      profiles: [],
      addresses: [],
      cartItems: []
    };
  }
}

async function writeLocalUserState(state: LocalUserState) {
  const { writeFile } = await import("node:fs/promises");
  await writeFile(commerceUserDataFile, JSON.stringify(state, null, 2), "utf8");
}

async function readSupabaseSnapshot(): Promise<CommerceSnapshot | null> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const [settingsResult, categoriesResult, productsResult, offersResult, couponsResult, ordersResult, orderItemsResult, shipmentsResult, productReviewsResult] =
      await Promise.all([
        supabase.from("store_settings").select("currency_code, currency_symbol, support_email, support_phone").limit(1).maybeSingle(),
        supabase.from("categories").select("id, slug, name, description").order("name"),
        supabase
          .from("products")
          .select(
            "id, slug, name, sku, category_slug, short_description, description, badge, image_url, gallery, base_price, sale_price, stock, featured, active, video_url, benefits"
          )
          .order("featured", { ascending: false })
          .order("name"),
        supabase.from("offers").select("id, title, description, kind, discount_type, discount_value, active").order("title"),
        supabase
          .from("coupons")
          .select("id, code, description, discount_type, discount_value, minimum_order_amount, usage_limit, usage_count, max_discount_amount, per_user_limit, active, starts_at, ends_at")
          .order("code"),
        supabase
          .from("orders")
          .select(
            "id, user_id, customer_name, customer_email, customer_phone, status, fulfillment_status, payment_provider, payment_status, payment_reference, subtotal, discount, shipping, total, coupon_code, shipping_address, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(800),
        supabase
          .from("order_items")
          .select("id, order_id, product_id, product_name, sku, quantity, unit_price, total_price")
          .limit(5000),
        supabase.from("shipments").select("id, order_id, partner, awb, status, tracking_url").order("id", { ascending: false }).limit(12),
        supabase.from("product_reviews").select("*").order("created_at", { ascending: false }).limit(250)
      ]);

    const results = [settingsResult, categoriesResult, productsResult, offersResult, couponsResult, ordersResult, orderItemsResult, shipmentsResult, productReviewsResult];
    const firstError = results.find((result) => result.error)?.error;

    if (firstError) {
      throw new Error(firstError.message);
    }

    const settingsRow = settingsResult.data as
      | {
          currency_code: string;
          currency_symbol: string;
          support_email: string;
          support_phone: string;
        }
      | null;

    const settings = settingsRow
      ? {
          currencyCode: settingsRow.currency_code,
          currencySymbol: settingsRow.currency_symbol,
          supportEmail: settingsRow.support_email,
          supportPhone: settingsRow.support_phone,
          payments: [
            {
              provider: "Razorpay",
              status: (process.env.RAZORPAY_KEY_ID ? "active" : "planned") as PaymentProviderStatus,
              description: "Primary domestic gateway for UPI, cards, netbanking, and wallets."
            },
            {
              provider: "PayPal",
              status: (process.env.PAYPAL_CLIENT_ID ? "active" : "planned") as PaymentProviderStatus,
              description: "Secondary gateway for international customers."
            }
          ],
          shippingPartners: [
            {
              name: "Shadowfax",
              status: (isShadowfaxQuoteConfigured() ? "active" : "planned") as PaymentProviderStatus,
              coverage: "India live checkout quotes"
            },
            {
              name: "Shiprocket",
              status: (process.env.SHIPROCKET_EMAIL ? "active" : "planned") as PaymentProviderStatus,
              coverage: "India"
            }
          ]
        }
      : null;

    if (!settings) {
      return null;
    }

    const categoryRows = (categoriesResult.data ?? []) as Array<{ id: string; slug: string; name: string; description?: string | null }>;
    const productRows = (productsResult.data ?? []) as Array<{
      id: string;
      slug: string;
      name: string;
      sku: string;
      category_slug: string;
      short_description: string;
      description?: string | null;
      badge?: string | null;
      image_url: string;
      gallery?: unknown;
      base_price: number;
      sale_price: number;
      stock: number;
      featured: boolean;
      active?: boolean | null;
      video_url?: string | null;
      benefits?: unknown;
    }>;
    const offerRows = (offersResult.data ?? []) as Array<{
      id: string;
      title: string;
      description?: string | null;
      kind: string;
      discount_type: "percent" | "flat";
      discount_value: number;
      active: boolean;
    }>;
    const couponRows = (couponsResult.data ?? []) as Array<{
      id: string;
      code: string;
      description?: string | null;
      discount_type: "percent" | "flat";
      discount_value: number;
      minimum_order_amount: number;
      usage_limit?: number | null;
      usage_count?: number | null;
      max_discount_amount?: number | null;
      per_user_limit?: number | null;
      active: boolean;
      starts_at?: string | null;
      ends_at?: string | null;
    }>;
    const orderRows = (ordersResult.data ?? []) as Array<{
      id: string;
      user_id?: string | null;
      customer_name: string;
      customer_email: string;
      customer_phone?: string | null;
      status: string;
      fulfillment_status: string;
      payment_provider: string;
      payment_status: string;
      payment_reference?: string | null;
      subtotal: number;
      discount: number;
      shipping: number;
      total: number;
      coupon_code?: string | null;
      shipping_address?: Record<string, unknown> | null;
      created_at: string;
    }>;
    const orderItemRows = (orderItemsResult.data ?? []) as Array<{
      id: string;
      order_id: string;
      product_id: string;
      product_name: string;
      sku: string;
      quantity: number;
      unit_price: number;
      total_price: number;
    }>;
    const shipmentRows = (shipmentsResult.data ?? []) as Array<{
      id: string;
      order_id: string;
      partner: string;
      awb: string;
      status: string;
      tracking_url: string;
    }>;
    const reviewRows = (productReviewsResult.data ?? []) as Array<{
      id: string;
      product_id: string;
      author: string;
      rating: number;
      comment: string;
      media?: unknown;
      created_at: string;
    }>;

    return {
      settings,
      categories: categoryRows.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description ?? ""
      })),
      products: productRows.map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        sku: item.sku,
        categorySlug: item.category_slug,
        shortDescription: item.short_description,
        description: item.description ?? "",
        badge: item.badge ?? "",
        image: item.image_url,
        gallery: Array.isArray(item.gallery) ? item.gallery : [item.image_url],
        basePrice: item.base_price,
        salePrice: item.sale_price,
        stock: item.stock,
        featured: item.featured,
        active: item.active ?? true,
        videoUrl: item.video_url ?? "",
        benefits: Array.isArray(item.benefits) ? item.benefits : []
      })),
      offers: offerRows.map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description ?? "",
        kind: item.kind,
        discountType: item.discount_type,
        discountValue: item.discount_value,
        active: item.active
      })),
      coupons: couponRows.map((item) => ({
        id: item.id,
        code: item.code,
        description: item.description ?? "",
        discountType: item.discount_type,
        discountValue: item.discount_value,
        minimumOrderAmount: item.minimum_order_amount,
        usageLimit: item.usage_limit ?? null,
        usageCount: item.usage_count ?? 0,
        maxDiscountAmount: item.max_discount_amount ?? null,
        perUserLimit: item.per_user_limit ?? null,
        active: item.active,
        startsAt: item.starts_at ?? undefined,
        endsAt: item.ends_at ?? undefined
      })),
      orders: orderRows.map((item) => {
        const shippingAddress = item.shipping_address ?? {};
        return {
          id: item.id,
          userId: item.user_id ?? undefined,
          customerName: item.customer_name,
          customerEmail: item.customer_email,
          customerPhone: item.customer_phone ?? undefined,
          status: item.status,
          fulfillmentStatus: item.fulfillment_status,
          paymentProvider: item.payment_provider,
          paymentStatus: item.payment_status,
          subtotal: item.subtotal,
          discount: item.discount,
          shipping: item.shipping,
          total: item.total,
          couponCode: item.coupon_code ?? undefined,
          paymentReference: item.payment_reference ?? undefined,
          shippingAddress: item.shipping_address
            ? {
                line1: String(shippingAddress.line1 ?? ""),
                landmark: String(shippingAddress.landmark ?? ""),
                city: String(shippingAddress.city ?? ""),
                state: String(shippingAddress.state ?? ""),
                postalCode: String(shippingAddress.postalCode ?? shippingAddress.postal_code ?? ""),
                country: String(shippingAddress.country ?? "India")
              }
            : undefined,
          createdAt: item.created_at
        } satisfies CommerceOrder;
      }),
      orderItems: orderItemRows.map((item) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price
      })),
      shipments: shipmentRows.map((item) => ({
        id: item.id,
        orderId: item.order_id,
        partner: item.partner,
        awb: item.awb,
        status: item.status,
        trackingUrl: item.tracking_url
      })),
      productReviews: reviewRows.map((item) => ({
        id: item.id,
        productId: item.product_id,
        author: item.author,
        rating: item.rating,
        comment: item.comment,
        media: ensureReviewMedia(item.media),
        createdAt: item.created_at
      })),
      source: "supabase"
    };
  } catch {
    return null;
  }
}

export async function loadCommerceSnapshot() {
  const supabaseSnapshot = await readSupabaseSnapshot();
  if (supabaseSnapshot) {
    return supabaseSnapshot;
  }

  return readLocalSnapshot();
}

export async function listStoreProducts() {
  const snapshot = await loadCommerceSnapshot();
  return snapshot.products.filter((product) => product.active);
}

export async function getStoreProduct(slug: string) {
  const snapshot = await loadCommerceSnapshot();
  return snapshot.products.find((product) => product.slug === slug && product.active) ?? null;
}

function sanitizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function sanitizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

function sanitizeCurrency(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

function ensureBenefits(value: string[]) {
  return value.map((item) => sanitizeText(item)).filter(Boolean);
}

function ensureGallery(value: string[]) {
  return value.map((item) => item.trim()).filter(Boolean);
}

function sanitizeReviewMediaUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return "";
  }

  if (trimmed.startsWith("/")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:") {
      return "";
    }
    return parsed.toString();
  } catch {
    return "";
  }
}

function ensureReviewMedia(
  value: unknown
): {
  kind: "image" | "video";
  url: string;
}[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (!item || typeof item !== "object") {
        return null;
      }

      const kind = "kind" in item && item.kind === "video" ? "video" : "image";
      const url = "url" in item && typeof item.url === "string" ? sanitizeReviewMediaUrl(item.url) : "";
      if (!url) {
        return null;
      }

      return {
        kind,
        url
      };
    })
    .filter((item): item is { kind: "image" | "video"; url: string } => Boolean(item))
    .slice(0, 4);
}

function cloneLocalSnapshot(snapshot: CommerceSnapshot): Omit<CommerceSnapshot, "source"> {
  return {
    settings: snapshot.settings,
    categories: snapshot.categories,
    products: snapshot.products,
    offers: snapshot.offers,
    coupons: snapshot.coupons,
    orders: snapshot.orders,
    orderItems: snapshot.orderItems,
    shipments: snapshot.shipments,
    productReviews: snapshot.productReviews
  };
}

function buildOrderId() {
  return `order-${Date.now()}`;
}

function serializeOrderPaymentReference(reference: OrderPaymentReference) {
  return JSON.stringify(reference);
}

function parseOrderPaymentReference(value?: string) {
  if (!value) {
    return null;
  }

  try {
    const parsed = JSON.parse(value) as Partial<OrderPaymentReference>;
    if (!parsed.provider) {
      return null;
    }
    return parsed as OrderPaymentReference;
  } catch {
    return null;
  }
}

function mergePaymentReference(existing: OrderPaymentReference | null, incoming: OrderPaymentReference) {
  return {
    ...existing,
    ...incoming,
    provider: incoming.provider || existing?.provider || "Mock"
  } satisfies OrderPaymentReference;
}

function normalizeOptionalDate(value: string | undefined) {
  const trimmed = value?.trim();
  return trimmed ? new Date(trimmed).toISOString() : undefined;
}

function normalizeUsageLimit(value: number | null | undefined) {
  if (value === null || value === undefined || value === 0) {
    return null;
  }

  return sanitizeCurrency(value);
}

export async function upsertProduct(input: ProductInput) {
  const snapshot = await loadCommerceSnapshot();
  const categoryExists = snapshot.categories.some((category) => category.slug === sanitizeSlug(input.categorySlug));

  if (!input.name.trim() || !input.sku.trim() || !input.shortDescription.trim() || !input.image.trim()) {
    throw new Error("Name, SKU, short description, and image are required.");
  }

  if (!categoryExists) {
    throw new Error("Select a valid product category.");
  }

  if (sanitizeCurrency(input.salePrice) > sanitizeCurrency(input.basePrice)) {
    throw new Error("Sale price cannot be greater than base price.");
  }

  if (!input.description.trim()) {
    throw new Error("Product description is required.");
  }

  const payload = {
    id: input.id || crypto.randomUUID(),
    slug: sanitizeSlug(input.slug || input.name),
    name: sanitizeText(input.name),
    sku: sanitizeText(input.sku).toUpperCase(),
    categorySlug: sanitizeSlug(input.categorySlug),
    shortDescription: sanitizeText(input.shortDescription),
    description: input.description.trim(),
    badge: sanitizeText(input.badge),
    image: input.image.trim(),
    gallery: ensureGallery(input.gallery.length ? input.gallery : [input.image.trim()]),
    basePrice: sanitizeCurrency(input.basePrice),
    salePrice: sanitizeCurrency(input.salePrice),
    stock: sanitizeCurrency(input.stock),
    featured: Boolean(input.featured),
    active: Boolean(input.active),
    videoUrl: input.videoUrl.trim(),
    benefits: ensureBenefits(input.benefits)
  } satisfies CommerceProduct;

  const supabase = getSupabaseClient();

  if (supabase) {
    const { error } = await supabase.from("products").upsert({
      id: payload.id,
      slug: payload.slug,
      name: payload.name,
      sku: payload.sku,
      category_slug: payload.categorySlug,
      short_description: payload.shortDescription,
      description: payload.description,
      badge: payload.badge,
      image_url: payload.image,
      gallery: payload.gallery,
      base_price: payload.basePrice,
      sale_price: payload.salePrice,
      stock: payload.stock,
      featured: payload.featured,
      active: payload.active,
      video_url: payload.videoUrl || null,
      benefits: payload.benefits
    });

    if (error) {
      throw new Error(error.message);
    }

    return payload;
  }

  const local = cloneLocalSnapshot(snapshot);
  const existingIndex = local.products.findIndex((item) => item.id === payload.id);

  if (existingIndex >= 0) {
    local.products[existingIndex] = payload;
  } else {
    local.products.unshift(payload);
  }

  await writeLocalSnapshot(local);
  return payload;
}

export async function deleteProduct(productId: string) {
  const supabase = getSupabaseClient();

  if (supabase) {
    const { error } = await supabase.from("products").delete().eq("id", productId);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const snapshot = await loadCommerceSnapshot();
  const local = cloneLocalSnapshot(snapshot);
  local.products = local.products.filter((item) => item.id !== productId);
  local.orderItems = local.orderItems.filter((item) => item.productId !== productId);
  local.productReviews = local.productReviews.filter((item) => item.productId !== productId);
  await writeLocalSnapshot(local);

  const userState = await readLocalUserState();
  userState.cartItems = userState.cartItems.filter((item) => item.productId !== productId);
  await writeLocalUserState(userState);
}

export async function createProductReview(input: {
  productId: string;
  author: string;
  rating: number;
  comment: string;
  media?: {
    kind: "image" | "video";
    url: string;
  }[];
}) {
  const snapshot = await loadCommerceSnapshot();
  const product = snapshot.products.find((item) => item.id === input.productId && item.active);
  if (!product) {
    throw new Error("This product is not available for review.");
  }

  if (sanitizeText(input.comment).length < 8) {
    throw new Error("Write at least a short review before submitting.");
  }

  const review: CommerceProductReview = {
    id: crypto.randomUUID(),
    productId: input.productId,
    author: sanitizeText(input.author),
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    comment: sanitizeText(input.comment),
    media: ensureReviewMedia(input.media),
    createdAt: new Date().toISOString()
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("product_reviews").insert({
      id: review.id,
      product_id: review.productId,
      author: review.author,
      rating: review.rating,
      comment: review.comment,
      media: review.media ?? [],
      created_at: review.createdAt
    });
    if (error) {
      throw new Error(error.message);
    }
    return review;
  }

  const local = cloneLocalSnapshot(snapshot);
  local.productReviews.unshift(review);
  await writeLocalSnapshot(local);
  return review;
}

export function getProductReviews(snapshot: CommerceSnapshot, productId: string) {
  const reviews = snapshot.productReviews.filter((review) => review.productId === productId);
  const reviewCount = reviews.length;
  const rating = reviewCount ? Number((reviews.reduce((sum, review) => sum + review.rating, 0) / reviewCount).toFixed(1)) : 0;

  return {
    reviews,
    reviewCount,
    rating
  };
}

export async function upsertOffer(input: OfferInput) {
  if (!input.title.trim()) {
    throw new Error("Offer title is required.");
  }

  if (!input.kind.trim()) {
    throw new Error("Offer kind is required.");
  }

  const discountValue = sanitizeCurrency(input.discountValue);
  if (discountValue <= 0) {
    throw new Error("Offer discount must be greater than zero.");
  }

  if (input.discountType === "percent" && discountValue > 100) {
    throw new Error("Percent offers cannot exceed 100.");
  }

  const payload = {
    id: input.id || crypto.randomUUID(),
    title: sanitizeText(input.title),
    description: input.description.trim(),
    kind: sanitizeSlug(input.kind),
    discountType: input.discountType,
    discountValue,
    active: Boolean(input.active)
  } satisfies CommerceOffer;

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("offers").upsert({
      id: payload.id,
      title: payload.title,
      description: payload.description,
      kind: payload.kind,
      discount_type: payload.discountType,
      discount_value: payload.discountValue,
      active: payload.active
    });
    if (error) {
      throw new Error(error.message);
    }
    return payload;
  }

  const snapshot = await loadCommerceSnapshot();
  const local = cloneLocalSnapshot(snapshot);
  const index = local.offers.findIndex((item) => item.id === payload.id);
  if (index >= 0) {
    local.offers[index] = payload;
  } else {
    local.offers.unshift(payload);
  }
  await writeLocalSnapshot(local);
  return payload;
}

export async function deleteOffer(offerId: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("offers").delete().eq("id", offerId);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }
  const snapshot = await loadCommerceSnapshot();
  const local = cloneLocalSnapshot(snapshot);
  local.offers = local.offers.filter((item) => item.id !== offerId);
  await writeLocalSnapshot(local);
}

export async function upsertCoupon(input: CouponInput) {
  if (!input.code.trim()) {
    throw new Error("Coupon code is required.");
  }

  const discountValue = sanitizeCurrency(input.discountValue);
  if (discountValue <= 0) {
    throw new Error("Coupon discount must be greater than zero.");
  }

  if (input.discountType === "percent" && discountValue > 100) {
    throw new Error("Percent coupons cannot exceed 100.");
  }

  const startsAt = normalizeOptionalDate(input.startsAt);
  const endsAt = normalizeOptionalDate(input.endsAt);
  if (startsAt && endsAt && new Date(startsAt) > new Date(endsAt)) {
    throw new Error("Coupon end date must be after the start date.");
  }

  const payload = {
    id: input.id || crypto.randomUUID(),
    code: sanitizeText(input.code).toUpperCase(),
    description: input.description.trim(),
    discountType: input.discountType,
    discountValue,
    minimumOrderAmount: sanitizeCurrency(input.minimumOrderAmount),
    usageLimit: normalizeUsageLimit(input.usageLimit),
    usageCount: sanitizeCurrency(input.usageCount ?? 0),
    maxDiscountAmount: input.maxDiscountAmount && input.maxDiscountAmount > 0
      ? sanitizeCurrency(input.maxDiscountAmount)
      : null,
    perUserLimit: input.perUserLimit && input.perUserLimit > 0
      ? Math.max(1, Math.round(input.perUserLimit))
      : null,
    active: Boolean(input.active),
    startsAt,
    endsAt
  } satisfies CommerceCoupon;

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("coupons").upsert({
      id: payload.id,
      code: payload.code,
      description: payload.description,
      discount_type: payload.discountType,
      discount_value: payload.discountValue,
      minimum_order_amount: payload.minimumOrderAmount,
      usage_limit: payload.usageLimit,
      usage_count: payload.usageCount,
      max_discount_amount: payload.maxDiscountAmount ?? null,
      per_user_limit: payload.perUserLimit ?? null,
      active: payload.active,
      starts_at: payload.startsAt ?? null,
      ends_at: payload.endsAt ?? null
    });
    if (error) {
      throw new Error(error.message);
    }
    return payload;
  }

  const snapshot = await loadCommerceSnapshot();
  const local = cloneLocalSnapshot(snapshot);
  const index = local.coupons.findIndex((item) => item.id === payload.id);
  if (index >= 0) {
    local.coupons[index] = payload;
  } else {
    local.coupons.unshift(payload);
  }
  await writeLocalSnapshot(local);
  return payload;
}

export async function deleteCoupon(couponId: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("coupons").delete().eq("id", couponId);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }
  const snapshot = await loadCommerceSnapshot();
  const local = cloneLocalSnapshot(snapshot);
  local.coupons = local.coupons.filter((item) => item.id !== couponId);
  await writeLocalSnapshot(local);
}

export async function createCommerceOrder(input: CreateOrderInput) {
  const snapshot = await loadCommerceSnapshot();
  const normalizedItems = Array.from(
    input.items.reduce((map, item) => {
      const productId = item.productId?.trim();
      const quantity = Math.max(0, Math.round(item.quantity));
      if (!productId || quantity <= 0) {
        return map;
      }

      map.set(productId, (map.get(productId) ?? 0) + quantity);
      return map;
    }, new Map<string, number>())
  ).map(([productId, quantity]) => ({
    productId,
    quantity
  }));

  const matchedItems = normalizedItems
    .map((item) => {
      const product = snapshot.products.find((entry) => entry.id === item.productId);
      if (!product || item.quantity <= 0 || product.stock < item.quantity) {
        return null;
      }

      return {
        product,
        quantity: item.quantity
      };
    })
    .filter((item): item is { product: CommerceProduct; quantity: number } => Boolean(item));

  if (matchedItems.length !== normalizedItems.length) {
    throw new Error("One or more cart items are unavailable or out of stock.");
  }

  if (!matchedItems.length) {
    throw new Error("No valid order items were provided.");
  }

  if (!input.customerName.trim() || !input.customerPhone.trim()) {
    throw new Error("Customer name and phone number are required.");
  }

  if (
    !input.shippingAddress?.line1?.trim() ||
    !input.shippingAddress?.city?.trim() ||
    !input.shippingAddress?.state?.trim() ||
    !input.shippingAddress?.postalCode?.trim() ||
    !input.shippingAddress?.country?.trim()
  ) {
    throw new Error("A complete shipping address is required.");
  }

  const subtotal = matchedItems.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const normalizedCouponCode = input.couponCode?.trim().toUpperCase() ?? "";
  const coupon = normalizedCouponCode
    ? snapshot.coupons.find((item) => item.code === normalizedCouponCode) ?? null
    : null;
  const couponCheck = normalizedCouponCode
    ? validateCouponForSubtotal(coupon, subtotal)
    : { valid: false, coupon: null, discount: 0 };

  if (normalizedCouponCode && !couponCheck.valid) {
    throw new Error(couponCheck.reason || "This coupon cannot be applied.");
  }

  const discount = couponCheck.discount;
  const shippingEstimate = await getCommerceShippingEstimate({
    postalCode: input.shippingAddress.postalCode,
    subtotal: subtotal - discount,
    itemCount: matchedItems.reduce((sum, item) => sum + item.quantity, 0)
  });
  if (!shippingEstimate.valid || !shippingEstimate.serviceable) {
    throw new Error(shippingEstimate.message);
  }

  const shipping = shippingEstimate.shippingCharge;
  const shippingMeta = {
    provider: shippingEstimate.provider,
    zone: shippingEstimate.zone,
    etaLabel: shippingEstimate.etaLabel,
    live: shippingEstimate.live
  };
  const total = Math.max(0, subtotal - discount + shipping);
  const orderId = buildOrderId();
  const createdAt = new Date().toISOString();

  const order: CommerceOrder = {
    id: orderId,
    userId: input.userId,
    customerName: sanitizeText(input.customerName),
    customerEmail: input.customerEmail.trim().toLowerCase(),
    customerPhone: input.customerPhone.trim(),
    status: "pending_payment",
    fulfillmentStatus: "awaiting_payment",
    paymentProvider: input.paymentProvider,
    paymentStatus: "created",
    subtotal,
    discount,
    shipping,
    shippingMeta,
    total,
    couponCode: coupon?.code ?? undefined,
    paymentReference: undefined,
    shippingAddress: input.shippingAddress,
    createdAt
  };

  const orderItems = matchedItems.map((item) => ({
    id: crypto.randomUUID(),
    orderId,
    productId: item.product.id,
    productName: item.product.name,
    sku: item.product.sku,
    quantity: item.quantity,
    unitPrice: item.product.salePrice,
    totalPrice: item.product.salePrice * item.quantity
  })) satisfies CommerceOrderItem[];

  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase.rpc("create_order_with_payment", {
      p_order_id: order.id,
      p_user_id: order.userId ?? null,
      p_customer_name: order.customerName,
      p_customer_email: order.customerEmail,
      p_customer_phone: input.customerPhone.trim(),
      p_status: order.status,
      p_fulfillment_status: order.fulfillmentStatus,
      p_payment_provider: order.paymentProvider,
      p_payment_status: order.paymentStatus,
      p_subtotal: order.subtotal,
      p_discount: order.discount,
      p_shipping: order.shipping,
      p_total: order.total,
      p_coupon_code: coupon?.code ?? null,
      p_shipping_address: input.shippingAddress,
      p_shipping_meta: shippingMeta,
      p_items: orderItems.map((item) => ({
        id: item.id,
        order_id: item.orderId,
        product_id: item.productId,
        product_name: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice
      })),
      p_payment_reference: null,
      p_currency_code: snapshot.settings.currencyCode
    });
    if (error) {
      throw new Error(error.message);
    }

    const paymentRecordId = typeof data?.payment_record_id === "string" ? data.payment_record_id : "";
    if (!paymentRecordId) {
      throw new Error("Checkout transaction did not return a payment record.");
    }

    order.paymentReference = serializeOrderPaymentReference({
      provider: order.paymentProvider as "Razorpay" | "PayPal",
      paymentRecordId,
      mode: "gateway"
    });
    return { order, orderItems, coupon };
  }

  const local = cloneLocalSnapshot(snapshot);
  local.orders.unshift(order);
  local.orderItems.unshift(...orderItems);
  await writeLocalSnapshot(local);
  return { order, orderItems, coupon };
}

export async function setOrderPaymentReference(orderId: string, paymentReference: OrderPaymentReference) {
  const snapshot = await loadCommerceSnapshot();
  const existingOrder = snapshot.orders.find((order) => order.id === orderId);

  if (!existingOrder) {
    throw new Error("Order was not found.");
  }

  const mergedReference = mergePaymentReference(parseOrderPaymentReference(existingOrder.paymentReference), paymentReference);
  const serializedReference = serializeOrderPaymentReference(mergedReference);

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_reference: serializedReference,
        updated_at: new Date().toISOString()
      })
      .eq("id", orderId);
    if (error) {
      throw new Error(error.message);
    }

    if (mergedReference.paymentRecordId) {
      const { error: paymentError } = await supabase
        .from("payment_records")
        .update({
          provider_order_id: mergedReference.externalOrderId ?? null,
          provider_payment_id: mergedReference.externalPaymentId ?? null,
          payload: {
            provider: mergedReference.provider,
            mode: mergedReference.mode ?? "gateway"
          },
          updated_at: new Date().toISOString()
        })
        .eq("id", mergedReference.paymentRecordId);
      if (paymentError) {
        throw new Error(paymentError.message);
      }
    }
    return;
  }

  const local = cloneLocalSnapshot(snapshot);
  local.orders = local.orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          paymentReference: serializedReference
        }
      : order
  );
  await writeLocalSnapshot(local);
}

export async function updateOrderPaymentStatus(input: {
  orderId: string;
  paymentStatus: string;
  status: string;
  paymentReference?: OrderPaymentReference;
  expectedProvider?: "Razorpay" | "PayPal";
  expectedExternalOrderId?: string;
}) {
  const { orderId, paymentStatus, status, paymentReference, expectedProvider, expectedExternalOrderId } = input;
  const snapshot = await loadCommerceSnapshot();
  const existingOrder = snapshot.orders.find((order) => order.id === orderId);

  if (!existingOrder) {
    throw new Error("Order was not found.");
  }

  if (expectedProvider && existingOrder.paymentProvider !== expectedProvider) {
    throw new Error("Payment provider mismatch for this order.");
  }

  const currentReference = parseOrderPaymentReference(existingOrder.paymentReference);
  if (
    expectedExternalOrderId &&
    currentReference?.externalOrderId &&
    currentReference.externalOrderId !== expectedExternalOrderId
  ) {
    throw new Error("Payment reference mismatch for this order.");
  }

  const paid = status === "paid" || paymentStatus === "captured";
  const wasAlreadyPaid =
    existingOrder.status === "paid" ||
    existingOrder.paymentStatus === "captured" ||
    existingOrder.paymentStatus === "paid";

  const mergedPaymentReference = paymentReference
    ? mergePaymentReference(currentReference, paymentReference)
    : currentReference;
  const nextPaymentReference = mergedPaymentReference
    ? serializeOrderPaymentReference(mergedPaymentReference)
    : existingOrder.paymentReference ?? null;

  const supabase = getSupabaseClient();
  if (supabase) {
    if (paid && mergedPaymentReference?.paymentRecordId) {
      const { error } = await supabase.rpc("finalize_payment_capture", {
        p_order_id: orderId,
        p_payment_record_id: mergedPaymentReference.paymentRecordId,
        p_provider: expectedProvider ?? mergedPaymentReference.provider,
        p_external_order_id: mergedPaymentReference.externalOrderId ?? expectedExternalOrderId ?? null,
        p_external_payment_id: mergedPaymentReference.externalPaymentId ?? null,
        p_payment_status: paymentStatus,
        p_order_status: status,
        p_payment_reference: nextPaymentReference,
        p_failure_code: null,
        p_failure_message: null,
        p_payload: {
          verifiedAt: mergedPaymentReference.verifiedAt ?? new Date().toISOString(),
          provider: mergedPaymentReference.provider,
          mode: mergedPaymentReference.mode ?? "gateway"
        }
      });
      if (error) {
        throw new Error(error.message);
      }
      return;
    }

    const { data: liveOrder, error: liveOrderError } = await supabase
      .from("orders")
      .select("id, payment_status, status, payment_provider, payment_reference, coupon_code")
      .eq("id", orderId)
      .single();
    if (liveOrderError) {
      throw new Error(liveOrderError.message);
    }

    const liveOrderReference = parseOrderPaymentReference(liveOrder.payment_reference ?? undefined);
    if (expectedProvider && liveOrder.payment_provider !== expectedProvider) {
      throw new Error("Payment provider mismatch for this order.");
    }
    if (
      expectedExternalOrderId &&
      liveOrderReference?.externalOrderId &&
      liveOrderReference.externalOrderId !== expectedExternalOrderId
    ) {
      throw new Error("Payment reference mismatch for this order.");
    }

    const liveWasAlreadyPaid =
      liveOrder.status === "paid" ||
      liveOrder.payment_status === "captured" ||
      liveOrder.payment_status === "paid";

    if (paid && liveWasAlreadyPaid) {
      return;
    }

    if (paid && !wasAlreadyPaid && !liveWasAlreadyPaid) {
      const orderItems = snapshot.orderItems.filter((item) => item.orderId === orderId);
      const rollbackStocks: Array<{ productId: string; stock: number }> = [];
      let couponRollback: { id: string; usageCount: number } | null = null;

      try {
        for (const line of orderItems) {
          const { data: product, error: productError } = await supabase
            .from("products")
            .select("id, stock")
            .eq("id", line.productId)
            .single();
          if (productError) {
            throw new Error(productError.message);
          }
          if (product.stock < line.quantity) {
            throw new Error("One or more ordered products are no longer in stock.");
          }

          const nextStock = product.stock - line.quantity;
          const { data: updatedProducts, error: stockError } = await supabase
            .from("products")
            .update({ stock: nextStock, updated_at: new Date().toISOString() })
            .eq("id", line.productId)
            .eq("stock", product.stock)
            .select("id");
          if (stockError) {
            throw new Error(stockError.message);
          }
          if (!updatedProducts?.length) {
            throw new Error("Stock changed during payment confirmation. Retry checkout.");
          }

          rollbackStocks.push({
            productId: line.productId,
            stock: product.stock
          });
        }

        if (existingOrder.couponCode) {
          const { data: coupon, error: couponLookupError } = await supabase
            .from("coupons")
            .select("id, usage_count")
            .eq("code", existingOrder.couponCode)
            .maybeSingle();
          if (couponLookupError) {
            throw new Error(couponLookupError.message);
          }
          if (coupon) {
            const { data: updatedCoupons, error: couponError } = await supabase
              .from("coupons")
              .update({ usage_count: coupon.usage_count + 1 })
              .eq("id", coupon.id)
              .eq("usage_count", coupon.usage_count)
              .select("id");
            if (couponError) {
              throw new Error(couponError.message);
            }
            if (!updatedCoupons?.length) {
              throw new Error("Coupon usage changed during payment confirmation. Retry checkout.");
            }
            couponRollback = {
              id: coupon.id,
              usageCount: coupon.usage_count
            };
          }
        }

        const { data: updatedOrders, error } = await supabase
          .from("orders")
          .update({
            payment_status: paymentStatus,
            status,
            payment_reference: nextPaymentReference,
            updated_at: new Date().toISOString(),
            ...(paid ? { fulfillment_status: "processing" } : {})
          })
          .eq("id", orderId)
          .eq("payment_status", liveOrder.payment_status)
          .eq("status", liveOrder.status)
          .select("id, payment_status, status");
        if (error) {
          throw new Error(error.message);
        }
        if (!updatedOrders?.length) {
          throw new Error("Order state changed during payment confirmation. Retry loading the order.");
        }
      } catch (error) {
        for (const item of rollbackStocks.reverse()) {
          await supabase
            .from("products")
            .update({ stock: item.stock, updated_at: new Date().toISOString() })
            .eq("id", item.productId);
        }

        if (couponRollback) {
          await supabase
            .from("coupons")
            .update({ usage_count: couponRollback.usageCount })
            .eq("id", couponRollback.id);
        }

        throw error;
      }

      return;
    }

    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status,
        payment_reference: nextPaymentReference,
        updated_at: new Date().toISOString(),
        ...(paid ? { fulfillment_status: "processing" } : {})
      })
      .eq("id", orderId);
    if (error) {
      throw new Error(error.message);
    }

    return;
  }

  const local = cloneLocalSnapshot(snapshot);
  local.orders = local.orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          paymentStatus,
          status,
          paymentReference: nextPaymentReference ?? undefined,
          fulfillmentStatus: paid ? "processing" : order.fulfillmentStatus
        }
      : order
  );

  if (paid && !wasAlreadyPaid) {
    const orderItems = local.orderItems.filter((item) => item.orderId === orderId);
    local.products = local.products.map((product) => {
      const line = orderItems.find((item) => item.productId === product.id);
      if (!line) {
        return product;
      }

      return {
        ...product,
        stock: Math.max(0, product.stock - line.quantity)
      };
    });
    local.coupons = local.coupons.map((coupon) =>
      coupon.code === existingOrder.couponCode
        ? {
            ...coupon,
            usageCount: coupon.usageCount + 1
          }
        : coupon
    );
  }

  await writeLocalSnapshot(local);
}

export async function updateOrderFulfillment(orderId: string, fulfillmentStatus: string) {
  const statusMap: Record<string, string> = {
    awaiting_payment: "pending_payment",
    processing: "paid",
    packed: "paid",
    pickup_scheduled: "paid",
    shipped: "shipped",
    delivered: "delivered"
  };
  const nextStatus = statusMap[fulfillmentStatus] ?? fulfillmentStatus;

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("orders")
      .update({ fulfillment_status: fulfillmentStatus, status: nextStatus })
      .eq("id", orderId);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const snapshot = await loadCommerceSnapshot();
  const local = cloneLocalSnapshot(snapshot);
  local.orders = local.orders.map((order) =>
    order.id === orderId
      ? {
          ...order,
          fulfillmentStatus,
          status: nextStatus
        }
      : order
  );
  await writeLocalSnapshot(local);
}

export async function createShipmentRecord(orderId: string, partner: string, awb: string, trackingUrl: string, status = "created") {
  const shipment: CommerceShipment = {
    id: crypto.randomUUID(),
    orderId,
    partner: sanitizeText(partner),
    awb: sanitizeText(awb),
    status: sanitizeSlug(status).replace(/-/g, "_"),
    trackingUrl: trackingUrl.trim()
  };

  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("shipments").insert({
      id: shipment.id,
      order_id: shipment.orderId,
      partner: shipment.partner,
      awb: shipment.awb,
      status: shipment.status,
      tracking_url: shipment.trackingUrl
    });
    if (error) {
      throw new Error(error.message);
    }
    return shipment;
  }

  const snapshot = await loadCommerceSnapshot();
  const local = cloneLocalSnapshot(snapshot);
  local.shipments.unshift(shipment);
  await writeLocalSnapshot(local);
  return shipment;
}

export async function listOrdersForUser(userId: string) {
  const snapshot = await loadCommerceSnapshot();
  return snapshot.orders.filter((order) => order.userId === userId).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function getUserProfile(
  userId: string,
  fallback: {
    email: string;
    name?: string;
    phone?: string;
  }
) {
  const supabase = getSupabaseClient();
  const timestamp = new Date().toISOString();

  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: userId,
          email: fallback.email.trim().toLowerCase(),
          full_name: sanitizeText(fallback.name ?? ""),
          phone: sanitizeText(fallback.phone ?? ""),
          updated_at: timestamp
        },
        { onConflict: "id" }
      )
      .select("id, email, full_name, phone, created_at, updated_at")
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name ?? "",
      phone: data.phone ?? "",
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } satisfies CommerceProfile;
  }

  const state = await readLocalUserState();
  const existing = state.profiles.find((profile) => profile.id === userId);
  if (existing) {
    return existing;
  }

  const profile: CommerceProfile = {
    id: userId,
    email: fallback.email.trim().toLowerCase(),
    fullName: sanitizeText(fallback.name ?? ""),
    phone: sanitizeText(fallback.phone ?? ""),
    createdAt: timestamp,
    updatedAt: timestamp
  };
  state.profiles.unshift(profile);
  await writeLocalUserState(state);
  return profile;
}

export async function upsertUserProfile(input: {
  userId: string;
  email: string;
  fullName: string;
  phone: string;
}) {
  if (!validateEmail(input.email)) {
    throw new Error("Enter a valid email address.");
  }

  if (input.phone && !validateIndianMobile(input.phone)) {
    throw new Error("Enter a valid 10-digit Indian mobile number.");
  }

  const profile: CommerceProfile = {
    id: input.userId,
    email: normalizeEmail(input.email),
    fullName: sanitizeText(input.fullName),
    phone: normalizeIndianMobile(input.phone),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("profiles")
      .upsert(
        {
          id: profile.id,
          email: profile.email,
          full_name: profile.fullName,
          phone: profile.phone,
          updated_at: profile.updatedAt
        },
        { onConflict: "id" }
      )
      .select("id, email, full_name, phone, created_at, updated_at")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name ?? "",
      phone: data.phone ?? "",
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } satisfies CommerceProfile;
  }

  const state = await readLocalUserState();
  const existingIndex = state.profiles.findIndex((item) => item.id === profile.id);
  if (existingIndex >= 0) {
    profile.createdAt = state.profiles[existingIndex].createdAt;
    state.profiles[existingIndex] = profile;
  } else {
    state.profiles.unshift(profile);
  }
  await writeLocalUserState(state);
  return profile;
}

export async function listAddressesForUser(userId: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("addresses")
      .select("id, user_id, label, full_name, phone, line1, landmark, city, state, postal_code, country, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
    const addressRows = (data ?? []) as Array<{
      id: string;
      user_id: string;
      label?: string | null;
      full_name: string;
      phone: string;
      line1: string;
      landmark?: string | null;
      city: string;
      state: string;
      postal_code: string;
      country: string;
      created_at: string;
    }>;
    return addressRows.map(
      (item) =>
        ({
          id: item.id,
          userId: item.user_id,
          label: item.label ?? "",
          fullName: item.full_name,
          phone: item.phone,
          line1: item.line1,
          landmark: item.landmark ?? "",
          city: item.city,
          state: item.state,
          postalCode: item.postal_code,
          country: item.country,
          createdAt: item.created_at
        }) satisfies CommerceAddress
    );
  }

  const state = await readLocalUserState();
  return state.addresses.filter((address) => address.userId === userId).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function saveAddress(input: {
  id?: string;
  userId: string;
  label: string;
  fullName: string;
  phone: string;
  line1: string;
  landmark?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}) {
  if (!validateIndianMobile(input.phone)) {
    throw new Error("Enter a valid 10-digit Indian mobile number.");
  }

  if (!input.fullName.trim() || !input.line1.trim() || !input.city.trim() || !input.state.trim()) {
    throw new Error("Complete the address before saving.");
  }

  const shippingEstimate = estimateShippingForPostalCode(input.postalCode, 0);
  if (!shippingEstimate.valid || !shippingEstimate.serviceable) {
    throw new Error(shippingEstimate.message);
  }

  const address: CommerceAddress = {
    id: input.id || crypto.randomUUID(),
    userId: input.userId,
    label: sanitizeText(input.label),
    fullName: sanitizeText(input.fullName),
    phone: normalizeIndianMobile(input.phone),
    line1: sanitizeText(input.line1),
    landmark: sanitizeText(input.landmark ?? ""),
    city: sanitizeText(input.city),
    state: sanitizeText(input.state),
    postalCode: sanitizeText(input.postalCode),
    country: sanitizeText(input.country) || "India",
    createdAt: new Date().toISOString()
  };
  const supabase = getSupabaseClient();

  if (supabase) {
    const { data, error } = await supabase
      .from("addresses")
      .upsert(
        {
          id: address.id,
          user_id: address.userId,
          label: address.label || null,
          full_name: address.fullName,
          phone: address.phone,
          line1: address.line1,
          landmark: address.landmark || null,
          city: address.city,
          state: address.state,
          postal_code: address.postalCode,
          country: address.country
        },
        { onConflict: "id" }
      )
      .select("id, user_id, label, full_name, phone, line1, landmark, city, state, postal_code, country, created_at")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return {
      id: data.id,
      userId: data.user_id,
      label: data.label ?? "",
      fullName: data.full_name,
      phone: data.phone,
      line1: data.line1,
      landmark: data.landmark ?? "",
      city: data.city,
      state: data.state,
      postalCode: data.postal_code,
      country: data.country,
      createdAt: data.created_at
    } satisfies CommerceAddress;
  }

  const state = await readLocalUserState();
  const existingIndex = state.addresses.findIndex((item) => item.id === address.id && item.userId === address.userId);
  if (existingIndex >= 0) {
    address.createdAt = state.addresses[existingIndex].createdAt;
    state.addresses[existingIndex] = address;
  } else {
    state.addresses.unshift(address);
  }
  await writeLocalUserState(state);
  return address;
}

export async function deleteAddress(addressId: string, userId: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("addresses").delete().eq("id", addressId).eq("user_id", userId);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const state = await readLocalUserState();
  state.addresses = state.addresses.filter((address) => !(address.id === addressId && address.userId === userId));
  await writeLocalUserState(state);
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

export async function listCartItemsForUser(userId: string) {
  const snapshot = await loadCommerceSnapshot();
  const supabase = getSupabaseClient();
  if (supabase && snapshot.source === "supabase") {
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, user_id, product_id, quantity, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
    const cartRows = (data ?? []) as Array<{
      id: string;
      user_id: string;
      product_id: string;
      quantity: number;
      created_at: string;
      updated_at: string;
    }>;
    return cartRows.map(
      (item) =>
        ({
          id: item.id,
          userId: item.user_id,
          productId: item.product_id,
          quantity: item.quantity,
          createdAt: item.created_at,
          updatedAt: item.updated_at
        }) satisfies CommerceCartItem
    );
  }

  const state = await readLocalUserState();
  return state.cartItems.filter((item) => item.userId === userId).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
}

export async function setCartItemQuantity(userId: string, productId: string, quantity: number) {
  const normalizedQuantity = Math.max(0, Math.round(quantity));
  const timestamp = new Date().toISOString();
  const snapshot = await loadCommerceSnapshot();
  const supabase = getSupabaseClient();

  if (normalizedQuantity === 0) {
    await removeCartItem(userId, productId);
    return null;
  }

  const product =
    snapshot.products.find((item) => item.id === productId || item.slug === productId) ?? null;
  if (!product || !product.active) {
    throw new Error("This product is no longer available.");
  }

  if (product.stock <= 0) {
    throw new Error("This product is currently out of stock.");
  }

  if (normalizedQuantity > product.stock) {
    throw new Error(`Only ${product.stock} unit${product.stock === 1 ? "" : "s"} available right now.`);
  }

  if (supabase && snapshot.source === "supabase") {
    const resolvedId = product.id;

    if (!isUuid(resolvedId)) {
      throw new Error("The selected product could not be matched to the active store catalog.");
    }

    const { data, error } = await supabase
      .from("cart_items")
      .upsert(
        {
          user_id: userId,
          product_id: resolvedId,
          quantity: normalizedQuantity,
          updated_at: timestamp
        },
        { onConflict: "user_id,product_id" }
      )
      .select("id, user_id, product_id, quantity, created_at, updated_at")
      .single();
    if (error) {
      throw new Error(error.message);
    }
    return {
      id: data.id,
      userId: data.user_id,
      productId: data.product_id,
      quantity: data.quantity,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    } satisfies CommerceCartItem;
  }

  const state = await readLocalUserState();
  const existingIndex = state.cartItems.findIndex((item) => item.userId === userId && item.productId === productId);
  if (existingIndex >= 0) {
    state.cartItems[existingIndex] = {
      ...state.cartItems[existingIndex],
      quantity: normalizedQuantity,
      updatedAt: timestamp
    };
    await writeLocalUserState(state);
    return state.cartItems[existingIndex];
  }

  const item: CommerceCartItem = {
    id: crypto.randomUUID(),
    userId,
    productId,
    quantity: normalizedQuantity,
    createdAt: timestamp,
    updatedAt: timestamp
  };
  state.cartItems.unshift(item);
  await writeLocalUserState(state);
  return item;
}

export async function removeCartItem(userId: string, productId: string) {
  const snapshot = await loadCommerceSnapshot();
  const supabase = getSupabaseClient();
  if (supabase && snapshot.source === "supabase") {
    let resolvedId = productId;
    if (!isUuid(productId)) {
      const { data: prod } = await supabase.from("products").select("id").eq("slug", productId).maybeSingle();
      if (prod) {
        resolvedId = prod.id;
      }
    }
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", resolvedId);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const state = await readLocalUserState();
  state.cartItems = state.cartItems.filter((item) => !(item.userId === userId && item.productId === productId));
  await writeLocalUserState(state);
}

export async function clearCartForUser(userId: string) {
  const snapshot = await loadCommerceSnapshot();
  const supabase = getSupabaseClient();
  if (supabase && snapshot.source === "supabase") {
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId);
    if (error) {
      throw new Error(error.message);
    }
    return;
  }

  const state = await readLocalUserState();
  state.cartItems = state.cartItems.filter((item) => item.userId !== userId);
  await writeLocalUserState(state);
}

export async function getOrderDetailForUser(userId: string, orderId: string) {
  const snapshot = await loadCommerceSnapshot();
  const order = snapshot.orders.find((item) => item.id === orderId && item.userId === userId) ?? null;
  if (!order) {
    return null;
  }

  return {
    order,
    items: snapshot.orderItems.filter((item) => item.orderId === orderId),
    shipment: snapshot.shipments.find((item) => item.orderId === orderId) ?? null
  };
}

export function formatCurrency(amount: number, settings: CommerceSettings) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: settings.currencyCode,
    maximumFractionDigits: 0
  }).format(amount);
}

export function getProductCategoryName(product: CommerceProduct, categories: CommerceCategory[]) {
  return categories.find((category) => category.slug === product.categorySlug)?.name ?? "General";
}

export function getDiscountPercent(product: CommerceProduct) {
  if (product.salePrice >= product.basePrice) {
    return 0;
  }

  return Math.round(((product.basePrice - product.salePrice) / product.basePrice) * 100);
}

export function getCommerceOverview(snapshot: CommerceSnapshot) {
  const paidOrders = snapshot.orders.filter((order) => order.paymentStatus === "captured");
  const revenue = paidOrders.reduce((sum, order) => sum + order.total, 0);
  const totalOrders = snapshot.orders.length;
  const activeProducts = snapshot.products.filter((product) => product.stock > 0).length;
  const lowStockProducts = snapshot.products.filter((product) => product.stock > 0 && product.stock <= 12).length;
  const activeOffers = snapshot.offers.filter((offer) => offer.active).length;
  const activeCoupons = snapshot.coupons.filter((coupon) => coupon.active).length;
  const activeShipments = snapshot.shipments.filter((shipment) => shipment.status !== "delivered").length;

  return {
    revenue,
    totalOrders,
    activeProducts,
    lowStockProducts,
    activeOffers,
    activeCoupons,
    activeShipments
  };
}

export type CommerceCustomerSummary = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  createdAt: string;
};

export async function listCustomerProfiles(): Promise<CommerceCustomerSummary[]> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id, email, full_name, phone, created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  if (error) {
    return [];
  }

  const rows = (data ?? []) as Array<{
    id: string;
    email?: string | null;
    full_name?: string | null;
    phone?: string | null;
    created_at: string;
  }>;

  return rows.map((row) => ({
    id: row.id,
    email: row.email ?? "",
    fullName: row.full_name ?? "",
    phone: row.phone ?? "",
    createdAt: row.created_at
  }));
}
