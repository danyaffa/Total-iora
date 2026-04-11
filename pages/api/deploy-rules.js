// FILE: /pages/api/deploy-rules.js
// ADMIN-ONLY: Deploys Firestore security rules using the Firebase Rules
// REST API. Requires x-admin-token header matching ADMIN_API_TOKEN.

import { createSign } from "crypto";
import { withApi } from "../../lib/apiSecurity";
import { writeAudit } from "../../lib/audit";
import { logger } from "../../lib/logger";

const log = logger.child({ fn: "api.deploy-rules" });

const serviceAccount = {
  project_id: process.env.FIREBASE_PROJECT_ID || "",
  client_email: process.env.FIREBASE_CLIENT_EMAIL || "",
  private_key: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
};

const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: all writes go through the Admin SDK; the public SDK is denied.
    match /users/{userId} {
      allow read, write: if false;
    }

    // Reviews: anyone may submit a review but only the backend can list/modify.
    match /reviews/{reviewId} {
      allow read:   if false;
      allow create: if request.resource.data.rating is number
                    && request.resource.data.rating >= 1
                    && request.resource.data.rating <= 5
                    && request.resource.data.appName is string;
      allow update, delete: if false;
    }

    // Audit logs: write-only from the backend.
    match /audit_logs/{logId} {
      allow read, write: if false;
    }

    // Default deny for everything else.
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
`.trim();

async function getAccessToken() {
  const clientEmail = serviceAccount.client_email;
  const privateKey = serviceAccount.private_key;
  if (!clientEmail || !privateKey || !privateKey.includes("-----BEGIN")) {
    return null;
  }

  const now = Math.floor(Date.now() / 1000);
  const header = Buffer.from(JSON.stringify({ alg: "RS256", typ: "JWT" })).toString("base64url");
  const payload = Buffer.from(
    JSON.stringify({
      iss: clientEmail,
      sub: clientEmail,
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
      scope:
        "https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform",
    })
  ).toString("base64url");

  const signInput = `${header}.${payload}`;
  const sign = createSign("RSA-SHA256");
  sign.update(signInput);
  const signature = sign.sign(privateKey, "base64url");
  const jwt = `${signInput}.${signature}`;

  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });
  const data = await resp.json();
  if (data.access_token) return data.access_token;
  throw new Error("token_exchange_failed");
}

async function handler(req, res) {
  const projectId = serviceAccount.project_id;
  if (!projectId) {
    return res.status(503).json({ error: "service_unavailable" });
  }

  const token = await getAccessToken();
  if (!token) {
    log.error("no_access_token");
    return res.status(500).json({ error: "no_access_token" });
  }

  const createResp = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        source: { files: [{ name: "firestore.rules", content: FIRESTORE_RULES }] },
      }),
    }
  );
  if (!createResp.ok) {
    log.error("create_ruleset_failed", { status: createResp.status });
    return res.status(500).json({ error: "create_ruleset_failed" });
  }
  const ruleset = await createResp.json();
  const rulesetName = ruleset.name;

  const releaseResp = await fetch(
    `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
    {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        release: {
          name: `projects/${projectId}/releases/cloud.firestore`,
          rulesetName,
        },
      }),
    }
  );
  if (!releaseResp.ok) {
    log.error("release_ruleset_failed", { status: releaseResp.status });
    return res.status(500).json({ error: "release_ruleset_failed" });
  }

  writeAudit({
    action: "admin.deploy_firestore_rules",
    actor: "admin-token",
    target: projectId,
    route: "api.deploy-rules",
    meta: { rulesetName },
  }).catch(() => {});

  log.info("deploy_rules.success", { rulesetName });
  return res.status(200).json({ ok: true, message: "rules_deployed" });
}

export default withApi(handler, {
  name: "api.deploy-rules",
  methods: ["POST"],
  adminOnly: true,
  rate: { max: 5, windowMs: 60_000 },
  audit: true,
  auditAction: "admin.deploy_firestore_rules",
});
