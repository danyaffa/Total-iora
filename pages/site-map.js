// FILE: /pages/site-map.js
import Head from "next/head";
import Link from "next/link";

export default function SiteMap() {
  const links = [
    { href: "/", label: "Landing — Total-iora" },
    { href: "/homepage", label: "Home — Total-iora Voice" },
    { href: "/get-your-aura", label: "Get Your Aura" },
    { href: "/sacred-space", label: "Sacred Notes" },
    { href: "/oracle-universe-dna", label: "Oracle Universe DNA" },
    { href: "/wall", label: "Living Wall" },
    { href: "/unlock", label: "Unlock Total-iora" },
    { href: "/dashboard", label: "Dashboard" },
    { href: "/login", label: "Log in" },
    { href: "/register", label: "Register — Free Access" },
    { href: "/subjects", label: "Subjects Library" },
    { href: "/contact", label: "Contact" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/terms", label: "Terms & Conditions" },
  ];

  return (
    <main className="page">
      <Head>
        <title>Site Map | Total-iora</title>
        <meta
          name="description"
          content="Quick overview of all main pages in the Total-iora app."
        />
      </Head>

      <section className="wrap">
        <h1>Site Map</h1>
        <p className="intro">
          Shortcuts to the key places inside your Total-iora experience.
        </p>

        <div className="grid">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="card">
              <span className="label">{link.label}</span>
              <span className="url">{link.href}</span>
            </Link>
          ))}
        </div>

        <p className="xml-note">
          Looking for the XML sitemap for search engines?{" "}
          <a href="/sitemap.xml">View sitemap.xml</a>
        </p>
      </section>

      <style jsx>{`
        .page {
          min-height: 100vh;
          padding: 24px;
          background: #f8fafc;
        }
        .wrap {
          max-width: 980px;
          margin: 0 auto;
        }
        h1 {
          font-size: 1.8rem;
          font-weight: 800;
          color: #0f172a;
        }
        .intro {
          margin-top: 8px;
          color: #475569;
        }
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
          margin-top: 18px;
        }
        @media (min-width: 700px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .card {
          display: block;
          padding: 12px 14px;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          text-decoration: none;
          transition: background 0.15s ease, box-shadow 0.15s ease,
            transform 0.05s ease;
        }
        .card:hover {
          background: #f1f5f9;
          box-shadow: 0 6px 16px rgba(15, 23, 42, 0.12);
          transform: translateY(-1px);
        }
        .label {
          display: block;
          font-weight: 700;
          color: #0f172a;
        }
        .url {
          display: block;
          font-size: 0.85rem;
          color: #64748b;
          margin-top: 4px;
        }
        .xml-note {
          margin-top: 22px;
          font-size: 0.9rem;
          color: #64748b;
        }
        .xml-note a {
          color: #0f172a;
          font-weight: 600;
          text-decoration: underline;
        }
      `}</style>
    </main>
  );
}
