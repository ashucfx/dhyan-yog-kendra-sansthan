type RateLimitWindow = {
  count: number;
  resetAt: number;
};

const store = new Map<string, RateLimitWindow>();

function getClientKey(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const realIp = request.headers.get("x-real-ip")?.trim();
  return forwardedFor || realIp || "local";
}

export function assertRateLimit(request: Request, options: { key: string; limit: number; windowMs: number }) {
  const now = Date.now();
  const bucketKey = `${options.key}:${getClientKey(request)}`;
  const existing = store.get(bucketKey);

  if (!existing || existing.resetAt <= now) {
    store.set(bucketKey, {
      count: 1,
      resetAt: now + options.windowMs
    });
    return;
  }

  if (existing.count >= options.limit) {
    throw new Error("Too many requests. Please wait a moment and try again.");
  }

  existing.count += 1;
  store.set(bucketKey, existing);
}
