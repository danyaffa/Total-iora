// FILE: /pages/api/paypal/create-subscription.js
import { paypalRequest } from "../../../lib/paypal-server";
import { withApi } from "../../../lib/apiSecurity";
import { logger } from "../../../lib/logger";

const log = logger.child({ fn: "api.paypal.create-subscription" });

const DEFAULT_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID || "";

async function handler(req, res) {
  const { planId = DEFAULT_PLAN_ID } = req.body || {};
  const safePlanId = String(planId || "").trim();
  if (!safePlanId || safePlanId.length > 128) {
    return res.status(400).json({ error: "missing_plan_id" });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

  try {
    const subscription = await paypalRequest("/v1/billing/subscriptions", {
      method: "POST",
      body: JSON.stringify({
        plan_id: safePlanId,
        custom_id: "total-iora-spirit",
        application_context: {
          brand_name: "Total-iora Spirit",
          user_action: "SUBSCRIBE_NOW",
          shipping_preference: "NO_SHIPPING",
          return_url: `${siteUrl}/unlock?status=success`,
          cancel_url: `${siteUrl}/unlock?status=cancelled`,
        },
      }),
    });

    return res.status(200).json({
      id: subscription.id,
      status: subscription.status,
      approveLink:
        (subscription.links || []).find((link) => link.rel === "approve")?.href || null,
    });
  } catch (err) {
    log.error("paypal_create_subscription_failed", { error: String(err?.message || err) });
    return res.status(502).json({ error: "unable_to_create_subscription" });
  }
}

export default withApi(handler, {
  name: "api.paypal.create-subscription",
  methods: ["POST"],
  rate: { max: 20, windowMs: 60_000 },
});
