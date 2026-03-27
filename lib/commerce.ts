import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { createClient } from "@supabase/supabase-js";

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
  active: boolean;
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
  total: number;
  couponCode?: string;
  shippingAddress?: {
    line1: string;
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
  active: boolean;
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
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };
  items: CheckoutItemInput[];
  couponCode?: string;
  paymentProvider: "Razorpay" | "PayPal";
};

const commerceDataFile = join(process.cwd(), "data", "commerce.json");
const commerceUserDataFile = join(process.cwd(), "data", "commerce-users.json");

type LocalUserState = {
  profiles: CommerceProfile[];
  addresses: CommerceAddress[];
  cartItems: CommerceCartItem[];
};

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    return null;
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
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
          .select("id, code, description, discount_type, discount_value, minimum_order_amount, active")
          .order("code"),
        supabase
          .from("orders")
          .select(
            "id, user_id, customer_name, customer_email, customer_phone, status, fulfillment_status, payment_provider, payment_status, subtotal, discount, shipping, total, coupon_code, shipping_address, created_at"
          )
          .order("created_at", { ascending: false })
          .limit(12),
        supabase
          .from("order_items")
          .select("id, order_id, product_id, product_name, sku, quantity, unit_price, total_price")
          .limit(100),
        supabase.from("shipments").select("id, order_id, partner, awb, status, tracking_url").order("id", { ascending: false }).limit(12),
        supabase.from("product_reviews").select("id, product_id, author, rating, comment, created_at").order("created_at", { ascending: false }).limit(250)
      ]);

    const results = [settingsResult, categoriesResult, productsResult, offersResult, couponsResult, ordersResult, orderItemsResult, shipmentsResult, productReviewsResult];
    const firstError = results.find((result) => result.error)?.error;

    if (firstError) {
      throw new Error(firstError.message);
    }

    const settings = settingsResult.data
      ? {
          currencyCode: settingsResult.data.currency_code,
          currencySymbol: settingsResult.data.currency_symbol,
          supportEmail: settingsResult.data.support_email,
          supportPhone: settingsResult.data.support_phone,
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

    return {
      settings,
      categories: (categoriesResult.data ?? []).map((item) => ({
        id: item.id,
        slug: item.slug,
        name: item.name,
        description: item.description ?? ""
      })),
      products: (productsResult.data ?? []).map((item) => ({
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
      offers: (offersResult.data ?? []).map((item) => ({
        id: item.id,
        title: item.title,
        description: item.description ?? "",
        kind: item.kind,
        discountType: item.discount_type,
        discountValue: item.discount_value,
        active: item.active
      })),
      coupons: (couponsResult.data ?? []).map((item) => ({
        id: item.id,
        code: item.code,
        description: item.description ?? "",
        discountType: item.discount_type,
        discountValue: item.discount_value,
        minimumOrderAmount: item.minimum_order_amount,
        active: item.active
      })),
      orders: (ordersResult.data ?? []).map((item) => ({
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
        shippingAddress: item.shipping_address
          ? {
              line1: item.shipping_address.line1 ?? "",
              city: item.shipping_address.city ?? "",
              state: item.shipping_address.state ?? "",
              postalCode: item.shipping_address.postalCode ?? item.shipping_address.postal_code ?? "",
              country: item.shipping_address.country ?? "India"
            }
          : undefined,
        createdAt: item.created_at
      })),
      orderItems: (orderItemsResult.data ?? []).map((item) => ({
        id: item.id,
        orderId: item.order_id,
        productId: item.product_id,
        productName: item.product_name,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unit_price,
        totalPrice: item.total_price
      })),
      shipments: (shipmentsResult.data ?? []).map((item) => ({
        id: item.id,
        orderId: item.order_id,
        partner: item.partner,
        awb: item.awb,
        status: item.status,
        trackingUrl: item.tracking_url
      })),
      productReviews: (productReviewsResult.data ?? []).map((item) => ({
        id: item.id,
        productId: item.product_id,
        author: item.author,
        rating: item.rating,
        comment: item.comment,
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

function getShippingCharge(subtotal: number) {
  return subtotal >= 1499 ? 0 : 120;
}

export async function upsertProduct(input: ProductInput) {
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

  const snapshot = await loadCommerceSnapshot();
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
}) {
  const review: CommerceProductReview = {
    id: crypto.randomUUID(),
    productId: input.productId,
    author: sanitizeText(input.author),
    rating: Math.max(1, Math.min(5, Math.round(input.rating))),
    comment: sanitizeText(input.comment),
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
      created_at: review.createdAt
    });
    if (error) {
      throw new Error(error.message);
    }
    return review;
  }

  const snapshot = await loadCommerceSnapshot();
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
  const payload = {
    id: input.id || crypto.randomUUID(),
    title: sanitizeText(input.title),
    description: input.description.trim(),
    kind: sanitizeSlug(input.kind),
    discountType: input.discountType,
    discountValue: sanitizeCurrency(input.discountValue),
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
  const payload = {
    id: input.id || crypto.randomUUID(),
    code: sanitizeText(input.code).toUpperCase(),
    description: input.description.trim(),
    discountType: input.discountType,
    discountValue: sanitizeCurrency(input.discountValue),
    minimumOrderAmount: sanitizeCurrency(input.minimumOrderAmount),
    active: Boolean(input.active)
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
      active: payload.active
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
  const matchedItems = input.items
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

  if (!matchedItems.length) {
    throw new Error("No valid order items were provided.");
  }

  const subtotal = matchedItems.reduce((sum, item) => sum + item.product.salePrice * item.quantity, 0);
  const normalizedCouponCode = input.couponCode?.trim().toUpperCase() ?? "";
  const coupon = input.couponCode
    ? snapshot.coupons.find((item) => item.active && item.code === normalizedCouponCode)
    : null;
  const discount =
    coupon && subtotal >= coupon.minimumOrderAmount
      ? coupon.discountType === "percent"
        ? Math.round((subtotal * coupon.discountValue) / 100)
        : coupon.discountValue
      : 0;
  const shipping = getShippingCharge(subtotal - discount);
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
    total,
    couponCode: coupon?.code ?? undefined,
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
    const { error: orderError } = await supabase.from("orders").insert({
      id: order.id,
      user_id: order.userId ?? null,
      customer_name: order.customerName,
      customer_email: order.customerEmail,
      customer_phone: input.customerPhone.trim(),
      status: order.status,
      fulfillment_status: order.fulfillmentStatus,
      payment_provider: order.paymentProvider,
      payment_status: order.paymentStatus,
      subtotal: order.subtotal,
      discount: order.discount,
      shipping: order.shipping,
      total: order.total,
      coupon_code: coupon?.code ?? null,
      shipping_address: input.shippingAddress
    });
    if (orderError) {
      throw new Error(orderError.message);
    }

    const { error: itemsError } = await supabase.from("order_items").insert(
      orderItems.map((item) => ({
        id: item.id,
        order_id: item.orderId,
        product_id: item.productId,
        product_name: item.productName,
        sku: item.sku,
        quantity: item.quantity,
        unit_price: item.unitPrice,
        total_price: item.totalPrice
      }))
    );
    if (itemsError) {
      throw new Error(itemsError.message);
    }

    return { order, orderItems, coupon };
  }

  const local = cloneLocalSnapshot(snapshot);
  local.orders.unshift(order);
  local.orderItems.unshift(...orderItems);
  local.products = local.products.map((product) => {
    const selected = matchedItems.find((item) => item.product.id === product.id);
    if (!selected) {
      return product;
    }
    return {
      ...product,
      stock: Math.max(0, product.stock - selected.quantity)
    };
  });
  await writeLocalSnapshot(local);
  return { order, orderItems, coupon };
}

export async function updateOrderPaymentStatus(orderId: string, paymentStatus: string, status: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase
      .from("orders")
      .update({
        payment_status: paymentStatus,
        status
      })
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
          paymentStatus,
          status
        }
      : order
  );
  await writeLocalSnapshot(local);
}

export async function updateOrderFulfillment(orderId: string, fulfillmentStatus: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("orders").update({ fulfillment_status: fulfillmentStatus }).eq("id", orderId);
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
          fulfillmentStatus
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
  const profile: CommerceProfile = {
    id: input.userId,
    email: input.email.trim().toLowerCase(),
    fullName: sanitizeText(input.fullName),
    phone: sanitizeText(input.phone),
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
      .select("id, user_id, label, full_name, phone, line1, city, state, postal_code, country, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map(
      (item) =>
        ({
          id: item.id,
          userId: item.user_id,
          label: item.label ?? "",
          fullName: item.full_name,
          phone: item.phone,
          line1: item.line1,
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
  city: string;
  state: string;
  postalCode: string;
  country: string;
}) {
  const address: CommerceAddress = {
    id: input.id || crypto.randomUUID(),
    userId: input.userId,
    label: sanitizeText(input.label),
    fullName: sanitizeText(input.fullName),
    phone: sanitizeText(input.phone),
    line1: sanitizeText(input.line1),
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
          city: address.city,
          state: address.state,
          postal_code: address.postalCode,
          country: address.country
        },
        { onConflict: "id" }
      )
      .select("id, user_id, label, full_name, phone, line1, city, state, postal_code, country, created_at")
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

export async function listCartItemsForUser(userId: string) {
  const supabase = getSupabaseClient();
  if (supabase) {
    const { data, error } = await supabase
      .from("cart_items")
      .select("id, user_id, product_id, quantity, created_at, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });
    if (error) {
      throw new Error(error.message);
    }
    return (data ?? []).map(
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
  const supabase = getSupabaseClient();

  if (normalizedQuantity === 0) {
    await removeCartItem(userId, productId);
    return null;
  }

  if (supabase) {
    const { data, error } = await supabase
      .from("cart_items")
      .upsert(
        {
          user_id: userId,
          product_id: productId,
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
  const supabase = getSupabaseClient();
  if (supabase) {
    const { error } = await supabase.from("cart_items").delete().eq("user_id", userId).eq("product_id", productId);
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
  const supabase = getSupabaseClient();
  if (supabase) {
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
  const activeProducts = snapshot.products.filter((product) => product.stock > 0).length;
  const lowStockProducts = snapshot.products.filter((product) => product.stock > 0 && product.stock <= 12).length;
  const activeOffers = snapshot.offers.filter((offer) => offer.active).length;
  const activeCoupons = snapshot.coupons.filter((coupon) => coupon.active).length;
  const activeShipments = snapshot.shipments.filter((shipment) => shipment.status !== "delivered").length;

  return {
    revenue,
    activeProducts,
    lowStockProducts,
    activeOffers,
    activeCoupons,
    activeShipments
  };
}
