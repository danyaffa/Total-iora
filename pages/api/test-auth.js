// FILE: /pages/api/test-auth.js
// Diagnostic endpoint — visit /api/test-auth in the browser to see what's going on.
// Also supports POST with { email } to check a specific user's Firestore document.

import { getAdminDb } from "../../utils/firebaseAdmin";

export default async function handler(req, res) {
  const adminDb = getAdminDb();
  const results = {
    timestamp: new Date().toISOString(),
    env: {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "SET" : "MISSING",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL
        ? process.env.FIREBASE_CLIENT_EMAIL.substring(0, 20) + "..."
        : "MISSING",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY
        ? `SET (${process.env.FIREBASE_PRIVATE_KEY.length} chars, starts: ${process.env.FIREBASE_PRIVATE_KEY.substring(0, 30)}...)`
        : "MISSING",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "MISSING",
    },
    adminDb: adminDb ? "INITIALIZED" : "NULL — Firebase Admin failed to initialize",
  };

  // If adminDb is available, try to list users in Firestore
  if (adminDb) {
    try {
      const usersSnap = await adminDb.collection("users").limit(10).get();
      results.firestore = {
        status: "CONNECTED",
        userCount: usersSnap.size,
        userEmails: usersSnap.docs.map((d) => d.id),
      };

      // If POST with an email, look up that specific user
      if (req.method === "POST" && req.body?.email) {
        const emailNorm = String(req.body.email).trim().toLowerCase();
        const doc = await adminDb.collection("users").doc(emailNorm).get();
        if (doc.exists) {
          const data = doc.data() || {};
          results.lookupUser = {
            email: emailNorm,
            found: true,
            fields: Object.keys(data),
            hasPasswordHash: Boolean(data.password_hash),
            passwordHashPrefix: data.password_hash
              ? data.password_hash.substring(0, 15) + "..."
              : "N/A",
            name: data.name || "N/A",
            createdAt: data.createdAt?.toDate
              ? data.createdAt.toDate().toISOString()
              : String(data.createdAt || "N/A"),
            isPaid: data.isPaid,
            trialEnd: data.trialEnd?.toDate
              ? data.trialEnd.toDate().toISOString()
              : String(data.trialEnd || "N/A"),
          };
        } else {
          results.lookupUser = { email: emailNorm, found: false };
        }
      }
    } catch (e) {
      results.firestore = {
        status: "ERROR",
        message: e.message,
      };
    }
  }

  return res.status(200).json(results);
}
