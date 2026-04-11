// FILE: /lib/rateLimit.js
// In-memory sliding-window rate limiter keyed by (route + identifier).
// For a single-instance deployment this is sufficient; for multi-instance
// production traffic, swap the _store for Redis or Upstash.

const _store = new Map(); // key -> [timestamps...]

const DEFAULT_WINDOW_MS = 60_000; // 1 minute
const DEFAULT_MAX = 60; // 60 requests per minute per identifier

/**
 * Extract a stable identifier from the request. Prefers session cookie, then
 * the x-forwarded-for header, then the remote address. Trims to first entry.
 */
export function identifyRequest(req) {
  const session = req?.cookies?.ac_session || "";
  if (session) return `sess:${session}`;
  const xf =
    req?.headers?.["x-forwarded-for"] ||
    req?.headers?.["x-real-ip"] ||
    "";
  const first = String(Array.isArray(xf) ? xf[0] : xf)
    .split(",")[0]
    .trim();
  if (first) return `ip:${first}`;
  return `ip:${req?.socket?.remoteAddress || "unknown"}`;
}

/**
 * Check + record a hit. Returns { ok, remaining, resetMs }. Does not throw.
 */
export function checkRateLimit(key, { windowMs = DEFAULT_WINDOW_MS, max = DEFAULT_MAX } = {}) {
  const now = Date.now();
  const cutoff = now - windowMs;

  let arr = _store.get(key);
  if (!arr) {
    arr = [];
    _store.set(key, arr);
  }
  // Drop expired entries (sliding window)
  while (arr.length && arr[0] < cutoff) arr.shift();

  if (arr.length >= max) {
    const resetMs = Math.max(0, arr[0] + windowMs - now);
    return { ok: false, remaining: 0, resetMs };
  }

  arr.push(now);
  return { ok: true, remaining: max - arr.length, resetMs: windowMs };
}

/** Opportunistic cleanup to keep the map bounded. */
function sweep() {
  const now = Date.now();
  const cutoff = now - DEFAULT_WINDOW_MS * 4;
  for (const [k, arr] of _store.entries()) {
    while (arr.length && arr[0] < cutoff) arr.shift();
    if (!arr.length) _store.delete(k);
  }
}
setInterval(sweep, 60_000).unref?.();

/**
 * Convenience wrapper that reads the route + request and enforces. Returns
 * the same shape as checkRateLimit.
 */
export function enforceRateLimit(req, routeKey, opts) {
  const ident = identifyRequest(req);
  return checkRateLimit(`${routeKey}|${ident}`, opts);
}
