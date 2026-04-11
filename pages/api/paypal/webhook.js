// FILE: /pages/api/paypal/webhook.js
import { verifyWebhookSignature } from "../../../lib/paypal-server";
import { getAdminDb } from "../../../utils/firebaseAdmin";
import { withApi } from "../../../lib/apiSecurity";
import { writeAudit } from "../../../lib/audit";
import { logger } from "../../../lib/logger";

const log = logger.child({ fn: "api.paypal.webhook" });

export const config = {
  api: { bodyParser: true },
};

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
  const adminDb = getAdminDb();
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
  const adminDb = getAdminDb();
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
  return (
    body?.resource?.subscriber?.email_address ||
    body?.resource?.payer?.email_address ||
    body?.resource?.purchase_units?.[0]?.payee?.email_address ||
    ""
  );
}

async function handler(req, res) {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID || "";
  if (!webhookId) {
    log.error("missing_webhook_id");
    return res.status(503).json({ error: "service_unavailable" });
  }

  let isValid = false;
  try {
    isValid = await verifyWebhookSignature({
      transmissionId: req.headers["paypal-transmission-id"],
      transmissionTime: req.headers["paypal-transmission-time"],
      certUrl: req.headers["paypal-cert-url"],
      authAlgo: req.headers["paypal-auth-algo"],
      transmissionSig: req.headers["paypal-transmission-sig"],
      webhookId,
      eventBody: req.body,
    });
  } catch (err) {
    log.error("verify_failed", { error: String(err?.message || err) });
  }

  if (!isValid) {
    writeAudit({
      action: "paypal.webhook_invalid",
      actor: "paypal",
      route: "api.paypal.webhook",
      result: "failure",
    }).catch(() => {});
    return res.status(400).json({ error: "invalid_signature" });
  }

  const eventType = req.body?.event_type;
  const email = extractEmail(req.body);

  if (PAID_EVENTS.includes(eventType) && email) {
    await markUserPaid(email, req.body);
  } else if (CANCELLED_EVENTS.includes(eventType) && email) {
    await markUserUnpaid(email, req.body);
  }

  writeAudit({
    action: "paypal.webhook",
    actor: "paypal",
    target: email,
    route: "api.paypal.webhook",
    meta: { eventType },
  }).catch(() => {});

  log.info("webhook.ok", { eventType });
  return res.status(200).json({ received: true });
}

export default withApi(handler, {
  name: "api.paypal.webhook",
  methods: ["POST"],
  rate: { max: 120, windowMs: 60_000 },
});
