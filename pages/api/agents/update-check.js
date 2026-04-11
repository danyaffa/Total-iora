// FILE: /pages/api/agents/update-check.js
// ADMIN-ONLY: reports non-destructive updates / configuration drift.

import { withApi } from "../../../lib/apiSecurity";
import { runUpdateCheck } from "../../../lib/agents/updateAgent";

async function handler(_req, res) {
  const result = await runUpdateCheck();
  return res.status(200).json(result);
}

export default withApi(handler, {
  name: "api.agents.update-check",
  methods: ["GET", "POST"],
  adminOnly: true,
  audit: true,
  auditAction: "agent.update_check.invoke",
  rate: { max: 20, windowMs: 60_000 },
});
