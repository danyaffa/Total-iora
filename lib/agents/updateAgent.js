// FILE: /lib/agents/updateAgent.js
// "Keep the app improving" agent. This is intentionally conservative:
// it reports what's stale (missing env vars, old ruleset status, upcoming
// deprecations it knows about) but does NOT make destructive changes
// without an explicit trigger. Pairs with selfHeal for safe auto-fixes.

import { envReport } from "../env";
import { logger } from "../logger";
import { writeAudit } from "../audit";

const log = logger.child({ agent: "updateAgent" });

export async function runUpdateCheck() {
  const start = Date.now();
  const env = envReport();
  const warnings = [];
  const suggestions = [];

  if (!env.PAYPAL_WEBHOOK_ID?.present) {
    warnings.push("PAYPAL_WEBHOOK_ID env var missing — PayPal webhooks will fail verification.");
    suggestions.push("Set PAYPAL_WEBHOOK_ID in your deployment environment.");
  }
  if (!env.ADMIN_API_TOKEN?.present) {
    warnings.push("ADMIN_API_TOKEN env var missing — admin endpoints are locked to owner session cookie only.");
    suggestions.push("Generate a long random value and set ADMIN_API_TOKEN to enable secure admin CLI usage.");
  }
  if (!env.OWNER_EMAILS?.present) {
    suggestions.push("Set OWNER_EMAILS (comma-separated) so owner accounts are promoted automatically.");
  }
  if (!env.RESEND_API_KEY?.present) {
    suggestions.push("Set RESEND_API_KEY and REVIEW_RECEIVER_EMAIL to receive review notifications.");
  }

  const result = {
    ok: warnings.length === 0,
    checkedAt: new Date().toISOString(),
    warnings,
    suggestions,
    ms: Date.now() - start,
  };

  writeAudit({
    action: "agent.update_check.run",
    actor: "updateAgent",
    route: "agent.updateAgent",
    result: result.ok ? "success" : "failure",
    meta: { warnings: warnings.length, suggestions: suggestions.length },
  }).catch(() => {});

  log.info("updateAgent.done", { ok: result.ok, warnings: warnings.length });
  return result;
}
