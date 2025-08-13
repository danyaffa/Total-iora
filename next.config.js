// FILE: /next.config.js  (kill stale caches that show “old pages”)
const noStore = "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0";
module.exports = {
  reactStrictMode: true,
  headers: async () => ([
    { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    { source: "/oracle",     headers: [{ key: "Cache-Control", value: noStore }] },
    { source: "/",           headers: [{ key: "Cache-Control", value: noStore }] },
  ]),
};
