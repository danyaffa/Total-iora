// FILE: /pages/api/paypal/get-subscription.js
import { paypalRequest } from "../../../lib/paypal-server";
import { withApi } from "../../../lib/apiSecurity";
import { logger } from "../../../lib/logger";

const log = logger.child({ fn: "api.paypal.get-subscription" });

async function handler(req, res) {
  const { subscriptionId } = req.query;
  const safeId = String(subscriptionId || "").trim();
  if (!safeId || safeId.length > 128) {
    return res.status(400).json({ error: "missing_subscription_id" });
  }

  try {
    const subscription = await paypalRequest(`/v1/billing/subscriptions/${safeId}`);
    return res.status(200).json(subscription);
  } catch (err) {
    log.error("paypal_get_subscription_failed", { error: String(err?.message || err) });
    return res.status(502).json({ error: "unable_to_fetch_subscription" });
  }
}

export default withApi(handler, {
  name: "api.paypal.get-subscription",
  methods: ["GET"],
  rate: { max: 60, windowMs: 60_000 },
});
