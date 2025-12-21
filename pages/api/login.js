// FILE: /pages/api/login.js
import { scryptSync } from "crypto";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

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

function verify(hashString, password) {
  // format: s1$<salt>$<hash>
  const [scheme, salt, hash] = String(hashString || "").split("$");
  if (scheme !== "s1" || !salt || !hash) return false;
  const calc = scryptSync(password, salt, 64).toString("hex");
  return calc === hash;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { email = "", password = "" } = req.body || {};
  const emailNorm = String(email || "").trim().toLowerCase();
  const pw = String(password || "");

  if (!emailNorm || !pw) return res.status(400).json({ error: "Missing email or password" });

  try {
    const ref = db.collection("users").doc(emailNorm);
    const snap = await ref.get();

    if (!snap.exists) return res.status(401).json({ error: "Invalid credentials" });

    const user = snap.data() || {};
    if (!user.password_hash || !verify(user.password_hash, pw)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const SECURE = req.headers["x-forwarded-proto"] === "https";
    const cookie = `ac_session=1; Max-Age=${30 * 24 * 3600}; Path=/; SameSite=Lax${SECURE ? "; Secure" : ""}`;

    res.setHeader("Set-Cookie", cookie);
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ error: "Auth error" });
  }
}
