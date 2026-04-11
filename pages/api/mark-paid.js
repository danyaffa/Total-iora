// FILE: /pages/api/mark-paid.js
// Marks a user as paid after successful PayPal payment.
// ADMIN-ONLY — must be called by the server (admin token) or the trusted
// PayPal capture flow running server-side after verifying the order.

import { getAdminDb } from "../../utils/firebaseAdmin";
import { withApi } from "../../lib/apiSecurity";
import { logger } from "../../lib/logger";
import { writeAudit } from "../../lib/audit";
import { paypalRequest } from "../../lib/paypal-server";

const log = logger.child({ fn: "api.mark-paid" });

/**
 * Only accept a mark-paid request if either:
 *  - x-admin-token matches ADMIN_API_TOKEN, OR
 *  - a verifiable PayPal orderId / subscriptionId is provided and the
 *    PayPal API confirms it as completed/active.
 */
async function verifyPayPalProof({ orderId, subscriptionId }) {
  if (orderId) {
    const order = await paypalRequest(`/v2/checkout/orders/${orderId}`);
    if (order?.status === "COMPLETED" || order?.status === "APPROVED") {
      return { ok: true, via: "order", id: orderId };
    }
  }
  if (subscriptionId) {
    const sub = await paypalRequest(`/v1/billing/subscriptions/${subscriptionId}`);
    if (sub?.status === "ACTIVE" || sub?.status === "APPROVED") {
      return { ok: true, via: "subscription", id: subscriptionId };
    }
  }
  return { ok: false };
}

async function handler(req, res) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    log.error("db_unavailable");
    return res.status(503).json({ error: "service_unavailable" });
  }

  const { email = "", subscriptionId = "", orderId = "" } = req.body || {};
  const emailNorm = String(email).trim().toLowerCase();
  if (!emailNorm || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm)) {
    return res.status(400).json({ error: "invalid_email" });
  }

  // Admin short-circuit
  const adminToken = process.env.ADMIN_API_TOKEN || "";
  const headerTok = req.headers["x-admin-token"] || "";
  const isAdmin = adminToken && headerTok && headerTok === adminToken;

  let via = "admin";
  if (!isAdmin) {
    if (!orderId && !subscriptionId) {
      return res.status(400).json({ error: "missing_proof" });
    }
    let proof;
    try {
      proof = await verifyPayPalProof({ orderId, subscriptionId });
    } catch (err) {
      log.error("paypal_verify_failed", { error: String(err?.message || err) });
      return res.status(502).json({ error: "paypal_verify_failed" });
    }
    if (!proof.ok) {
      return res.status(403).json({ error: "unverified_payment" });
    }
    via = proof.via;
  }

  const ref = adminDb.collection("users").doc(emailNorm);
  const snap = await ref.get();
  if (!snap.exists) {
    return res.status(404).json({ error: "user_not_found" });
  }

  await ref.update({
    isPaid: true,
    paidAt: new Date(),
    ...(subscriptionId ? { paypalSubscriptionId: subscriptionId } : {}),
    ...(orderId ? { paypalOrderId: orderId } : {}),
  });

  writeAudit({
    action: "admin.mark_paid",
    actor: isAdmin ? "admin-token" : "paypal-verified",
    target: emailNorm,
    route: "api.mark-paid",
    meta: { via, orderId: !!orderId, subscriptionId: !!subscriptionId },
  }).catch(() => {});

  log.info("mark_paid.success", { email: emailNorm, via });
  return res.status(200).json({ ok: true });
}

export default withApi(handler, {
  name: "api.mark-paid",
  methods: ["POST"],
  rate: { max: 20, windowMs: 60_000 },
  audit: true,
  auditAction: "admin.mark_paid",
});
