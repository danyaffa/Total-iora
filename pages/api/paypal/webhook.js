import { verifyWebhookSignature } from "../../../lib/paypal-server";
import { adminDb } from "../../../utils/firebaseAdmin";

export const config = {
  api: {
    bodyParser: true,
  },
};

// Events that indicate a successful payment or active subscription
const PAID_EVENTS = [
  "BILLING.SUBSCRIPTION.ACTIVATED",
  "BILLING.SUBSCRIPTION.RENEWED",
  "PAYMENT.SALE.COMPLETED",
  "PAYMENT.CAPTURE.COMPLETED",
];

const CANCELLED_EVENTS = [
  "BILLING.SUBSCRIPTION.CANCELLED",
  "BILLING.SUBSCRIPTION.SUSPENDED",
  "BILLING.SUBSCRIPTION.EXPIRED",
];

async function markUserPaid(email, eventData) {
  if (!email) return;
  const emailNorm = email.trim().toLowerCase();
  if (!adminDb) return;
  const ref = adminDb.collection("users").doc(emailNorm);
  const snap = await ref.get();
  if (!snap.exists) return;

  await ref.update({
    isPaid: true,
    paidAt: new Date(),
    lastPaypalEvent: eventData.event_type,
    paypalSubscriptionId: eventData.resource?.id || "",
  });
}

async function markUserUnpaid(email, eventData) {
  if (!email) return;
  const emailNorm = email.trim().toLowerCase();
  if (!adminDb) return;
  const ref = adminDb.collection("users").doc(emailNorm);
  const snap = await ref.get();
  if (!snap.exists) return;

  await ref.update({
    isPaid: false,
    lastPaypalEvent: eventData.event_type,
  });
}

function extractEmail(body) {
  // Try various PayPal event structures to find the subscriber email
  return (
    body?.resource?.subscriber?.email_address ||
    body?.resource?.payer?.email_address ||
    body?.resource?.purchase_units?.[0]?.payee?.email_address ||
    ""
  );
}

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
    const email = extractEmail(req.body);

    console.log("PayPal webhook event:", eventType, "email:", email);

    if (PAID_EVENTS.includes(eventType) && email) {
      await markUserPaid(email, req.body);
    } else if (CANCELLED_EVENTS.includes(eventType) && email) {
      await markUserUnpaid(email, req.body);
    }

    return res.status(200).json({ received: true });
  } catch (error) {
    console.error("paypal webhook error:", error);
    return res.status(500).json({ error: "Webhook processing failed" });
  }
}
