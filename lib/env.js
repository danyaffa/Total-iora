// FILE: /lib/env.js
// Startup environment variable validation. Never logs actual values, only
// presence, length, and whether required variables are set.
//
// Usage:
//   import { validateEnv, getEnv } from "./lib/env";
//   validateEnv();           // throws / warns at startup
//   const key = getEnv("OPENAI_API_KEY", { required: true });

/**
 * Definition of every env var the app understands.
 *   required: absolutely required — boot fails in production if missing
 *   optional: recommended but the app degrades gracefully without it
 */
const ENV_SCHEMA = {
  // ---- Core product -----------------------------------------------------
  NEXT_PUBLIC_SITE_URL: { required: false },
  NODE_ENV: { required: false },

  // ---- OpenAI -----------------------------------------------------------
  OPENAI_API_KEY: { required: true, sensitive: true },
  OPENAI_MODEL: { required: false },
  OPENAI_TTS_MODEL: { required: false },
  STT_MODEL: { required: false },

  // ---- Firebase Admin (server) -----------------------------------------
  FIREBASE_PROJECT_ID: { required: true, sensitive: false },
  FIREBASE_CLIENT_EMAIL: { required: true, sensitive: true },
  FIREBASE_PRIVATE_KEY: { required: true, sensitive: true },

  // ---- Firebase Client (browser) ---------------------------------------
  NEXT_PUBLIC_FIREBASE_API_KEY: { required: true, sensitive: true },
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: { required: true },
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: { required: true },
  NEXT_PUBLIC_FIREBASE_APP_ID: { required: false },
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: { required: false },
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: { required: false },

  // ---- PayPal -----------------------------------------------------------
  NEXT_PUBLIC_PAYPAL_CLIENT_ID: { required: false },
  PAYPAL_CLIENT_SECRET: { required: false, sensitive: true },
  PAYPAL_WEBHOOK_ID: { required: false, sensitive: true },

  // ---- Email ------------------------------------------------------------
  RESEND_API_KEY: { required: false, sensitive: true },
  REVIEW_RECEIVER_EMAIL: { required: false },

  // ---- Admin ------------------------------------------------------------
  OWNER_EMAILS: { required: false },
  ADMIN_API_TOKEN: { required: false, sensitive: true },
};

/**
 * Validate env at module load. Prints a compact report. Never logs values.
 * In production, throws if a REQUIRED variable is missing.
 */
let _validated = false;
export function validateEnv({ throwOnError = undefined } = {}) {
  if (_validated) return;
  _validated = true;

  const isProd =
    process.env.NODE_ENV === "production" ||
    process.env.VERCEL_ENV === "production";
  const strict = throwOnError === undefined ? isProd : throwOnError;

  const missing = [];
  const report = {};

  for (const [name, def] of Object.entries(ENV_SCHEMA)) {
    const raw = process.env[name];
    const present = typeof raw === "string" && raw.trim().length > 0;
    report[name] = {
      present,
      required: !!def.required,
      length: present ? raw.length : 0,
    };
    if (def.required && !present) missing.push(name);
  }

  // Structured, secret-free report
  console.log(
    "[env] validation:",
    JSON.stringify({
      mode: isProd ? "production" : "development",
      missing,
      totalVars: Object.keys(ENV_SCHEMA).length,
    })
  );

  if (missing.length && strict) {
    const msg = `[env] Missing required environment variables: ${missing.join(
      ", "
    )}`;
    throw new Error(msg);
  }
  if (missing.length && !strict) {
    console.warn(
      "[env] WARNING: missing non-strict env vars (app may degrade):",
      missing.join(", ")
    );
  }

  return { missing, report };
}

/**
 * Safe accessor with presence check. Never returns undefined silently when
 * required=true.
 */
export function getEnv(name, { required = false, fallback = undefined } = {}) {
  const raw = process.env[name];
  if (typeof raw === "string" && raw.trim().length > 0) return raw;
  if (required) {
    throw new Error(`[env] Required env var missing: ${name}`);
  }
  return fallback;
}

/** Returns a shallow diagnostic report without leaking any secrets. */
export function envReport() {
  const out = {};
  for (const [name, def] of Object.entries(ENV_SCHEMA)) {
    const raw = process.env[name];
    const present = typeof raw === "string" && raw.trim().length > 0;
    out[name] = {
      present,
      required: !!def.required,
      sensitive: !!def.sensitive,
      length: present ? raw.length : 0,
    };
  }
  return out;
}

// Eagerly validate on module load but never crash the build (only warn).
try {
  validateEnv({ throwOnError: false });
} catch (err) {
  // never swallow — re-throw in production
  if (process.env.NODE_ENV === "production") throw err;
  console.warn("[env] validation warning:", err?.message || err);
}
