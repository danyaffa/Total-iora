// FILE: /pages/api/env-check.js
// Public diagnostic endpoint. Reports WHICH environment variables the
// running serverless function can see — only presence/length, never
// values. Safe to expose because every value is redacted and the set of
// vars is public in the source already.
//
// Purpose: when login fails with "missing_fields" it's usually because
// Vercel env vars were set AFTER the last deployment, or scoped to the
// wrong environment (Production / Preview / Development). This endpoint
// lets you verify, in one browser request, whether the vars are actually
// reaching the runtime — no admin token required.
//
// Visit: /api/env-check
import { envReport } from "../../lib/env";
import { withApi } from "../../lib/apiSecurity";

// Only report on the vars that matter for login. We intentionally do NOT
// iterate over all env vars — this is a diagnostic for the auth path,
// not a general env dump.
const LOGIN_CRITICAL_VARS = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
];

async function handler(req, res) {
  const full = envReport();
  const loginVars = {};
  const missing = [];
  for (const name of LOGIN_CRITICAL_VARS) {
    const entry = full[name] || { present: false, length: 0 };
    loginVars[name] = {
      present: entry.present,
      length: entry.length,
    };
    if (!entry.present) missing.push(name);
  }

  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";

  return res.status(200).json({
    timestamp: new Date().toISOString(),
    runtime: {
      NODE_ENV: process.env.NODE_ENV || null,
      VERCEL_ENV: process.env.VERCEL_ENV || null,
      VERCEL_REGION: process.env.VERCEL_REGION || null,
      VERCEL_GIT_COMMIT_SHA:
        (process.env.VERCEL_GIT_COMMIT_SHA || "").slice(0, 7) || null,
      VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF || null,
    },
    loginVars,
    missing,
    ok: missing.length === 0,
    hint:
      missing.length === 0
        ? "All login env vars are present in this runtime."
        : "Missing env vars at runtime. In Vercel: Project Settings → Environment Variables → verify each missing var is set AND has the environment (Production/Preview/Development) that matches 'runtime.VERCEL_ENV' above ticked. Then REDEPLOY — Vercel does NOT push env var changes to existing deployments automatically.",
  });
}

export default withApi(handler, {
  name: "api.env-check",
  methods: ["GET"],
  rate: { max: 30, windowMs: 60_000 },
});
