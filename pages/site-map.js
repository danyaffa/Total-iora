// FILE: /pages/site-map.js
import Head from "next/head";
import Link from "next/link";

export default function SiteMap() {
  const base =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "https://totaliora.com";

  const links = [
    { href: "/homepage", label: "Home — Total-iora Voice" },
    { href: "/sacred-space", label: "Sacred Notes" },
    { href: "/oracle-universe-dna", label: "Oracle Universe DNA" },
    { href: "/login", label: "Log in" },
    { href: "/register", label: "Register — Free Access" },
    // Faith-specific entry points
    { href: "/homepage?faith=Muslim", label: "Home (Muslim • Imam • Mosque)" },
    { href: "/homepage?faith=Christian", label: "Home (Christian • Priest • Church)" },
    { href: "/homepage?faith=Jewish", label: "Home (Jewish • Rabbi • Synagogue)" },
    { href: "/homepage?faith=Eastern", label: "Home (Eastern • Monk • Temple)" },
  ];

  return (
    <main className="page">
      <Head>
        <title>Site Map • Total-iora Voice</title>
        <meta
          name="description"
          content="Site map for Total-iora Voice — spiritual guidance, sacred notes, and faith-aware atmospheres."
        />
        <link rel="canonical" href={`${base}/site-map`} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "ItemList",
              name: "Total-iora App Map",
              itemListElement: links.map((l, i) => ({
                "@type": "SiteNavigationElement",
                position: i + 1,
                name: l.label,
                url: `${base}${l.href}`,
              })),
            }),
          }}
        />
      </Head>

      <section className="wrap">
        <h1>Site Map</h1>
        <ul className="grid">
          {links.map((l) => (
            <li key={l.href}>
              <Link href={l.href}>{l.label}</Link>
            </li>
          ))}
        </ul>
      </section>

      <style jsx>{`
        .page { min-height: 100vh; padding: 24px; background: #f8fafc; }
        .wrap { max-width: 980px; margin: 0 auto; }
        h1 { font-size: 1.8rem; font-weight: 800; color: #0f172a; }
        .grid { display: grid; grid-template-columns: 1fr; gap: 10px; margin-top: 14px; }
        @media (min-width: 700px){ .grid { grid-template-columns: 1fr 1fr; } }
        a { display:block; padding:12px 14px; border-radius:12px; border:1px solid #e2e8f0; background:#fff; font-weight:700; color:#0f172a; }
        a:hover { background:#f1f5f9; }
      `}</style>
    </main>
  );
}
