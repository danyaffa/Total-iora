// FILE: /lib/sessionToken.js
// HMAC-signed identity token for privileged (admin / owner) authorization.
//
// WHY: The general "logged-in" state is a constant cookie (ac_session=1) that
// can be set client-side by several login paths (server email login, Firebase
// Google login, register, unlock). That is fine for gating ordinary content,
// but it must NOT be trusted for ADMIN authorization, because both ac_session
// and the plaintext ac_email cookie are forgeable by a client.
//
// This module mints a tamper-proof `ac_auth` cookie at *server* login that
// binds the authenticated email to an HMAC signature. Admin checks verify this
// signature instead of trusting the raw ac_email cookie — so an attacker can no
// longer escalate to admin just by crafting cookies.
//
// FAIL-CLOSED: if no server secret is configured, signing returns null and
// verification returns { ok: false }. Admin-by-session is then simply
// unavailable (the x-admin-token path still works for server-to-server use).

import { createHmac, timingSafeEqual } from "crypto";

// Max token age — mirrors the 30-day session cookie lifetime.
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

/**
 * Resolve the signing secret. Prefer an explicit SESSION_SECRET, then fall
 * back to other server-only secrets so the feature works out of the box on
 * existing deployments without a new env var. Never exposed to the client.
 */
function getSecret() {
  const candidates = [
    process.env.SESSION_SECRET,
    process.env.ADMIN_API_TOKEN,
    process.env.FIREBASE_PRIVATE_KEY,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().length >= 16) return c;
  }
  return null;
}

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

function hmac(secret, data) {
  return createHmac("sha256", secret).update(data).digest("hex");
}

function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) {
    return false;
  }
  try {
    return timingSafeEqual(Buffer.from(a, "hex"), Buffer.from(b, "hex"));
  } catch {
    return false;
  }
}

/**
 * Sign an identity token for the given email.
 * @returns {string|null} `<payload>.<sig>` or null if no secret is configured.
 */
export function signAuth(email) {
  const secret = getSecret();
  const normalized = String(email || "").trim().toLowerCase();
  if (!secret || !normalized) return null;
  const payload = b64url(JSON.stringify({ e: normalized, t: Date.now() }));
  return `${payload}.${hmac(secret, payload)}`;
}

/**
 * Verify an identity token.
 * @returns {{ ok: boolean, email: string|null }}
 */
export function verifyAuth(token) {
  const secret = getSecret();
  if (!secret || typeof token !== "string" || !token.includes(".")) {
    return { ok: false, email: null };
  }
  const idx = token.lastIndexOf(".");
  const payload = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  if (!safeEqualHex(sig, hmac(secret, payload))) {
    return { ok: false, email: null };
  }
  let data;
  try {
    data = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return { ok: false, email: null };
  }
  const email = String(data?.e || "").trim().toLowerCase();
  const issuedAt = Number(data?.t || 0);
  if (!email || !issuedAt || Date.now() - issuedAt > MAX_AGE_MS) {
    return { ok: false, email: null };
  }
  return { ok: true, email };
}

export const AUTH_COOKIE = "ac_auth";
