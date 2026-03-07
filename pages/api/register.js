// FILE: /pages/api/register.js
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { randomBytes, scryptSync } from "crypto";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

function makeHash(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  // format: s1$<salt>$<hash>
  return `s1$${salt}$${hash}`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

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

  if (!displayName || !emailNorm || !phoneNorm || pw.length < 8) {
    return res.status(400).json({ error: "Missing required fields (password min 8)" });
  }

  try {
    const ref = db.collection("users").doc(emailNorm);

    const snap = await ref.get();
    if (snap.exists) {
      return res.status(409).json({ error: "Account already exists. Please log in." });
    }

    const now = new Date();
    const trialEnd = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000); // 14 days

    await ref.set(
      {
        name: displayName,
        username: String(username || displayName),
        email: emailNorm,
        phone: phoneNorm,
        password_hash: makeHash(pw),
        isPaid: false,
        trialStart: now,
        trialEnd: trialEnd,
        createdAt: now,
      },
      { merge: false }
    );

    return res.status(200).json({ ok: true, trialEnd: trialEnd.toISOString() });
  } catch (e) {
    console.error("register error:", e);
    return res.status(500).json({ error: "Registration failed" });
  }
}
