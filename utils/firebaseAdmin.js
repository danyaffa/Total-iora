// FILE: /utils/firebaseAdmin.js

import * as admin from "firebase-admin";

const projectId = (process.env.FIREBASE_PROJECT_ID || "").trim();
const clientEmail = (process.env.FIREBASE_CLIENT_EMAIL || "").trim();
let privateKey = process.env.FIREBASE_PRIVATE_KEY || "";

// Trim whitespace
privateKey = privateKey.trim();

// Remove accidental wrapping quotes (common in Vercel)
if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
  privateKey = privateKey.slice(1, -1);
}
if (privateKey.startsWith("'") && privateKey.endsWith("'")) {
  privateKey = privateKey.slice(1, -1);
}

// Convert escaped "\n" into real newlines
privateKey = privateKey.replace(/\\n/g, "\n");

if (!admin.apps.length) {
  if (!projectId || !clientEmail || !privateKey) {
    console.warn(
      "⚠ Firebase Admin missing credentials.",
      "projectId:", projectId ? "SET" : "MISSING",
      "clientEmail:", clientEmail ? "SET" : "MISSING",
      "privateKey:", privateKey ? `SET (${privateKey.length} chars)` : "MISSING"
    );
  } else {
    try {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
    } catch (err) {
      console.error("Firebase Admin initialization error:", err);
    }
  }
}

export const adminApp = admin.apps.length ? admin.app() : null;
export const adminDb = adminApp ? admin.firestore() : null;
export const adminAuth = adminApp ? admin.auth() : null;
