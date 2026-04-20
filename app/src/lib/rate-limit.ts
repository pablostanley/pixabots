/**
 * In-memory best-effort rate limiter. Lives in module scope per lambda
 * instance — leaks across cold starts and separate instances. Not a
 * substitute for Redis/KV, but prevents a single runaway client from
 * hammering a warm instance with expensive animated / OG renders.
 */

type Bucket = { count: number; reset: number };

const buckets = new Map<string, Bucket>();

const MAX_ENTRIES = 5_000; // hard cap; oldest swept when exceeded

function sweep(now: number) {
  // Drop expired entries. If still over cap, drop oldest-reset entries.
  for (const [key, b] of buckets) {
    if (b.reset <= now) buckets.delete(key);
  }
  if (buckets.size > MAX_ENTRIES) {
    const toDrop = buckets.size - MAX_ENTRIES;
    // Map iteration order is insertion order; we only get oldest inserts,
    // which correlates loosely with reset time but is cheap and good enough.
    let i = 0;
    for (const key of buckets.keys()) {
      if (i++ >= toDrop) break;
      buckets.delete(key);
    }
  }
}

export type RateCheck = {
  allowed: boolean;
  remaining: number;
  resetSeconds: number;
  limit: number;
};

export function checkRate(
  key: string,
  limit: number,
  windowMs: number
): RateCheck {
  const now = Date.now();
  if (buckets.size > MAX_ENTRIES * 1.5) sweep(now);
  const entry = buckets.get(key);
  if (!entry || now >= entry.reset) {
    const next: Bucket = { count: 1, reset: now + windowMs };
    buckets.set(key, next);
    return {
      allowed: true,
      remaining: limit - 1,
      resetSeconds: Math.ceil(windowMs / 1000),
      limit,
    };
  }
  const remaining = Math.max(0, limit - entry.count);
  const resetSeconds = Math.max(1, Math.ceil((entry.reset - now) / 1000));
  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetSeconds, limit };
  }
  entry.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, limit - entry.count),
    resetSeconds,
    limit,
  };
}

export function clientKey(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}

/**
 * True when the request came from our own pages (the browse grid, the bot
 * detail page, etc.). Used to exempt UI traffic from the animated-render
 * rate limit — /browse alone renders ~60 GIFs on first paint, which would
 * blow past any sane per-IP cap. Sec-Fetch-Site is modern-browser-native
 * (Chrome / Firefox / Safari) and cannot be forged by script from another
 * origin, so it's a reasonable guard for "this is our UI, not abuse."
 * External consumers (curl, servers, other sites hotlinking) get
 * `cross-site` or no header → still rate-limited.
 */
export function isSameOrigin(request: Request): boolean {
  return request.headers.get("sec-fetch-site") === "same-origin";
}
