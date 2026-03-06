// FILE: /pages/sitemap.xml.js

export async function getServerSideProps({ req, res }) {
  // Figure out the base URL (production or preview)
  const originHeader =
    req.headers["x-forwarded-proto"] && req.headers["x-forwarded-host"]
      ? `${req.headers["x-forwarded-proto"]}://${req.headers["x-forwarded-host"]}`
      : `https://${req.headers.host}`;

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || originHeader;

  // Add all important static routes here
  const paths = [
    "/",                  // root
    "/homepage",
    "/get-your-aura",
    "/sacred-space",
    "/oracle-universe-dna",
    "/wall",
    "/unlock",
    "/dashboard",
    "/login",
    "/register",
    "/privacy",
    "/terms",
    "/legal",
    "/subjects",
    "/site-map",
  ];

  const lastmod = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:xhtml="http://www.w3.org/1999/xhtml"
>
${paths
  .map((path) => {
    const loc = `${BASE_URL.replace(/\/$/, "")}${path}`;
    return `  <url>
    <loc>${loc}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === "/" || path === "/homepage" ? "1.0" : "0.7"}</priority>
  </url>`;
  })
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();

  // Next.js still expects a props object
  return { props: {} };
}

// Nothing is rendered on the React side – response is handled above
export default function SiteMapXML() {
  return null;
}
