// FILE: /pages/api/register.js
import { getAdminDb } from "../../utils/firebaseAdmin";
import { randomBytes, scryptSync } from "crypto";
import { withApi } from "../../lib/apiSecurity";
import { logger } from "../../lib/logger";

const log = logger.child({ fn: "api.register" });

function makeHash(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `s1$${salt}$${hash}`;
}

async function handler(req, res) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    log.error("db_unavailable");
    return res.status(503).json({ error: "service_unavailable" });
  }

  const {
    name = "",
    username = "",
    email = "",
    phone = "",
    password = "",
  } = req.body || {};

  const displayName = String(name || username || "").trim();
  const emailNorm = String(email || "").trim().toLowerCase();
  const phoneNorm = String(phone || "").trim();
  const pw = String(password || "");

  // Input validation
  if (!displayName || displayName.length > 120) {
    return res.status(400).json({ error: "invalid_name" });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm) || emailNorm.length > 254) {
    return res.status(400).json({ error: "invalid_email" });
  }
  if (!phoneNorm || phoneNorm.length > 40) {
    return res.status(400).json({ error: "invalid_phone" });
  }
  if (pw.length < 8 || pw.length > 1024) {
    return res.status(400).json({ error: "invalid_password" });
  }

  const ref = adminDb.collection("users").doc(emailNorm);
  const snap = await ref.get();

  if (snap.exists) {
    const existing = snap.data() || {};
    await ref.update({
      password_hash: makeHash(pw),
      name: displayName,
      username: String(username || displayName),
      phone: phoneNorm,
    });

    const trialEnd = existing.trialEnd?.toDate
      ? existing.trialEnd.toDate().toISOString()
      : existing.trialEnd || null;

    log.info("register.updated", { email: emailNorm });
    return res.status(200).json({ ok: true, trialEnd, updated: true });
  }

  const now = new Date();
  const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

  await ref.set(
    {
      name: displayName,
      username: String(username || displayName),
      email: emailNorm,
      phone: phoneNorm,
      password_hash: makeHash(pw),
      isPaid: false,
      trialStart: now,
      trialEnd,
      createdAt: now,
    },
    { merge: false }
  );

  log.info("register.created", { email: emailNorm });
  return res.status(200).json({ ok: true, trialEnd: trialEnd.toISOString() });
}

export default withApi(handler, {
  name: "api.register",
  methods: ["POST"],
  rate: { max: 5, windowMs: 60_000 },
});
