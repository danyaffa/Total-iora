// FILE: /pages/api/register.js
import { getAdminDb } from "../../utils/firebaseAdmin";
import { randomBytes, scryptSync } from "crypto";

function makeHash(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `s1$${salt}$${hash}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Lazy init — retries Firebase Admin (or client SDK fallback) on every request
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.error("[register] adminDb is null — neither Admin SDK nor Client SDK could initialise");
    return res.status(500).json({ error: "Server configuration error. Please contact support." });
  }

  const {
    name = "",
    username = "",
    email = "",
    phone = "",
    password = "",
  } = req.body || {};

  const displayName = (name || username || "").trim();
  const emailNorm = String(email || "").trim().toLowerCase();
  const phoneNorm = String(phone || "").trim();
  const pw = String(password || "");

  console.log("[register] attempt for:", emailNorm, "name:", displayName);

  if (!displayName || !emailNorm || !phoneNorm || pw.length < 8) {
    return res.status(400).json({ error: "Missing required fields (password min 8)" });
  }

  try {
    const ref = adminDb.collection("users").doc(emailNorm);
    const snap = await ref.get();

    console.log("[register] doc exists?", snap.exists);

    if (snap.exists) {
      // Account exists — update password hash so user can login
      // This handles cases where the old document had no hash or a broken hash
      const existing = snap.data() || {};
      console.log("[register] existing doc keys:", Object.keys(existing));
      console.log("[register] existing doc has password_hash?", Boolean(existing.password_hash));
      console.log("[register] updating password for existing account:", emailNorm);

      await ref.update({
        password_hash: makeHash(pw),
        name: displayName,
        username: String(username || displayName),
        phone: phoneNorm,
      });

      const trialEnd = existing.trialEnd?.toDate
        ? existing.trialEnd.toDate().toISOString()
        : existing.trialEnd || null;

      console.log("[register] password updated for existing user:", emailNorm);
      return res.status(200).json({
        ok: true,
        trialEnd,
        updated: true,
      });
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);

    const docData = {
      name: displayName,
      username: String(username || displayName),
      email: emailNorm,
      phone: phoneNorm,
      password_hash: makeHash(pw),
      isPaid: false,
      trialStart: now,
      trialEnd: trialEnd,
      createdAt: now,
    };

    await ref.set(docData, { merge: false });

    console.log("[register] success — user created:", emailNorm);

    return res.status(200).json({ ok: true, trialEnd: trialEnd.toISOString() });
  } catch (e) {
    console.error("[register] error:", e.message || e);
    console.error("[register] stack:", e.stack);
    const isPermissionError = (e.message || "").toLowerCase().includes("permission");
    const debug_hint = isPermissionError
      ? "Firestore rules are blocking writes. Deploy firestore.rules: firebase deploy --only firestore:rules"
      : undefined;
    return res.status(500).json({
      error: "Registration failed. Please try again.",
      debug: e.message,
      debug_hint,
    });
  }
}
