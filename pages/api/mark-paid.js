// FILE: /pages/api/mark-paid.js
// Marks a user as paid after successful PayPal payment
import { adminDb } from "../../utils/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!adminDb) {
    console.error("mark-paid: Firebase Admin not initialised — check env vars");
    return res.status(500).json({ error: "Server configuration error" });
  }

  const { email = "", subscriptionId = "", orderId = "" } = req.body || {};
  const emailNorm = String(email || "").trim().toLowerCase();

  if (!emailNorm) {
    return res.status(400).json({ error: "Missing email" });
  }

  try {
    const ref = adminDb.collection("users").doc(emailNorm);
    const snap = await ref.get();

    if (!snap.exists) {
      return res.status(404).json({ error: "User not found" });
    }

    await ref.update({
      isPaid: true,
      paidAt: new Date(),
      ...(subscriptionId ? { paypalSubscriptionId: subscriptionId } : {}),
      ...(orderId ? { paypalOrderId: orderId } : {}),
    });

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("mark-paid error:", e);
    return res.status(500).json({ error: "Failed to update payment status" });
  }
}
