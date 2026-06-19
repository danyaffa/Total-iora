// FILE: /lib/adminAuth.js
// Centralised admin authorisation helpers.
//
// An admin request is one that either:
//   1. Presents a valid x-admin-token header matching ADMIN_API_TOKEN
//      (server-to-server / scripts), OR
//   2. Carries a valid HMAC-signed `ac_auth` cookie (minted only by the
//      server at email/password login) whose email is in OWNER_EMAILS.
//
// NOTE: we deliberately do NOT trust the plaintext `ac_email` cookie or the
// constant `ac_session=1` cookie for admin authorization — both are forgeable
// by a client and were a privilege-escalation vector. The owner-session path
// now requires the tamper-proof `ac_auth` token (see lib/sessionToken.js).

import { logger } from "./logger";
import { verifyAuth } from "./sessionToken";

function ownerEmails() {
  const raw = process.env.OWNER_EMAILS || "";
  return raw
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/**
 * Checks if a request should be treated as an admin. Returns an object
 * describing the result — never throws, never logs secrets.
 */
export function isAdminRequest(req) {
  const token = process.env.ADMIN_API_TOKEN || "";
  const header = req?.headers?.["x-admin-token"] || "";
  if (token && header && safeEqual(String(header), token)) {
    return { ok: true, via: "token", actor: "admin-token" };
  }

  // Owner session: trust ONLY the HMAC-signed identity token, never the
  // raw, client-writable ac_email cookie.
  const verified = verifyAuth(req?.cookies?.ac_auth);
  if (verified.ok && verified.email) {
    const owners = ownerEmails();
    if (owners.includes(verified.email)) {
      return { ok: true, via: "owner-session", actor: verified.email };
    }
  }

  return { ok: false, via: "none", actor: "anonymous" };
}

/**
 * Express-style assertion. Sends a 401 and returns false if not admin.
 * Callers should `if (!requireAdmin(req, res)) return;`
 */
export function requireAdmin(req, res) {
  const result = isAdminRequest(req);
  if (!result.ok) {
    logger.warn("admin.denied", {
      route: req?.url,
      ip: req?.headers?.["x-forwarded-for"] || req?.socket?.remoteAddress,
    });
    res.status(401).json({ error: "unauthorized" });
    return false;
  }
  return true;
}
