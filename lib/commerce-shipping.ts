import { estimateShippingForPostalCode, type ShippingEstimate } from "@/lib/commerce-pricing";

// ── Public types ──────────────────────────────────────────────────────────────

export type CommerceShippingEstimate = ShippingEstimate & {
  provider: "shadowfax" | "standard";
  live: boolean;
};

export type CommerceShipmentResult = {
  success: boolean;
  awb?: string;
  trackingUrl?: string;
  labelUrl?: string;
  pickupScheduledAt?: string;
  message: string;
  provider: "shadowfax";
};

export type CommerceTrackingEvent = {
  status: string;
  location?: string;
  timestamp: string;
  description?: string;
};

export type CommerceTrackingResult = {
  awb: string;
  status: string;
  statusLabel: string;
  location?: string;
  updatedAt?: string;
  events: CommerceTrackingEvent[];
  provider: "shadowfax";
};

// ── Input types ───────────────────────────────────────────────────────────────

type ShadowfaxQuoteInput = {
  postalCode: string;
  subtotal: number;
  itemCount?: number;
};

type ShadowfaxShipmentInput = {
  orderId: string;
  customerName: string;
  customerPhone: string;
  postalCode: string;
  city: string;
  state: string;
  addressLine1: string;
  declaredValue: number;
  itemCount?: number;
};

// ── Env helpers ───────────────────────────────────────────────────────────────

function getShadowfaxQuoteUrl() {
  return process.env.SHADOWFAX_QUOTE_URL?.trim() ?? "";
}

function getShadowfaxOrderUrl() {
  return process.env.SHADOWFAX_ORDER_URL?.trim() ?? "";
}

function getShadowfaxTrackUrl() {
  return process.env.SHADOWFAX_TRACK_URL?.trim() ?? "";
}

export function isShadowfaxQuoteConfigured() {
  return Boolean(getShadowfaxQuoteUrl());
}

export function isShadowfaxOrderConfigured() {
  return Boolean(getShadowfaxOrderUrl());
}

export function isShadowfaxTrackConfigured() {
  return Boolean(getShadowfaxTrackUrl());
}

// ── Shared Shadowfax utilities ────────────────────────────────────────────────

function buildShadowfaxHeaders(): Record<string, string> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  const bearerToken = process.env.SHADOWFAX_API_TOKEN?.trim();
  const apiKey = process.env.SHADOWFAX_API_KEY?.trim();
  const apiSecret = process.env.SHADOWFAX_API_SECRET?.trim();
  if (bearerToken) headers.Authorization = `Bearer ${bearerToken}`;
  if (apiKey) headers["x-api-key"] = apiKey;
  if (apiSecret) headers["x-api-secret"] = apiSecret;
  return headers;
}

function buildShadowfaxPackage() {
  return {
    weightKg: Number(process.env.SHADOWFAX_DEFAULT_WEIGHT_KG ?? "0.5"),
    lengthCm: Number(process.env.SHADOWFAX_DEFAULT_LENGTH_CM ?? "20"),
    breadthCm: Number(process.env.SHADOWFAX_DEFAULT_BREADTH_CM ?? "15"),
    heightCm: Number(process.env.SHADOWFAX_DEFAULT_HEIGHT_CM ?? "10")
  };
}

// ── Response normalisation helpers ────────────────────────────────────────────

function pickNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function pickString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function normalizeEtaLabel(value: unknown) {
  const direct = pickString(value);
  if (direct) return direct;
  const numeric = pickNumber(value);
  if (numeric !== null) return `${numeric} day${numeric === 1 ? "" : "s"}`;
  return undefined;
}

function readNestedRecord(value: unknown) {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : null;
}

// ── Shadowfax: shipping quote ─────────────────────────────────────────────────

async function requestShadowfaxQuote(input: ShadowfaxQuoteInput): Promise<CommerceShippingEstimate> {
  const quoteUrl = getShadowfaxQuoteUrl();
  if (!quoteUrl) throw new Error("Shadowfax quote endpoint is not configured.");

  const response = await fetch(quoteUrl, {
    method: "POST",
    headers: buildShadowfaxHeaders(),
    body: JSON.stringify({
      sourcePincode: process.env.SHADOWFAX_PICKUP_POSTAL_CODE?.trim() ?? "",
      destinationPincode: input.postalCode,
      paymentMode: "prepaid",
      declaredValue: Math.max(0, Math.round(input.subtotal)),
      quantity: Math.max(1, Math.round(input.itemCount ?? 1)),
      package: buildShadowfaxPackage(),
      currency: "INR"
    }),
    signal: AbortSignal.timeout(8000)
  });

  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const data = readNestedRecord(result.data);
  const quote = readNestedRecord(result.quote);
  const serviceability = readNestedRecord(result.serviceability);

  if (!response.ok) {
    throw new Error(
      pickString(result.message) ??
        pickString(data?.message) ??
        `Shadowfax quote request failed with status ${response.status}.`
    );
  }

  const serviceableCandidates = [
    result.serviceable, result.is_serviceable, result.available,
    data?.serviceable, data?.is_serviceable,
    quote?.serviceable, serviceability?.serviceable
  ];
  const serviceable = serviceableCandidates.find((v) => typeof v === "boolean") ?? true;

  const shippingCharge =
    pickNumber(result.shippingCharge) ?? pickNumber(result.shipping_charge) ??
    pickNumber(result.rate) ?? pickNumber(result.amount) ??
    pickNumber(data?.shippingCharge) ?? pickNumber(data?.shipping_charge) ??
    pickNumber(data?.rate) ?? pickNumber(data?.amount) ??
    pickNumber(quote?.shippingCharge) ?? pickNumber(quote?.shipping_charge) ??
    pickNumber(quote?.rate) ?? pickNumber(quote?.amount);

  if (!serviceable) {
    return {
      valid: true, serviceable: false,
      postalCode: input.postalCode, shippingCharge: 0,
      message: pickString(result.message) ?? pickString(data?.message) ?? "Delivery is not available for this pincode right now.",
      provider: "shadowfax", live: true
    };
  }

  if (shippingCharge === null) {
    throw new Error("Shadowfax quote response did not include a shipping charge.");
  }

  return {
    valid: true, serviceable: true,
    postalCode: input.postalCode,
    shippingCharge: Math.max(0, Math.round(shippingCharge)),
    etaLabel:
      normalizeEtaLabel(result.etaLabel) ?? normalizeEtaLabel(result.eta) ??
      normalizeEtaLabel(result.delivery_eta) ??
      normalizeEtaLabel(data?.etaLabel) ?? normalizeEtaLabel(data?.eta) ??
      normalizeEtaLabel(data?.delivery_eta) ??
      normalizeEtaLabel(quote?.etaLabel) ?? normalizeEtaLabel(quote?.eta),
    message: pickString(result.message) ?? pickString(data?.message) ?? `Live delivery quote available for ${input.postalCode}.`,
    provider: "shadowfax", live: true
  };
}

export async function getCommerceShippingEstimate(input: ShadowfaxQuoteInput): Promise<CommerceShippingEstimate> {
  const fallbackEstimate = estimateShippingForPostalCode(input.postalCode, input.subtotal);

  if (!fallbackEstimate.valid || !fallbackEstimate.serviceable) {
    return { ...fallbackEstimate, provider: "standard", live: false };
  }

  if (!isShadowfaxQuoteConfigured()) {
    return { ...fallbackEstimate, provider: "standard", live: false };
  }

  try {
    return await requestShadowfaxQuote(input);
  } catch (error) {
    return {
      valid: false, serviceable: false,
      postalCode: input.postalCode.trim(), shippingCharge: 0,
      message: error instanceof Error ? error.message : "Live shipping quotes are temporarily unavailable.",
      provider: "shadowfax", live: true
    };
  }
}

// ── Shadowfax: shipment creation (post-payment dispatch) ──────────────────────

export async function createShadowfaxShipment(input: ShadowfaxShipmentInput): Promise<CommerceShipmentResult> {
  const orderUrl = getShadowfaxOrderUrl();
  if (!orderUrl) throw new Error("Shadowfax order endpoint is not configured.");

  const response = await fetch(orderUrl, {
    method: "POST",
    headers: buildShadowfaxHeaders(),
    body: JSON.stringify({
      clientOrderId: input.orderId,
      sourcePincode: process.env.SHADOWFAX_PICKUP_POSTAL_CODE?.trim() ?? "",
      destinationPincode: input.postalCode,
      destinationCity: input.city,
      destinationState: input.state,
      destinationAddress: input.addressLine1,
      customerName: input.customerName,
      customerPhone: input.customerPhone,
      paymentMode: "prepaid",
      declaredValue: Math.max(0, Math.round(input.declaredValue)),
      quantity: Math.max(1, Math.round(input.itemCount ?? 1)),
      package: buildShadowfaxPackage(),
      currency: "INR"
    }),
    signal: AbortSignal.timeout(10000)
  });

  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const data = readNestedRecord(result.data);

  if (!response.ok) {
    throw new Error(
      pickString(result.message) ?? pickString(data?.message) ??
        `Shadowfax order creation failed with status ${response.status}.`
    );
  }

  const awb =
    pickString(result.awb) ?? pickString(result.trackingNumber) ?? pickString(result.tracking_number) ??
    pickString(data?.awb) ?? pickString(data?.trackingNumber) ?? pickString(data?.tracking_number);

  const trackingUrl =
    pickString(result.trackingUrl) ?? pickString(result.tracking_url) ??
    pickString(data?.trackingUrl) ?? pickString(data?.tracking_url);

  const labelUrl =
    pickString(result.labelUrl) ?? pickString(result.label_url) ??
    pickString(data?.labelUrl) ?? pickString(data?.label_url);

  const pickupScheduledAt =
    pickString(result.pickupScheduledAt) ?? pickString(result.pickup_scheduled_at) ??
    pickString(data?.pickupScheduledAt) ?? pickString(data?.pickup_scheduled_at);

  return {
    success: true,
    awb: awb ?? undefined,
    trackingUrl: trackingUrl ?? undefined,
    labelUrl: labelUrl ?? undefined,
    pickupScheduledAt: pickupScheduledAt ?? undefined,
    message: pickString(result.message) ?? "Shipment created successfully.",
    provider: "shadowfax"
  };
}

// ── Shadowfax: tracking status ────────────────────────────────────────────────

export async function getShadowfaxTrackingStatus(awb: string): Promise<CommerceTrackingResult> {
  const trackUrl = getShadowfaxTrackUrl();
  if (!trackUrl) throw new Error("Shadowfax tracking endpoint is not configured.");

  const url = `${trackUrl}/${encodeURIComponent(awb)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: buildShadowfaxHeaders(),
    signal: AbortSignal.timeout(8000)
  });

  const result = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  const data = readNestedRecord(result.data);

  if (!response.ok) {
    throw new Error(
      pickString(result.message) ?? pickString(data?.message) ??
        `Shadowfax tracking failed with status ${response.status}.`
    );
  }

  const status = pickString(result.status) ?? pickString(data?.status) ?? "unknown";

  const statusLabel =
    pickString(result.statusLabel) ?? pickString(result.status_label) ??
    pickString(data?.statusLabel) ?? pickString(data?.status_label) ?? status;

  const location = pickString(result.location) ?? pickString(data?.location);
  const updatedAt =
    pickString(result.updatedAt) ?? pickString(result.updated_at) ??
    pickString(data?.updatedAt) ?? pickString(data?.updated_at);

  const rawEvents =
    Array.isArray(result.events) ? result.events :
    Array.isArray(data?.events) ? (data.events as unknown[]) : [];

  const events: CommerceTrackingEvent[] = rawEvents
    .filter((e): e is Record<string, unknown> => e !== null && typeof e === "object")
    .map((e) => ({
      status: pickString(e.status) ?? "unknown",
      location: pickString(e.location),
      timestamp: pickString(e.timestamp) ?? pickString(e.time) ?? new Date().toISOString(),
      description: pickString(e.description) ?? pickString(e.message)
    }));

  return { awb, status, statusLabel, location, updatedAt, events, provider: "shadowfax" };
}
