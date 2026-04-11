// FILE: /lib/apiSecurity.js
// Central API route wrapper. Every pages/api/** handler should be wrapped
// with withApi() — this gives us, uniformly:
//
//   * Method guard (only allowed verbs)
//   * Rate limiting (sliding window, per-identifier)
//   * Try/catch with structured error logging
//   * Safe JSON error responses (no stack leak in production)
//   * Baseline security headers
//   * Optional admin-only enforcement with audit logging
//
// Usage:
//
//   import { withApi } from "../../lib/apiSecurity";
//   export default withApi(
//     async (req, res) => { ... },
//     { name: "login", methods: ["POST"], rate: { max: 20, windowMs: 60_000 } }
//   );

import { logger } from "./logger";
import { enforceRateLimit } from "./rateLimit";
import { isAdminRequest } from "./adminAuth";
import { writeAudit } from "./audit";

const DEFAULT_SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "SAMEORIGIN",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(self), geolocation=()",
};

function applyHeaders(res, extra = {}) {
  for (const [k, v] of Object.entries({ ...DEFAULT_SECURITY_HEADERS, ...extra })) {
    try {
      res.setHeader(k, v);
    } catch {
      /* already sent */
    }
  }
}

function clientIp(req) {
  const xf = req?.headers?.["x-forwarded-for"];
  if (xf)
    return String(Array.isArray(xf) ? xf[0] : xf)
      .split(",")[0]
      .trim();
  return req?.socket?.remoteAddress || "unknown";
}

/**
 * Wrap a pages/api handler with the standard security stack.
 *
 * @param {Function} handler  async (req, res) => void
 * @param {object}   opts
 * @param {string}   opts.name                Logical name used for logs, audit, rate-limit key
 * @param {string[]} [opts.methods]           Allowed HTTP verbs (default: ["GET","POST"])
 * @param {object}   [opts.rate]              { max, windowMs } overrides per-route limits
 * @param {boolean}  [opts.adminOnly=false]   Require admin credentials, 401 otherwise
 * @param {boolean}  [opts.audit=false]       Write an audit_log entry on every call
 * @param {string}   [opts.auditAction]       Explicit audit action name (defaults to name)
 * @returns {Function} wrapped handler
 */
export function withApi(handler, opts = {}) {
  const {
    name = "api",
    methods = ["GET", "POST"],
    rate = { max: 60, windowMs: 60_000 },
    adminOnly = false,
    audit = false,
    auditAction,
    cors = false,
  } = opts;

  const routeLogger = logger.child({ route: name });

  return async function wrapped(req, res) {
    applyHeaders(res);

    if (cors) {
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Access-Control-Allow-Headers", "Content-Type");
      res.setHeader("Access-Control-Allow-Methods", methods.join(","));
      if (req.method === "OPTIONS") {
        res.status(204).end();
        return;
      }
    }

    // --- Method check ---------------------------------------------------
    if (!methods.includes(req.method || "")) {
      res.setHeader("Allow", methods.join(", "));
      res.status(405).json({ error: "method_not_allowed" });
      return;
    }

    // --- Rate limit -----------------------------------------------------
    try {
      const rl = enforceRateLimit(req, name, rate);
      res.setHeader("X-RateLimit-Limit", String(rate.max || 60));
      res.setHeader("X-RateLimit-Remaining", String(rl.remaining));
      if (!rl.ok) {
        res.setHeader("Retry-After", String(Math.ceil(rl.resetMs / 1000)));
        routeLogger.warn("rate_limit_exceeded", {
          ip: clientIp(req),
          method: req.method,
        });
        res.status(429).json({ error: "rate_limited" });
        return;
      }
    } catch (rlErr) {
      // never fail-open silently; log and continue (degrade gracefully)
      routeLogger.error("rate_limit_error", { error: String(rlErr?.message || rlErr) });
    }

    // --- Admin gate -----------------------------------------------------
    let adminInfo = null;
    if (adminOnly) {
      adminInfo = isAdminRequest(req);
      if (!adminInfo.ok) {
        routeLogger.warn("admin.denied", {
          ip: clientIp(req),
          method: req.method,
        });
        // audit the denial
        writeAudit({
          action: auditAction || `${name}.denied`,
          actor: adminInfo.actor,
          ip: clientIp(req),
          ua: req.headers["user-agent"] || "",
          route: name,
          result: "failure",
          meta: { reason: "not_admin" },
        }).catch(() => {});
        res.status(401).json({ error: "unauthorized" });
        return;
      }
    }

    // --- Handler with try/catch ----------------------------------------
    const start = Date.now();
    try {
      await handler(req, res);
      const ms = Date.now() - start;
      routeLogger.info("ok", {
        method: req.method,
        status: res.statusCode,
        ms,
      });

      if (audit) {
        writeAudit({
          action: auditAction || `${name}`,
          actor: adminInfo?.actor || String(req.cookies?.ac_email || "anonymous"),
          ip: clientIp(req),
          ua: req.headers["user-agent"] || "",
          route: name,
          result: res.statusCode >= 400 ? "failure" : "success",
          meta: { method: req.method, status: res.statusCode, ms },
        }).catch(() => {});
      }
    } catch (err) {
      const ms = Date.now() - start;
      routeLogger.error("handler_error", {
        method: req.method,
        ms,
        error: String(err?.message || err),
      });
      // Audit the failure if the route is privileged
      if (audit || adminOnly) {
        writeAudit({
          action: auditAction || `${name}.error`,
          actor: adminInfo?.actor || String(req.cookies?.ac_email || "anonymous"),
          ip: clientIp(req),
          ua: req.headers["user-agent"] || "",
          route: name,
          result: "failure",
          meta: { error: String(err?.message || err).slice(0, 256) },
        }).catch(() => {});
      }
      if (!res.headersSent) {
        const isProd =
          process.env.NODE_ENV === "production" ||
          process.env.VERCEL_ENV === "production";
        res.status(500).json({
          error: "server_error",
          ...(isProd ? {} : { detail: String(err?.message || err) }),
        });
      }
    }
  };
}

export { clientIp };
