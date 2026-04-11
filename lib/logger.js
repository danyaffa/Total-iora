// FILE: /lib/logger.js
// Structured JSON logger with context. Never logs secrets by rule —
// callers should pass opaque identifiers only. A redactor scrubs obvious
// secret keys if they slip in.

const SECRET_KEY_RE =
  /(api[_-]?key|secret|password|private[_-]?key|token|authorization|auth[_-]?token|cookie)/i;

function redact(value, depth = 0) {
  if (value == null) return value;
  if (depth > 4) return "[depth-limit]";
  if (typeof value === "string") {
    // truncate very long strings
    return value.length > 2000 ? value.slice(0, 2000) + "…[truncated]" : value;
  }
  if (Array.isArray(value)) {
    return value.slice(0, 50).map((v) => redact(v, depth + 1));
  }
  if (typeof value === "object") {
    const out = {};
    for (const [k, v] of Object.entries(value)) {
      if (SECRET_KEY_RE.test(k)) {
        out[k] = "[redacted]";
      } else {
        out[k] = redact(v, depth + 1);
      }
    }
    return out;
  }
  return value;
}

function emit(level, msg, ctx) {
  const rec = {
    ts: new Date().toISOString(),
    level,
    msg: String(msg || ""),
    ...(ctx ? { ctx: redact(ctx) } : {}),
  };
  const line = JSON.stringify(rec);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (msg, ctx) => emit("info", msg, ctx),
  warn: (msg, ctx) => emit("warn", msg, ctx),
  error: (msg, ctx) => emit("error", msg, ctx),
  debug: (msg, ctx) => {
    if (process.env.NODE_ENV !== "production") emit("debug", msg, ctx);
  },
  /**
   * Creates a child logger bound to a persistent context (e.g. function
   * name, request id). All downstream logs include that context.
   */
  child(bound) {
    return {
      info: (msg, ctx) => emit("info", msg, { ...bound, ...(ctx || {}) }),
      warn: (msg, ctx) => emit("warn", msg, { ...bound, ...(ctx || {}) }),
      error: (msg, ctx) => emit("error", msg, { ...bound, ...(ctx || {}) }),
      debug: (msg, ctx) => {
        if (process.env.NODE_ENV !== "production")
          emit("debug", msg, { ...bound, ...(ctx || {}) });
      },
    };
  },
};

export default logger;
