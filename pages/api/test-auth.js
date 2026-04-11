// FILE: /pages/api/test-auth.js
// ADMIN-ONLY: Firebase/Firestore connectivity check. Does NOT expose user
// records, password hashes, or identifying fields. Requires x-admin-token.

import { getAdminDb } from "../../utils/firebaseAdmin";
import { withApi } from "../../lib/apiSecurity";
import { logger } from "../../lib/logger";

const log = logger.child({ fn: "api.test-auth" });

async function handler(req, res) {
  const adminDb = getAdminDb();
  const results = {
    timestamp: new Date().toISOString(),
    env: {
      FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID ? "set" : "missing",
      FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL ? "set" : "missing",
      FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY ? "set" : "missing",
      NEXT_PUBLIC_FIREBASE_PROJECT_ID: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
        ? "set"
        : "missing",
    },
    adminDb: adminDb ? "initialized" : "null",
  };

  if (adminDb) {
    try {
      const snap = await adminDb.collection("users").limit(1).get();
      results.firestore = {
        status: "connected",
        reachable: true,
        probeSize: snap.size,
      };
    } catch (err) {
      log.error("firestore_probe_failed", { error: String(err?.message || err) });
      results.firestore = { status: "error" };
    }
  }

  return res.status(200).json(results);
}

export default withApi(handler, {
  name: "api.test-auth",
  methods: ["GET"],
  adminOnly: true,
  audit: true,
  auditAction: "admin.test_auth",
  rate: { max: 20, windowMs: 60_000 },
});
