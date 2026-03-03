import { verifyWebhookSignature } from "../../../lib/paypal-server";

export const config = {
  api: {
    bodyParser: true,
  },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const webhookId = process.env.PAYPAL_WEBHOOK_ID || "";
  if (!webhookId) {
    return res.status(500).json({ error: "Missing PAYPAL_WEBHOOK_ID" });
  }

  try {
    const isValid = await verifyWebhookSignature({
      transmissionId: req.headers["paypal-transmission-id"],
      transmissionTime: req.headers["paypal-transmission-time"],
      certUrl: req.headers["paypal-cert-url"],
      authAlgo: req.headers["paypal-auth-algo"],
      transmissionSig: req.headers["paypal-transmission-sig"],
      webhookId,
      eventBody: req.body,
    });

    if (!isValid) {
      return res.status(400).json({ error: "Invalid webhook signature" });
    }

    const eventType = req.body?.event_type;

    if (eventType) {
      console.log("PayPal webhook event:", eventType);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("paypal webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
