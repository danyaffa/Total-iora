// FILE: /pages/api/ai-profile.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { withApi } from "../../lib/apiSecurity";

async function handler(_req: NextApiRequest, res: NextApiResponse) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": ["SoftwareApplication", "WebApplication"],
    name: "Total-Iora",
    alternateName: "Total Iora",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: "https://total-iora.com/",
    description:
      "Total-Iora is an AI-powered strategy and optimisation workspace that helps you design, track, and refine business initiatives in one place.",
    downloadUrl: "https://total-iora.com/app-store",
    installUrl: "https://total-iora.com/app-store",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
      description: "Free plan for small teams and solo founders.",
    },
    featureList: [
      "AI-assisted strategy planning",
      "Goal and KPI tracking",
      "Experiment logging and learnings",
      "Visual dashboards for progress",
      "Team collaboration workspace",
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "21",
    },
    creator: { "@type": "Organization", name: "Total-Iora", url: "https://total-iora.com/" },
    brand: { "@type": "Brand", name: "Total-Iora" },
    sameAs: ["https://total-iora.com/"],
  };

  res.setHeader("Content-Type", "application/ld+json; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600, s-maxage=3600");
  res.status(200).json(jsonLd);
}

export default withApi(handler as any, {
  name: "api.ai-profile",
  methods: ["GET"],
  rate: { max: 120, windowMs: 60_000 },
});
