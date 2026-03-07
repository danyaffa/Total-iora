// FILE: /pages/api/login.js
import { scryptSync } from "crypto";
import { adminDb } from "../../utils/firebaseAdmin";

function verify(hashString, password) {
  // format: s1$<salt>$<hash>
  const [scheme, salt, hash] = String(hashString || "").split("$");
  if (scheme !== "s1" || !salt || !hash) return false;
  const calc = scryptSync(password, salt, 64).toString("hex");
  return calc === hash;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (!adminDb) {
    console.error("login: Firebase Admin not initialised — check env vars");
    return res.status(500).json({ error: "Server configuration error. Please contact support." });
  }

  const { email = "", password = "" } = req.body || {};
  const emailNorm = String(email || "").trim().toLowerCase();
  const pw = String(password || "");

  if (!emailNorm || !pw) return res.status(400).json({ error: "Missing email or password" });

  try {
    const ref = adminDb.collection("users").doc(emailNorm);
    const snap = await ref.get();

    if (!snap.exists) return res.status(401).json({ error: "Invalid credentials" });

    const user = snap.data() || {};
    if (!user.password_hash || !verify(user.password_hash, pw)) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const SECURE = req.headers["x-forwarded-proto"] === "https";
    const cookie = `ac_session=1; Max-Age=${30 * 24 * 3600}; Path=/; SameSite=Lax${SECURE ? "; Secure" : ""}`;

    res.setHeader("Set-Cookie", cookie);

    // Return trial/payment status so client can route accordingly
    const isPaid = Boolean(user.isPaid);
    const trialEnd = user.trialEnd?.toDate
      ? user.trialEnd.toDate().toISOString()
      : user.trialEnd || null;
    const trialActive = trialEnd ? new Date(trialEnd) > new Date() : false;

    return res.status(200).json({
      ok: true,
      isPaid,
      trialEnd,
      trialActive,
      email: emailNorm,
    });
  } catch (e) {
    console.error("login error:", e);
    return res.status(500).json({ error: "Auth error. Please try again." });
  }
}
