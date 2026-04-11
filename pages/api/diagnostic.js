// FILE: /pages/api/diagnostic.js
// ADMIN-ONLY: Returns a sanitised Firebase configuration report.
// Requires x-admin-token header matching ADMIN_API_TOKEN. Never leaks
// env values, only presence / length / structure hints.

import * as admin from "firebase-admin";
import { withApi } from "../../lib/apiSecurity";
import { envReport } from "../../lib/env";
import { logger } from "../../lib/logger";

const log = logger.child({ fn: "api.diagnostic" });

async function handler(req, res) {
  const checks = {
    timestamp: new Date().toISOString(),
    env: envReport(),
    adminSdk: { status: "unknown" },
    firestoreWrite: { status: "unknown" },
    firestoreRead: { status: "unknown" },
  };

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
    checks.adminSdk = { status: "missing_credentials" };
  } else {
    try {
      if (!admin.apps.length) {
        admin.initializeApp({
          credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
        });
      }
      checks.adminSdk = { status: "ok", appCount: admin.apps.length };
    } catch (err) {
      checks.adminSdk = { status: "init_error" };
      log.error("admin_init_failed", { error: String(err?.message || err) });
    }
  }

  if (checks.adminSdk.status === "ok" || admin.apps.length > 0) {
    const db = admin.firestore();
    const ref = db.collection("_diagnostic").doc("test");
    try {
      await ref.set({ ts: new Date(), test: true });
      checks.firestoreWrite = { status: "ok" };
    } catch (err) {
      checks.firestoreWrite = { status: "error" };
      log.error("firestore_write_failed", { error: String(err?.message || err) });
    }
    try {
      const snap = await ref.get();
      checks.firestoreRead = { status: "ok", docExists: snap.exists };
    } catch (err) {
      checks.firestoreRead = { status: "error" };
      log.error("firestore_read_failed", { error: String(err?.message || err) });
    }
    try {
      await ref.delete();
    } catch {
      /* best effort */
    }
  }

  return res.status(200).json(checks);
}

export default withApi(handler, {
  name: "api.diagnostic",
  methods: ["GET"],
  adminOnly: true,
  audit: true,
  auditAction: "admin.diagnostic",
  rate: { max: 20, windowMs: 60_000 },
});
