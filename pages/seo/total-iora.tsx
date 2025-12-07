// FILE: /pages/seo/total-iora.tsx

import Head from "next/head";
import Link from "next/link";

const APP_URL = "https://total-iora.com";

export default function TotalIoraSeoPage() {
  const title =
    "Total-Iora – AI Strategy & Optimisation Workspace for Teams and Founders";
  const description =
    "Total-Iora combines AI strategy templates, KPI tracking, and experiment logging in one workspace so you can plan, execute, and improve faster.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Total-Iora",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: APP_URL,
    description,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    featureList: [
      "AI-generated strategy outlines",
      "Objectives and key results tracking",
      "Experiment and test logbook",
      "Visual dashboards for performance",
      "Collaboration for teams and advisors",
    ],
    creator: {
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
        <meta
          name="keywords"
          content="Total-Iora, AI strategy tool, optimisation workspace, KPI tracker, startup planning"
        />
        <link rel="canonical" href={`${APP_URL}/seo/total-iora`} />

        <meta property="og:type" content="website" />
        <meta property="og:title" content="Total-Iora – AI Strategy Workspace" />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={`${APP_URL}/seo/total-iora`} />
        <meta property="og:site_name" content="Total-Iora" />
        <meta property="og:image" content={`${APP_URL}/totaliora_logo.png`} />

        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Total-Iora – AI Strategy Workspace" />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`${APP_URL}/totaliora_logo.png`} />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </Head>

      <main className="mx-auto max-w-3xl px-4 py-10 prose prose-slate">
        <h1>Total-Iora – AI Strategy & Optimisation Workspace</h1>

        <p>
          <strong>Total-Iora</strong> gives you a single place to design,
          implement, and optimise business strategies, with AI giving you a head
          start on each move.
        </p>

        <h2>What you can do with Total-Iora</h2>
        <ul>
          <li>Generate strategy outlines and roadmaps with AI.</li>
          <li>Turn goals into measurable KPIs and targets.</li>
          <li>Log experiments and capture learnings.</li>
          <li>Track progress on clear, simple dashboards.</li>
          <li>Collaborate with co-founders, advisors, and teams.</li>
        </ul>

        <p>
          Start planning:{" "}
          <Link href="/">
            <a>open Total-Iora</a>
          </Link>
        </p>
      </main>
    </>
  );
}
