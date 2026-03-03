import { paypalRequest } from "../../../lib/paypal-server";

const DEFAULT_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID || "";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { planId = DEFAULT_PLAN_ID } = req.body || {};
  if (!planId) {
    return res.status(400).json({ error: "Missing planId" });
  }

  try {
    const subscription = await paypalRequest("/v1/billing/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        plan_id: String(planId),
        application_context: {
          brand_name: "Total-iora",
          user_action: "SUBSCRIBE_NOW",
          shipping_preference: "NO_SHIPPING",
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/unlock?status=success`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/unlock?status=cancelled`,
        },
      }),
    });

    return res.status(200).json({
      id: subscription.id,
      status: subscription.status,
      approveLink: (subscription.links || []).find((link) => link.rel === "approve")?.href || null,
    });
  } catch (error) {
    console.error("create-subscription error:", error);
    return res.status(500).json({ error: "Unable to create PayPal subscription" });
  }
}
