// FILE: /pages/api/register.js
import { getAdminDb } from "../../utils/firebaseAdmin";
import { randomBytes, scryptSync } from "crypto";
import * as admin from "firebase-admin";

function makeHash(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `s1$${salt}$${hash}`;
}

/** Detect whether the db object is the real Admin SDK or the Client SDK wrapper */
function detectSdkType() {
  if (admin.apps.length > 0) return "admin";
  return "client-fallback";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  // Lazy init — retries Firebase Admin (or client SDK fallback) on every request
  const adminDb = getAdminDb();
  const sdkType = detectSdkType(); // must be AFTER getAdminDb() which triggers ensureInitialized()

  // Detailed env var presence check (values never exposed)
  const envCheck = {
    FIREBASE_PROJECT_ID: !!(process.env.FIREBASE_PROJECT_ID || "").trim(),
    FIREBASE_CLIENT_EMAIL: !!(process.env.FIREBASE_CLIENT_EMAIL || "").trim(),
    FIREBASE_PRIVATE_KEY: !!(process.env.FIREBASE_PRIVATE_KEY || "").trim(),
    FIREBASE_PRIVATE_KEY_LENGTH: (process.env.FIREBASE_PRIVATE_KEY || "").length,
    FIREBASE_PRIVATE_KEY_STARTS: (process.env.FIREBASE_PRIVATE_KEY || "").substring(0, 27),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: !!(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim(),
    NEXT_PUBLIC_FIREBASE_API_KEY: !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim(),
  };

  console.log("[register] SDK type:", sdkType, "| adminDb:", adminDb ? "OK" : "NULL");
  console.log("[register] env check:", JSON.stringify(envCheck));

  if (!adminDb) {
    console.error("[register] adminDb is null — neither Admin SDK nor Client SDK could initialise");
    return res.status(500).json({
      error: "Server configuration error. Please contact support.",
      debug: "Firebase could not initialise. Neither Admin SDK nor Client SDK fallback worked.",
      debug_hint: "Check environment variables: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY. Visit /api/diagnostic for full diagnostics.",
      diagnostics: {
        sdkType,
        envCheck,
      },
    });
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

    console.log("[register] doc exists?", snap.exists, "| using SDK:", sdkType);

    if (snap.exists) {
      // Account exists — update password hash so user can login
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

    console.log("[register] success — user created:", emailNorm, "| SDK:", sdkType);

    return res.status(200).json({ ok: true, trialEnd: trialEnd.toISOString() });
  } catch (e) {
    console.error("[register] error:", e.message || e);
    console.error("[register] error code:", e.code);
    console.error("[register] stack:", e.stack);

    const errMsg = (e.message || "").toLowerCase();
    const errCode = (e.code || "").toLowerCase();
    const isPermissionError = errMsg.includes("permission") || errCode.includes("permission-denied");
    const isUnauthenticated = errMsg.includes("unauthenticated") || errCode.includes("unauthenticated");
    const isNotFound = errMsg.includes("not found") || errCode.includes("not-found");

    let debug_hint;
    let fixSteps = [];

    if (isPermissionError) {
      debug_hint = sdkType === "client-fallback"
        ? "Using Client SDK fallback (Admin SDK credentials missing). Client SDK is subject to Firestore rules. Fix: set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY env vars, OR deploy permissive firestore.rules."
        : "Firestore rules are blocking writes even with Admin SDK. This is unusual — check that the service account has the correct IAM roles.";
      fixSteps = [
        "1. Check if FIREBASE_PRIVATE_KEY, FIREBASE_CLIENT_EMAIL, FIREBASE_PROJECT_ID are set in your hosting environment",
        "2. If using Client SDK fallback, deploy Firestore rules: firebase deploy --only firestore:rules",
        "3. Visit /api/diagnostic to see full configuration status",
      ];
    } else if (isUnauthenticated) {
      debug_hint = "Firebase credentials are invalid or expired. Regenerate the service account key.";
      fixSteps = ["1. Go to Firebase Console > Project Settings > Service Accounts", "2. Generate a new private key", "3. Update FIREBASE_PRIVATE_KEY env var"];
    } else if (isNotFound) {
      debug_hint = "Firestore database may not be created yet. Go to Firebase Console > Firestore Database and create it.";
    } else {
      debug_hint = `Unexpected error during registration. SDK: ${sdkType}. Check server logs for details.`;
    }

    return res.status(500).json({
      error: "Registration failed. Please try again.",
      debug: e.message,
      debug_hint,
      fix_steps: fixSteps.length > 0 ? fixSteps : undefined,
      diagnostics: {
        sdkType,
        errorCode: e.code || null,
        isPermissionError,
        envCheck,
      },
    });
  }
}
