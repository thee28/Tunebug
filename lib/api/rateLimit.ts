// In-memory fixed-window rate limiter. Per-instance only — good enough as a
// baseline brute-force/abuse guard for a single-node deployment. Swap for a
// shared store (Redis/Upstash) if the app is ever scaled horizontally.

interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();
const MAX_BUCKETS = 10_000;

function prune(now: number) {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key);
  }
}

/** Returns true if the request is allowed, false if the limit is exceeded. */
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  prune(now);
  const bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= limit) return false;
  bucket.count += 1;
  return true;
}

// Number of trusted reverse proxies in front of the app (e.g. 1 on Vercel).
// X-Forwarded-For is a list the client can prepend spoofed entries to; only the
// entries appended by our own proxies are trustworthy. Reading the Nth value
// from the right skips the client-controlled prefix. Default 1 = single proxy.
const TRUSTED_PROXY_HOPS = Math.max(
  1,
  Number(process.env.TRUSTED_PROXY_HOPS ?? "1") || 1
);

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const ips = forwarded
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    if (ips.length) {
      // Take the address the outermost trusted proxy actually observed, not the
      // leftmost (spoofable, client-supplied) entry.
      const idx = Math.max(0, ips.length - TRUSTED_PROXY_HOPS);
      return ips[idx];
    }
  }
  return request.headers.get("x-real-ip") ?? "unknown";
}

export function tooManyRequests(message = "Too many requests. Try again later.") {
  return Response.json({ error: message }, { status: 429 });
}
