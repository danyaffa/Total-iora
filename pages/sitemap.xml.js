// FILE: /pages/sitemap.xml.js
export async function getServerSideProps({ req, res }) {
  const originHeader =
    req.headers["x-forwarded-proto"] && req.headers["x-forwarded-host"]
      ? `${req.headers["x-forwarded-proto"]}://${req.headers["x-forwarded-host"]}`
      : `https://${req.headers.host}`;
  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || originHeader;

  const urls = [
    "/",               // if you route root to /homepage in prod
    "/homepage",
    "/sacred-space",
    "/oracle-universe-dna",
    "/login",
    "/register",
    "/site-map",
    "/homepage?faith=Muslim",
    "/homepage?faith=Christian",
    "/homepage?faith=Jewish",
    "/homepage?faith=Eastern",
  ];

  const now = new Date().toISOString();

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
    ${urls
      .map(
        (u) => `<url>
      <loc>${BASE_URL}${u.startsWith("/") ? u : `/${u}`}</loc>
      <lastmod>${now}</lastmod>
      <changefreq>weekly</changefreq>
      <priority>${u === "/homepage" ? "1.0" : "0.7"}</priority>
    </url>`
      )
      .join("\n")}
  </urlset>`;

  res.setHeader("Content-Type", "text/xml");
  res.write(xml);
  res.end();

  return { props: {} };
}

export default function SiteMapXML() {
  return null;
}
