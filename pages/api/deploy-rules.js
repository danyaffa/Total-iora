// FILE: /pages/api/deploy-rules.js
// Deploys Firestore security rules using the Firebase Rules REST API.
// Call GET /api/deploy-rules to deploy the rules defined below.

import { createSign } from "crypto";
import serviceAccount from "../../utils/serviceAccountKey.json";

const FIRESTORE_RULES = `
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow create: if true;
      allow update: if true;
      allow read:   if true;
      allow delete: if false;
    }
    match /reviews/{reviewId} {
      allow read:   if true;
      allow create: if true;
      allow update: if false;
      allow delete: if false;
    }
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
  const payload = Buffer.from(JSON.stringify({
    iss: clientEmail,
    sub: clientEmail,
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
    scope: "https://www.googleapis.com/auth/firebase https://www.googleapis.com/auth/cloud-platform",
  })).toString("base64url");

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
  throw new Error(`Token exchange failed: ${data.error} — ${data.error_description}`);
}

export default async function handler(req, res) {
  const projectId = serviceAccount.project_id;

  if (!projectId) {
    return res.status(500).json({ error: "FIREBASE_PROJECT_ID not set" });
  }

  try {
    const token = await getAccessToken();
    if (!token) {
      return res.status(500).json({
        error: "Could not get access token from bundled service account.",
        hasClientEmail: !!serviceAccount.client_email,
        hasPrivateKey: !!serviceAccount.private_key,
      });
    }

    // Step 1: Create a new ruleset
    const createResp = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${projectId}/rulesets`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          source: {
            files: [
              {
                name: "firestore.rules",
                content: FIRESTORE_RULES,
              },
            ],
          },
        }),
      }
    );

    if (!createResp.ok) {
      const err = await createResp.text();
      return res.status(500).json({ error: "Failed to create ruleset", status: createResp.status, detail: err });
    }

    const ruleset = await createResp.json();
    const rulesetName = ruleset.name; // e.g. "projects/auracode-d2a86/rulesets/xxxxx"

    // Step 2: Release the ruleset to cloud.firestore
    const releaseResp = await fetch(
      `https://firebaserules.googleapis.com/v1/projects/${projectId}/releases/cloud.firestore`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          release: {
            name: `projects/${projectId}/releases/cloud.firestore`,
            rulesetName,
          },
        }),
      }
    );

    if (!releaseResp.ok) {
      const err = await releaseResp.text();
      return res.status(500).json({ error: "Failed to release ruleset", status: releaseResp.status, detail: err });
    }

    const release = await releaseResp.json();

    return res.status(200).json({
      ok: true,
      message: "Firestore rules deployed successfully!",
      rulesetName,
      release: release.name,
      rules: FIRESTORE_RULES,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message, stack: err.stack });
  }
}
