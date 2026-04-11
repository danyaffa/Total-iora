// FILE: /pages/api/delete-account.js
import { getAdminDb, getAdminAuth } from "../../utils/firebaseAdmin";
import { withApi } from "../../lib/apiSecurity";
import { writeAudit } from "../../lib/audit";
import { logger } from "../../lib/logger";

const log = logger.child({ fn: "api.delete-account" });

async function handler(req, res) {
  const adminDb = getAdminDb();
  const adminAuth = getAdminAuth();

  if (!adminAuth || !adminDb) {
    log.error("admin_unavailable");
    return res.status(503).json({ error: "service_unavailable" });
  }

  const { idToken } = req.body || {};
  if (!idToken || typeof idToken !== "string" || idToken.length > 4096) {
    return res.status(400).json({ error: "invalid_id_token" });
  }

  let decoded;
  try {
    decoded = await adminAuth.verifyIdToken(idToken);
  } catch (err) {
    log.warn("verify_id_token_failed", { error: String(err?.message || err) });
    return res.status(401).json({ error: "unauthenticated" });
  }

  const uid = decoded.uid;
  const email = (decoded.email || "").trim().toLowerCase();

  if (email) {
    const userDocRef = adminDb.collection("users").doc(email);
    const snap = await userDocRef.get();
    if (snap.exists) await userDocRef.delete();
  }

  const byUidRef = adminDb.collection("users_by_uid").doc(uid);
  const byUidSnap = await byUidRef.get();
  if (byUidSnap.exists) await byUidRef.delete();

  await adminAuth.deleteUser(uid);

  writeAudit({
    action: "user.delete_account",
    actor: email || uid,
    target: email || uid,
    route: "api.delete-account",
  }).catch(() => {});

  log.info("delete_account.success", { email });
  return res.status(200).json({ ok: true });
}

export default withApi(handler, {
  name: "api.delete-account",
  methods: ["POST"],
  rate: { max: 5, windowMs: 60_000 },
});
