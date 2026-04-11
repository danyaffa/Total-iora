// FILE: /pages/sitemap.xml.js
// Dynamic sitemap.xml. Lists the pages we want crawlers to find.

export async function getServerSideProps({ req, res }) {
  const originHeader =
    req.headers["x-forwarded-proto"] && req.headers["x-forwarded-host"]
      ? `${req.headers["x-forwarded-proto"]}://${req.headers["x-forwarded-host"]}`
      : `https://${req.headers.host}`;

  const BASE_URL = (process.env.NEXT_PUBLIC_SITE_URL || originHeader).replace(
    /\/$/,
    ""
  );

  // Canonical route set (keep in sync with /public/robots.txt).
  const routes = [
    { path: "/", priority: "1.0", changefreq: "daily" },
    { path: "/homepage", priority: "1.0", changefreq: "daily" },
    { path: "/get-your-aura", priority: "0.9", changefreq: "weekly" },
    { path: "/sacred-space", priority: "0.8", changefreq: "weekly" },
    { path: "/oracle-universe-dna", priority: "0.9", changefreq: "weekly" },
    { path: "/wall", priority: "0.6", changefreq: "weekly" },
    { path: "/unlock", priority: "0.7", changefreq: "weekly" },
    { path: "/dashboard", priority: "0.5", changefreq: "monthly" },
    { path: "/login", priority: "0.4", changefreq: "monthly" },
    { path: "/register", priority: "0.7", changefreq: "monthly" },
    { path: "/privacy", priority: "0.3", changefreq: "yearly" },
    { path: "/terms", priority: "0.3", changefreq: "yearly" },
    { path: "/legal", priority: "0.3", changefreq: "yearly" },
    { path: "/subjects", priority: "0.6", changefreq: "weekly" },
    { path: "/site-map", priority: "0.4", changefreq: "monthly" },
    { path: "/contact", priority: "0.4", changefreq: "yearly" },
    { path: "/app-store", priority: "0.6", changefreq: "monthly" },
    { path: "/seo/total-iora", priority: "0.8", changefreq: "weekly" },
  ];

  const lastmod = new Date().toISOString().split("T")[0];

  const body = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${routes
  .map(
    (r) => `  <url>
    <loc>${BASE_URL}${r.path}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>${r.changefreq}</changefreq>
    <priority>${r.priority}</priority>
  </url>`
  )
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate");
  res.write(body);
  res.end();

  return { props: {} };
}

export default function SiteMapXML() {
  return null;
}
