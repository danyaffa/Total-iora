// FILE: /lib/adminAuth.js
// Centralised admin authorisation helpers.
//
// An admin request is one that either:
//   1. Presents a valid x-admin-token header matching ADMIN_API_TOKEN
//      (server-to-server / scripts), OR
//   2. Is authenticated (ac_session=1) AND the cookie ac_email (set at
//      login) is in OWNER_EMAILS.

import { logger } from "./logger";

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

  const hasSession = req?.cookies?.ac_session === "1";
  const email = String(req?.cookies?.ac_email || "").trim().toLowerCase();
  const owners = ownerEmails();
  if (hasSession && email && owners.includes(email)) {
    return { ok: true, via: "owner-session", actor: email };
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
