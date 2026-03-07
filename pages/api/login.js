// FILE: /pages/api/login.js
import { scryptSync } from "crypto";
import { adminDb } from "../../utils/firebaseAdmin";

function verify(hashString, password) {
  const [scheme, salt, hash] = String(hashString || "").split("$");
  if (scheme !== "s1" || !salt || !hash) return false;
  const calc = scryptSync(password, salt, 64).toString("hex");
  return calc === hash;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // --- Debug: check Firebase Admin init ---
  if (!adminDb) {
    console.error("[login] adminDb is null — Firebase Admin not initialised");
    console.error("[login] FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "SET" : "MISSING");
    console.error("[login] FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "SET" : "MISSING");
    console.error("[login] FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? `SET (${process.env.FIREBASE_PRIVATE_KEY.length} chars)` : "MISSING");
    return res.status(500).json({ error: "Server configuration error. Please contact support.", debug: "adminDb is null" });
  }

  const { email = "", password = "" } = req.body || {};
  const emailNorm = String(email || "").trim().toLowerCase();
  const pw = String(password || "");

  console.log("[login] attempt for:", emailNorm);

  if (!emailNorm || !pw) return res.status(400).json({ error: "Missing email or password" });

  try {
    const ref = adminDb.collection("users").doc(emailNorm);
    const snap = await ref.get();

    console.log("[login] doc exists?", snap.exists);

    if (!snap.exists) {
      console.log("[login] no document found for:", emailNorm);
      return res.status(401).json({ error: "Invalid credentials", debug_hint: "No user document in Firestore for this email" });
    }

    const user = snap.data() || {};
    console.log("[login] doc keys:", Object.keys(user));
    console.log("[login] has password_hash?", Boolean(user.password_hash));
    console.log("[login] password_hash starts with:", user.password_hash ? user.password_hash.substring(0, 10) + "..." : "N/A");

    if (!user.password_hash) {
      console.log("[login] FAIL — password_hash is missing from the document");
      return res.status(401).json({
        error: "Your account needs to be updated. Please register again with the same email to set your password.",
        debug_hint: "password_hash field is missing — user must re-register to set password",
      });
    }

    const passwordMatch = verify(user.password_hash, pw);
    console.log("[login] password match?", passwordMatch);

    if (!passwordMatch) {
      return res.status(401).json({ error: "Invalid credentials", debug_hint: "Password does not match stored hash" });
    }

    // Success — set session cookie
    const SECURE = req.headers["x-forwarded-proto"] === "https";
    const cookie = `ac_session=1; Max-Age=${30 * 24 * 3600}; Path=/; SameSite=Lax${SECURE ? "; Secure" : ""}`;
    res.setHeader("Set-Cookie", cookie);

    const isPaid = Boolean(user.isPaid);
    const trialEnd = user.trialEnd?.toDate
      ? user.trialEnd.toDate().toISOString()
      : user.trialEnd || null;
    const trialActive = trialEnd ? new Date(trialEnd) > new Date() : false;

    console.log("[login] success for:", emailNorm, "isPaid:", isPaid, "trialActive:", trialActive);

    return res.status(200).json({
      ok: true,
      isPaid,
      trialEnd,
      trialActive,
      email: emailNorm,
    });
  } catch (e) {
    console.error("[login] error:", e.message || e);
    console.error("[login] stack:", e.stack);
    return res.status(500).json({ error: "Auth error. Please try again.", debug: e.message });
  }
}
