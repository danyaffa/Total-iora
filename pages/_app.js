// FILE: /pages/_app.js

import { useEffect } from "react";
import Head from "next/head";
import "../styles/globals.css";
import ReviewWidget from "../components/ReviewWidgets";
import PromoSessionBanner from "../components/PromoSessionBanner";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://totaliora.com";

export default function App({ Component, pageProps }) {
  // Register Service Worker for PWA
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          // eslint-disable-next-line no-console
          console.log("SW registered:", reg.scope);
        })
        .catch((err) => {
          // eslint-disable-next-line no-console
          console.warn("SW registration failed:", err);
        });
    }
  }, []);

  return (
    <>
      <Head>
        {/* Mobile-first viewport — tested at 375px */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta charSet="utf-8" />
        <meta name="theme-color" content="#0f172a" />
        <meta name="format-detection" content="telephone=no" />
        {/* Baseline SEO (pages may override) */}
        <title>Total-iora — Spiritual Guidance, Voice & Sacred Notes</title>
        <meta
          name="description"
          content="Total-iora: private faith-aware voice guidance, Sacred Notes, and Oracle Universe DNA. Multi-faith — Christian, Muslim, Jewish, Buddhist, Hindu, Taoist, Universal."
        />
        <meta
          name="keywords"
          content="Total-iora, spiritual guidance, voice AI, imam, priest, rabbi, mosque, church, synagogue, temple, sacred notes, oracle, meditation, multi-faith"
        />
        <meta name="robots" content="index, follow, max-image-preview:large" />
        <meta name="author" content="Total-iora" />
        <link rel="canonical" href={SITE_URL} />
        {/* Open Graph */}
        <meta property="og:site_name" content="Total-iora" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Total-iora — Spiritual Guidance" />
        <meta
          property="og:description"
          content="Private voice + text guidance aligned to your tradition. Sacred Notes, Oracle Universe DNA, beautiful atmospheres."
        />
        <meta property="og:url" content={SITE_URL} />
        {/* Twitter */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Total-iora" />
        <meta
          name="twitter:description"
          content="Faith-aware voice guidance with Sacred Notes and Oracle Universe DNA."
        />
        {/* PWA */}
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/favicon.ico" />
        {/* JSON-LD organisation */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              name: "Total-iora",
              url: SITE_URL,
              logo: `${SITE_URL}/TotalIora_Logo.png`,
              sameAs: [SITE_URL],
            }),
          }}
        />
      </Head>
      <Component {...pageProps} />
      <PromoSessionBanner />
      <ReviewWidget />
    </>
  );
}
