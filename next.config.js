// FILE: /next.config.js
// Security headers + stale-cache control.
//
// NOTE: Baseline security headers are also applied in middleware.ts for
// responses the middleware touches. We also set them here so they apply
// to every Next.js response (including static assets that middleware
// doesn't run on).

const noStore =
  "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";

// ✅ Set to "true" only when building for Capacitor (Android/iOS)
const isCapacitor = process.env.CAPACITOR_EXPORT === "1";

const SECURITY_HEADERS = [
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "X-XSS-Protection", value: "1; mode=block" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(self), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

// Validate env vars at build/startup (logs a compact report; never leaks
// values). We only require the presence of critical vars in production.
try {
  require("./lib/env");
} catch (err) {
  // Surface the failure loudly but don't block the dev build.
  // eslint-disable-next-line no-console
  console.error("[next.config] env validation error:", err?.message || err);
}

module.exports = {
  reactStrictMode: true,
  poweredByHeader: false,

  // ✅ Capacitor / static export mode (only when CAPACITOR_EXPORT=1)
  ...(isCapacitor
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),

  headers: async () => [
    // Global security headers on every path
    {
      source: "/(.*)",
      headers: SECURITY_HEADERS,
    },
    // Cache-kill headers for API + hot routes
    {
      source: "/api/:path*",
      headers: [
        { key: "Cache-Control", value: "no-store" },
        ...SECURITY_HEADERS,
      ],
    },
    {
      source: "/oracle",
      headers: [
        { key: "Cache-Control", value: noStore },
        ...SECURITY_HEADERS,
      ],
    },
    {
      source: "/",
      headers: [
        { key: "Cache-Control", value: noStore },
        ...SECURITY_HEADERS,
      ],
    },
  ],
};
