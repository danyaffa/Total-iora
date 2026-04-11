// FILE: /pages/api/paypal/capture-order.js
import { paypalRequest } from "../../../lib/paypal-server";
import { withApi } from "../../../lib/apiSecurity";
import { logger } from "../../../lib/logger";

const log = logger.child({ fn: "api.paypal.capture-order" });

async function handler(req, res) {
  const { orderId } = req.body || {};
  if (!orderId || typeof orderId !== "string" || orderId.length > 128) {
    return res.status(400).json({ error: "invalid_order_id" });
  }

  try {
    const capture = await paypalRequest(`/v2/checkout/orders/${orderId}/capture`, {
      method: "POST",
      body: JSON.stringify({}),
    });
    return res.status(200).json({
      id: capture.id,
      status: capture.status,
      payer: capture.payer || null,
    });
  } catch (err) {
    log.error("paypal_capture_failed", { error: String(err?.message || err) });
    return res.status(502).json({ error: "unable_to_capture_order" });
  }
}

export default withApi(handler, {
  name: "api.paypal.capture-order",
  methods: ["POST"],
  rate: { max: 20, windowMs: 60_000 },
  audit: true,
  auditAction: "paypal.capture_order",
});
