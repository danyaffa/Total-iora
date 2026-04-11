// FILE: /pages/api/login.js
import { scryptSync, timingSafeEqual } from "crypto";
import { getAdminDb } from "../../utils/firebaseAdmin";
import { withApi } from "../../lib/apiSecurity";
import { logger } from "../../lib/logger";
import { writeAudit } from "../../lib/audit";

const log = logger.child({ fn: "api.login" });

function verify(hashString, password) {
  const [scheme, salt, hash] = String(hashString || "").split("$");
  if (scheme !== "s1" || !salt || !hash) return false;
  try {
    const calc = scryptSync(password, salt, 64);
    const stored = Buffer.from(hash, "hex");
    if (stored.length !== calc.length) return false;
    return timingSafeEqual(calc, stored);
  } catch (err) {
    log.error("verify_error", { error: String(err?.message || err) });
    return false;
  }
}

async function handler(req, res) {
  const adminDb = getAdminDb();
  if (!adminDb) {
    log.error("db_unavailable", { fn: "handler" });
    return res.status(503).json({ error: "service_unavailable" });
  }

  const { email = "", password = "" } = req.body || {};
  const emailNorm = String(email).trim().toLowerCase();
  const pw = String(password);

  if (!emailNorm || !pw) {
    return res.status(400).json({ error: "missing_credentials" });
  }
  // Basic email sanity
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailNorm) || emailNorm.length > 254) {
    return res.status(400).json({ error: "invalid_email" });
  }
  if (pw.length > 1024) {
    return res.status(400).json({ error: "invalid_password" });
  }

  const ref = adminDb.collection("users").doc(emailNorm);
  const snap = await ref.get();

  if (!snap.exists) {
    log.warn("login.no_user", { email: emailNorm });
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const user = snap.data() || {};
  if (!user.password_hash) {
    log.warn("login.missing_hash", { email: emailNorm });
    return res.status(401).json({ error: "invalid_credentials" });
  }

  if (!verify(user.password_hash, pw)) {
    log.warn("login.bad_password", { email: emailNorm });
    return res.status(401).json({ error: "invalid_credentials" });
  }

  const isProd =
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production" ||
    req.headers["x-forwarded-proto"] === "https";
  const secureFlag = isProd ? "; Secure" : "";

  const sessionCookie =
    `ac_session=1; Max-Age=${30 * 24 * 3600}; Path=/; SameSite=Lax; HttpOnly${secureFlag}`;
  const emailCookie =
    `ac_email=${encodeURIComponent(emailNorm)}; Max-Age=${30 * 24 * 3600}; Path=/; SameSite=Lax${secureFlag}`;

  res.setHeader("Set-Cookie", [sessionCookie, emailCookie]);

  // Owner promotion — only if OWNER_EMAILS configured
  const ownerEmails = (process.env.OWNER_EMAILS || "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isOwner = ownerEmails.includes(emailNorm);
  if (isOwner && !user.isPaid) {
    try {
      await ref.update({ isPaid: true, isOwner: true });
      writeAudit({
        action: "user.owner_promoted",
        actor: emailNorm,
        target: emailNorm,
        route: "api.login",
      }).catch(() => {});
    } catch (err) {
      log.warn("owner_update_failed", { error: String(err?.message || err) });
    }
  }

  const isPaid = isOwner || Boolean(user.isPaid);
  const trialEnd = user.trialEnd?.toDate
    ? user.trialEnd.toDate().toISOString()
    : user.trialEnd || null;
  const trialActive = isPaid || (trialEnd ? new Date(trialEnd) > new Date() : false);

  log.info("login.success", { email: emailNorm, isPaid, trialActive });

  return res.status(200).json({
    ok: true,
    isPaid,
    trialEnd,
    trialActive,
    email: emailNorm,
  });
}

export default withApi(handler, {
  name: "api.login",
  methods: ["POST"],
  rate: { max: 10, windowMs: 60_000 },
});
