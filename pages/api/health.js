// FILE: /pages/api/health.js
// Lightweight health check. Returns 200 with a minimal summary — never
// leaks secrets. Handy for uptime monitors and the self-heal agent.

import { withApi } from "../../lib/apiSecurity";
import { envReport } from "../../lib/env";

async function handler(_req, res) {
  const env = envReport();
  const critical = ["OPENAI_API_KEY", "FIREBASE_PROJECT_ID", "FIREBASE_CLIENT_EMAIL", "FIREBASE_PRIVATE_KEY"];
  const missing = critical.filter((k) => !env[k]?.present);
  const status = missing.length === 0 ? "ok" : "degraded";

  res.setHeader("Cache-Control", "no-store");
  return res.status(200).json({
    status,
    uptimeSec: Math.round(process.uptime?.() || 0),
    ts: new Date().toISOString(),
    missingCritical: missing,
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev",
  });
}

export default withApi(handler, {
  name: "api.health",
  methods: ["GET"],
  rate: { max: 120, windowMs: 60_000 },
});
