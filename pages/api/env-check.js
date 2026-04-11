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

// Only report on the vars that matter for the user-visible features.
// Login needs Firebase admin + client. STT/TTS/chat/DNA all need OpenAI.
// We intentionally do NOT iterate over all env vars — this is a focused
// diagnostic, not a general env dump.
const LOGIN_CRITICAL_VARS = [
  "FIREBASE_PROJECT_ID",
  "FIREBASE_CLIENT_EMAIL",
  "FIREBASE_PRIVATE_KEY",
  "NEXT_PUBLIC_FIREBASE_API_KEY",
  "NEXT_PUBLIC_FIREBASE_PROJECT_ID",
];

// Vars required for AI features (recording→text, oracle answers,
// voice playback, DNA generation). If any of these are missing, the
// corresponding feature silently fails with a 503 that the UI renders
// as an empty result or a generic error.
const AI_CRITICAL_VARS = [
  "OPENAI_API_KEY",
];

function inspectVar(name, full) {
  const entry = full[name] || { present: false, length: 0 };
  const raw = process.env[name];
  return {
    present: entry.present,
    length: entry.length,
    typeofRaw: typeof raw,
    rawIsEmpty: raw === "",
  };
}

async function handler(req, res) {
  const full = envReport();
  const loginVars = {};
  const aiVars = {};
  const missing = [];
  for (const name of LOGIN_CRITICAL_VARS) {
    loginVars[name] = inspectVar(name, full);
    if (!loginVars[name].present) missing.push(name);
  }
  for (const name of AI_CRITICAL_VARS) {
    aiVars[name] = inspectVar(name, full);
    if (!aiVars[name].present) missing.push(name);
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
    aiVars,
    missing,
    allFirebaseNamesInProcessEnv: allFirebaseNames,
    emptyValueNames,
    ok: missing.length === 0,
    hint:
      missing.length === 0
        ? "All critical env vars (login + AI features) are present in this runtime."
        : "Missing env vars at runtime. If OPENAI_API_KEY is missing, STT (recording→text), TTS (voice answers), oracle chat, and DNA generation will all silently return 503. If Firebase server vars are missing, login breaks. Check `allFirebaseNamesInProcessEnv` and `emptyValueNames` to distinguish 'never set' from 'set but empty'. Add missing vars in the Vercel project that serves the domain, tick all three environments, then REDEPLOY — env var changes do not apply to existing deployments.",
  });
}

export default withApi(handler, {
  name: "api.env-check",
  methods: ["GET"],
  rate: { max: 30, windowMs: 60_000 },
});

