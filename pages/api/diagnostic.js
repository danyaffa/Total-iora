// FILE: /pages/api/diagnostic.js
// Returns Firebase configuration diagnostics (no secrets exposed)

import * as admin from "firebase-admin";

export default async function handler(req, res) {
  const checks = {
    timestamp: new Date().toISOString(),
    env: {},
    adminSdk: { status: "unknown" },
    clientSdkFallback: { status: "unknown" },
    firestoreWrite: { status: "unknown" },
    firestoreRead: { status: "unknown" },
  };

  // 1. Check environment variables (presence + structure, no secret values)
  const rawPk = process.env.FIREBASE_PRIVATE_KEY || "";
  checks.env = {
    FIREBASE_PROJECT_ID: { set: !!(process.env.FIREBASE_PROJECT_ID || "").trim(), length: (process.env.FIREBASE_PROJECT_ID || "").length },
    FIREBASE_CLIENT_EMAIL: { set: !!(process.env.FIREBASE_CLIENT_EMAIL || "").trim(), length: (process.env.FIREBASE_CLIENT_EMAIL || "").length },
    FIREBASE_PRIVATE_KEY: {
      set: !!rawPk.trim(),
      length: rawPk.length,
      trimmedLength: rawPk.trim().length,
      startsWith: rawPk.substring(0, 30),
      endsWith: rawPk.substring(rawPk.length - 30),
      containsBeginMarker: rawPk.includes("-----BEGIN"),
      containsLiteralBackslashN: rawPk.includes("\\n"),
      containsNewline: rawPk.includes("\n"),
      startsWithQuote: rawPk[0] === '"' || rawPk[0] === "'",
      endsWithQuote: rawPk[rawPk.length - 1] === '"' || rawPk[rawPk.length - 1] === "'",
    },
    NEXT_PUBLIC_FIREBASE_API_KEY: { set: !!(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "").trim() },
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: { set: !!(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "").trim() },
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: { set: !!(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "").trim() },
    NEXT_PUBLIC_FIREBASE_APP_ID: { set: !!(process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "").trim() },
    resolvedProjectId: (
      process.env.FIREBASE_PROJECT_ID ||
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
      "(none)"
    ).trim(),
    nodeEnv: process.env.NODE_ENV || "(not set)",
    vercelEnv: process.env.VERCEL_ENV || "(not set)",
  };

  // 2. Check Admin SDK initialization
  const projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    ""
  ).trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  let privateKey = (process.env.FIREBASE_PRIVATE_KEY || "").trim();
  if (privateKey.startsWith('"') && privateKey.endsWith('"')) privateKey = privateKey.slice(1, -1);
  if (privateKey.startsWith("'") && privateKey.endsWith("'")) privateKey = privateKey.slice(1, -1);
  privateKey = privateKey.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    checks.adminSdk = {
      status: "MISSING_CREDENTIALS",
      detail: {
        hasProjectId: !!projectId,
        hasClientEmail: !!clientEmail,
        hasPrivateKey: !!privateKey,
        privateKeyStartsWith: privateKey ? privateKey.substring(0, 30) + "..." : "(empty)",
      },
    };
  } else {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
      }
      checks.adminSdk = { status: "OK", appCount: admin.apps.length };
    } catch (err) {
      checks.adminSdk = { status: "INIT_ERROR", error: err.message };
    }
  }

  // 3. Test Firestore read/write if Admin SDK is available
  if (checks.adminSdk.status === "OK" || admin.apps.length > 0) {
    const db = admin.firestore();
    const testDocRef = db.collection("_diagnostic").doc("test");

    // Test write
    try {
      await testDocRef.set({ ts: new Date(), test: true });
      checks.firestoreWrite = { status: "OK" };
    } catch (err) {
      checks.firestoreWrite = { status: "ERROR", error: err.message };
    }

    // Test read
    try {
      const snap = await testDocRef.get();
      checks.firestoreRead = { status: "OK", docExists: snap.exists };
    } catch (err) {
      checks.firestoreRead = { status: "ERROR", error: err.message };
    }

    // Cleanup
    try {
      await testDocRef.delete();
    } catch (_) {}

    // Also test writing to actual users collection
    try {
      const usersRef = db.collection("users").doc("_diagnostic_test");
      await usersRef.set({ ts: new Date(), test: true });
      await usersRef.delete();
      checks.firestoreUsersWrite = { status: "OK" };
    } catch (err) {
      checks.firestoreUsersWrite = { status: "ERROR", error: err.message };
    }
  } else {
    checks.firestoreWrite = { status: "SKIPPED", reason: "Admin SDK not available" };
    checks.firestoreRead = { status: "SKIPPED", reason: "Admin SDK not available" };
  }

  // 4. Check what getAdminDb() actually returns
  try {
    const { getAdminDb } = await import("../../utils/firebaseAdmin");
    const db = getAdminDb();
    checks.getAdminDb = {
      returnsNull: db === null,
      type: db === null ? "null" : typeof db,
      hasCollection: db ? typeof db.collection === "function" : false,
      isAdminSdk: db && db.constructor?.name === "Firestore",
      isClientWrapper: db && !db.constructor?.name?.includes("Firestore") && typeof db.collection === "function",
    };
  } catch (err) {
    checks.getAdminDb = { status: "ERROR", error: err.message };
  }

  // Summary & recommendations
  checks.summary = [];
  if (checks.adminSdk.status !== "OK") {
    checks.summary.push("Admin SDK is NOT working. The system falls back to Client SDK which is subject to Firestore security rules.");
    checks.summary.push("Fix: Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY environment variables.");
  }
  if (checks.firestoreWrite?.status === "ERROR") {
    checks.summary.push(`Firestore write failed: ${checks.firestoreWrite.error}`);
    checks.summary.push("Fix: Deploy permissive Firestore rules OR fix Admin SDK credentials (Admin SDK bypasses rules).");
  }
  if (checks.summary.length === 0) {
    checks.summary.push("All checks passed. Firebase is configured correctly.");
  }

  return res.status(200).json(checks);
}
