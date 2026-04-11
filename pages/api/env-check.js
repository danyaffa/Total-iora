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
    // Also report typeof so we can distinguish undefined from empty string.
    const raw = process.env[name];
    loginVars[name] = {
      present: entry.present,
      length: entry.length,
      typeofRaw: typeof raw,
      rawIsEmpty: raw === "",
    };
    if (!entry.present) missing.push(name);
  }

  // List EVERY env var name in process.env whose name matches /FIREBASE/i
  // or starts with NEXT_PUBLIC_FIREBASE. Names only — never values. This
  // catches:
  //   - typos ("FIREBASE_PROJECTID" vs "FIREBASE_PROJECT_ID")
  //   - duplicate entries with different casings
  //   - vars that exist with empty values (they still show up in the list)
  const allFirebaseNames = Object.keys(process.env)
    .filter((k) => /firebase/i.test(k))
    .sort();

  // Also list all env vars whose VALUE is an empty string. This catches
  // the "Edit-then-Save-without-retyping clears the value" Vercel quirk,
  // which is the most likely cause when env-check reports present:false
  // but the dashboard shows the variable exists.
  const emptyValueNames = Object.keys(process.env)
    .filter((k) => process.env[k] === "")
    .sort();

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
      processEnvKeyCount: Object.keys(process.env).length,
    },
    loginVars,
    missing,
    allFirebaseNamesInProcessEnv: allFirebaseNames,
    emptyValueNames,
    ok: missing.length === 0,
    hint:
      missing.length === 0
        ? "All login env vars are present in this runtime."
        : "Missing env vars at runtime. Check `allFirebaseNamesInProcessEnv` below — if the three server-side FIREBASE_* names appear there at all, they exist but their values are empty strings (see `emptyValueNames`). If they DON'T appear there, they're scoped to a different environment (Preview/Development instead of Production) or they were never saved. The Vercel 'Edit → Save without retyping the value' quirk can clear values without warning — delete each affected var and recreate it from scratch.",
  });
}

export default withApi(handler, {
  name: "api.env-check",
  methods: ["GET"],
  rate: { max: 30, windowMs: 60_000 },
});

