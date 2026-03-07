// FILE: /utils/firebaseAdmin.js

import * as admin from "firebase-admin";

function getPrivateKey() {
  let pk = process.env.FIREBASE_PRIVATE_KEY || "";
  pk = pk.trim();
  if (pk.startsWith('"') && pk.endsWith('"')) pk = pk.slice(1, -1);
  if (pk.startsWith("'") && pk.endsWith("'")) pk = pk.slice(1, -1);
  pk = pk.replace(/\\n/g, "\n");
  return pk;
}

function ensureInitialized() {
  if (admin.apps.length) return true;

  const projectId = (
    process.env.FIREBASE_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    ""
  ).trim();
  const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();
  const privateKey = getPrivateKey();

  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "Firebase Admin missing credentials:",
      "projectId:", projectId ? "SET" : "MISSING",
      "clientEmail:", clientEmail ? "SET" : "MISSING",
      "privateKey:", privateKey ? `SET (${privateKey.length} chars)` : "MISSING"
    );
    return false;
  }

  try {
    admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
    return true;
  } catch (err) {
    console.error("Firebase Admin initialization error:", err.message || err);
    return false;
  }
}

/** @returns {admin.firestore.Firestore | null} */
export function getAdminDb() {
  return ensureInitialized() ? admin.firestore() : null;
}

/** @returns {admin.auth.Auth | null} */
export function getAdminAuth() {
  return ensureInitialized() ? admin.auth() : null;
}

// Legacy named exports — try init now, but callers should prefer getAdminDb()
ensureInitialized();
export const adminApp = admin.apps.length ? admin.app() : null;
export const adminDb = adminApp ? admin.firestore() : null;
export const adminAuth = adminApp ? admin.auth() : null;
