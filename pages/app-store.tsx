// FILE: /pages/app-store.tsx

import Head from "next/head";
import Link from "next/link";

const APP_URL = "https://total-iora.com";

const APP_ENTRY_URL = "https://total-iora.com/app";

export default function AppEntryLandingPage() {
  const title = "Access Total-Iora – AI Strategy Workspace";
  const description =
    "Open the Total-Iora web app to build AI-assisted strategies, track KPIs, and log experiments for your business or team.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Total-Iora",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: `${APP_URL}/app-store`,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    potentialAction: {
      "@type": "UseAction",
      target: APP_ENTRY_URL,
    },
    publisher: {
      "@type": "Organization",
      name: "Total-Iora",
      url: APP_URL,
    },
  };

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link rel="canonical" href={`${APP_URL}/app-store`} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${APP_URL}/app-store`} />
        <meta property="og:image" content={`${APP_URL}/totaliora_logo.png`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${APP_URL}/totaliora_logo.png`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="mx-auto flex max-w-xl flex-col items-center px-4 py-10 text-center">
        <h1 className="mb-4 text-3xl font-semibold">Open Total-Iora</h1>
        <p className="mb-8 text-slate-700">
          Log in to Total-Iora to build strategies, track KPIs, and optimise your
          business with AI support.
        </p>

        <a
          href={APP_ENTRY_URL}
          className="rounded-md border px-6 py-3 text-sm font-medium"
        >
          Go to Total-Iora app
        </a>

        <p className="mt-8 text-sm text-slate-500">
          Need an overview first?{" "}
          <Link href="/">
            <a>Visit the Total-Iora homepage</a>
          </Link>
        </p>
      </main>
    </>
  );
}
