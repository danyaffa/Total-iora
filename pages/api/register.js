// FILE: /pages/api/register.js
import { adminDb } from "../../utils/firebaseAdmin";
import { randomBytes, scryptSync } from "crypto";

function makeHash(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `s1$${salt}$${hash}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // --- Debug: check Firebase Admin init ---
  if (!adminDb) {
    console.error("[register] adminDb is null — Firebase Admin not initialised");
    console.error("[register] FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "SET" : "MISSING");
    console.error("[register] FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "SET" : "MISSING");
    console.error("[register] FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? `SET (${process.env.FIREBASE_PRIVATE_KEY.length} chars)` : "MISSING");
    return res.status(500).json({ error: "Server configuration error. Please contact support.", debug: "adminDb is null" });
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
      // Show what's stored so we can debug
      const existing = snap.data() || {};
      console.log("[register] existing doc keys:", Object.keys(existing));
      console.log("[register] existing doc has password_hash?", Boolean(existing.password_hash));
      console.log("[register] existing doc email:", existing.email);
      console.log("[register] existing doc createdAt:", existing.createdAt);

      return res.status(409).json({
        error: "Account already exists. Please log in.",
        debug_hint: "Document found in Firestore for this email. If you cannot log in, the password may not match. Try the /api/test-auth endpoint to diagnose.",
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
    return res.status(500).json({ error: "Registration failed. Please try again.", debug: e.message });
  }
}
