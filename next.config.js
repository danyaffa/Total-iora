// FILE: /next.config.js  (kill stale caches that show “old pages”)
const noStore =
  "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";

// ✅ Set to "true" only when building for Capacitor (Android/iOS)
// Linux/mac:
//   CAPACITOR_EXPORT=1 npm run build
const isCapacitor = process.env.CAPACITOR_EXPORT === "1";

module.exports = {
  reactStrictMode: true,

  // ✅ Capacitor / static export mode (only when CAPACITOR_EXPORT=1)
  ...(isCapacitor
    ? {
        output: "export",
        images: { unoptimized: true },
        trailingSlash: true,
      }
    : {}),

  // ✅ Your cache-kill headers
  headers: async () => [
    {
      source: "/api/:path*",
      headers: [{ key: "Cache-Control", value: "no-store" }],
    },
    { source: "/oracle", headers: [{ key: "Cache-Control", value: noStore }] },
    { source: "/", headers: [{ key: "Cache-Control", value: noStore }] },
  ],
};
