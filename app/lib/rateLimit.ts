// In-memory rate limiter — sliding window per IP
// Vercel Edge/Serverless: state reset tiap cold start, cukup untuk abuse prevention

interface RateLimitEntry {
  count: number;
  resetAt: number;
  blocked: boolean;
  blockedUntil: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
let lastCleanup = Date.now();
function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt && now > entry.blockedUntil) store.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds
  blocked: boolean;
}

export function rateLimit(
  ip: string,
  opts: { limit?: number; windowMs?: number; blockDurationMs?: number } = {}
): RateLimitResult {
  cleanup();

  const { limit = 20, windowMs = 60_000, blockDurationMs = 10 * 60_000 } = opts;
  const now = Date.now();

  let entry = store.get(ip);

  // Permanently blocked?
  if (entry?.blocked && now < entry.blockedUntil) {
    return { allowed: false, remaining: 0, resetIn: Math.ceil((entry.blockedUntil - now) / 1000), blocked: true };
  }

  // New window
  if (!entry || now > entry.resetAt) {
    entry = { count: 1, resetAt: now + windowMs, blocked: false, blockedUntil: 0 };
    store.set(ip, entry);
    return { allowed: true, remaining: limit - 1, resetIn: Math.ceil(windowMs / 1000), blocked: false };
  }

  entry.count++;

  // Over limit → block
  if (entry.count > limit) {
    entry.blocked = true;
    entry.blockedUntil = now + blockDurationMs;
    store.set(ip, entry);
    return { allowed: false, remaining: 0, resetIn: Math.ceil(blockDurationMs / 1000), blocked: true };
  }

  store.set(ip, entry);
  return { allowed: true, remaining: limit - entry.count, resetIn: Math.ceil((entry.resetAt - now) / 1000), blocked: false };
}

// Stricter limiter for suspicious patterns
export function strictRateLimit(ip: string): RateLimitResult {
  return rateLimit(ip, { limit: 5, windowMs: 60_000, blockDurationMs: 30 * 60_000 });
}
