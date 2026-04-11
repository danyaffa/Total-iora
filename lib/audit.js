// FILE: /lib/audit.js
// Audit trail for admin and other privileged actions.
// Writes to the Firestore `audit_logs` collection via the Admin SDK (or
// REST / Client SDK fallback via getAdminDb). Never blocks the primary
// request — failures are logged but swallowed so audit bugs can't take
// down the app.

import { getAdminDb } from "../utils/firebaseAdmin";
import { logger } from "./logger";

/**
 * Writes an audit record describing a privileged action.
 *
 * @param {object} entry
 * @param {string} entry.action       short verb, e.g. "admin.mark_paid"
 * @param {string} [entry.actor]      actor identifier (email or userId)
 * @param {string} [entry.target]     target identifier (email, docId, ...)
 * @param {string} [entry.ip]         request ip (derived upstream)
 * @param {string} [entry.ua]         user agent
 * @param {string} [entry.route]      API route
 * @param {"success"|"failure"} [entry.result="success"]
 * @param {object} [entry.meta]       extra metadata (redacted)
 */
export async function writeAudit(entry) {
  const rec = {
    action: String(entry?.action || "unknown"),
    actor: String(entry?.actor || "anonymous"),
    target: entry?.target ? String(entry.target) : "",
    ip: entry?.ip ? String(entry.ip) : "",
    ua: entry?.ua ? String(entry.ua).slice(0, 256) : "",
    route: entry?.route ? String(entry.route) : "",
    result: entry?.result === "failure" ? "failure" : "success",
    meta: sanitizeMeta(entry?.meta),
    createdAt: new Date(),
  };

  try {
    const db = getAdminDb();
    if (!db) {
      logger.warn("audit.write.skip", {
        reason: "no_db",
        action: rec.action,
      });
      return false;
    }
    await db.collection("audit_logs").add(rec);
    logger.info("audit.write", {
      action: rec.action,
      actor: rec.actor,
      target: rec.target,
      result: rec.result,
    });
    return true;
  } catch (err) {
    logger.error("audit.write.error", {
      action: rec.action,
      error: String(err?.message || err),
    });
    return false;
  }
}

/** Remove obviously-sensitive fields from meta before writing. */
function sanitizeMeta(meta) {
  if (!meta || typeof meta !== "object") return {};
  const out = {};
  const BLOCK = /(api[_-]?key|secret|password|private[_-]?key|token|authorization|cookie)/i;
  for (const [k, v] of Object.entries(meta)) {
    if (BLOCK.test(k)) {
      out[k] = "[redacted]";
      continue;
    }
    if (v == null) {
      out[k] = null;
    } else if (typeof v === "string") {
      out[k] = v.length > 512 ? v.slice(0, 512) + "…" : v;
    } else if (typeof v === "number" || typeof v === "boolean") {
      out[k] = v;
    } else {
      try {
        out[k] = JSON.stringify(v).slice(0, 512);
      } catch {
        out[k] = "[unserialisable]";
      }
    }
  }
  return out;
}
