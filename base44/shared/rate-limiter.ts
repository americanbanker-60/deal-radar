/**
 * Simple in-memory rate limiter for Deno serverless functions.
 * Tracks requests per user (by email) within a sliding window.
 *
 * Note: This is per-isolate, so it resets when the function cold-starts.
 * For production, consider using a shared store (Redis, KV, etc.).
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

const rateLimitStore = new Map<string, RateLimitEntry>();

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX_REQUESTS = 30;  // 30 requests per minute

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  keyPrefix?: string;
}

export function checkRateLimit(
  userEmail: string,
  options: RateLimitOptions = {}
): { allowed: boolean; retryAfterMs: number; remaining: number } {
  const {
    windowMs = DEFAULT_WINDOW_MS,
    maxRequests = DEFAULT_MAX_REQUESTS,
    keyPrefix = 'default',
  } = options;

  const key = `${keyPrefix}:${userEmail}`;
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Reset window if expired
  if (!entry || now - entry.windowStart >= windowMs) {
    entry = { count: 0, windowStart: now };
    rateLimitStore.set(key, entry);
  }

  entry.count++;

  if (entry.count > maxRequests) {
    const retryAfterMs = windowMs - (now - entry.windowStart);
    return { allowed: false, retryAfterMs, remaining: 0 };
  }

  return { allowed: true, retryAfterMs: 0, remaining: maxRequests - entry.count };
}

/**
 * Helper to return a 429 response when rate limit is exceeded
 */
export function rateLimitResponse(retryAfterMs: number): Response {
  return Response.json(
    { error: 'Rate limit exceeded. Please try again later.' },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
      },
    }
  );
}

// Periodic cleanup of expired entries (every 5 minutes)
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now - entry.windowStart >= 300_000) { // 5 min stale threshold
      rateLimitStore.delete(key);
    }
  }
}, 300_000);
