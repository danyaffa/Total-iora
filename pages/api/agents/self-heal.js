// FILE: /pages/api/agents/self-heal.js
// ADMIN-ONLY self-healing agent endpoint. Runs environment/Firestore
// checks and auto-patches fixable issues (e.g. promoting owner users).
// Writes every action to the audit_logs collection.

import { withApi } from "../../../lib/apiSecurity";
import { runSelfHeal } from "../../../lib/agents/selfHeal";

async function handler(_req, res) {
  const result = await runSelfHeal();
  return res.status(result.ok ? 200 : 207).json(result);
}

export default withApi(handler, {
  name: "api.agents.self-heal",
  methods: ["POST", "GET"],
  adminOnly: true,
  audit: true,
  auditAction: "agent.self_heal.invoke",
  rate: { max: 20, windowMs: 60_000 },
});
