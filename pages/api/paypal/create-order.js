// FILE: /pages/api/paypal/create-order.js
import { paypalRequest } from "../../../lib/paypal-server";
import { withApi } from "../../../lib/apiSecurity";
import { logger } from "../../../lib/logger";

const log = logger.child({ fn: "api.paypal.create-order" });

const DEFAULT_AMOUNT = process.env.NEXT_PUBLIC_PAYPAL_AMOUNT || "5.00";
const DEFAULT_CURRENCY = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD";

async function handler(req, res) {
  const { amount = DEFAULT_AMOUNT, currency = DEFAULT_CURRENCY } = req.body || {};

  const amt = String(amount || DEFAULT_AMOUNT);
  const cur = String(currency || DEFAULT_CURRENCY);
  if (!/^[0-9]+(\.[0-9]{1,2})?$/.test(amt)) {
    return res.status(400).json({ error: "invalid_amount" });
  }
  if (!/^[A-Z]{3}$/.test(cur)) {
    return res.status(400).json({ error: "invalid_currency" });
  }

  try {
    const order = await paypalRequest("/v2/checkout/orders", {
      method: "POST",
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: { currency_code: cur, value: amt },
            description: "Total-iora Spirit — Premium Access",
            soft_descriptor: "Total-iora",
          },
        ],
      }),
    });
    return res.status(200).json({ id: order.id, status: order.status });
  } catch (err) {
    log.error("paypal_create_order_failed", { error: String(err?.message || err) });
    return res.status(502).json({ error: "unable_to_create_order" });
  }
}

export default withApi(handler, {
  name: "api.paypal.create-order",
  methods: ["POST"],
  rate: { max: 20, windowMs: 60_000 },
});
