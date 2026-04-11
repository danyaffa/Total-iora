// FILE: /pages/api/auth/whoami.js
import { withApi } from "../../../lib/apiSecurity";

async function handler(req, res) {
  const hasSession = req.cookies?.ac_session === "1";
  if (!hasSession) {
    return res.status(401).json({ ok: false });
  }
  const email = String(req.cookies?.ac_email || "").trim().toLowerCase();
  return res.status(200).json({ ok: true, email: email || null });
}

export default withApi(handler, {
  name: "api.auth.whoami",
  methods: ["GET"],
  rate: { max: 120, windowMs: 60_000 },
});
