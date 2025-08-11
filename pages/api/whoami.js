// FILE: /pages/api/auth/whoami.js
// Unchanged. Real session check (cookie-based). Open-for-all can bypass via index.js logic.

export const dynamic = "force-dynamic";

export default async function handler(req, res) {
  try {
    const cookie = req.headers.cookie || "";
    const hasSession = /(?:^|;\s*)ac_session=([^;]+)/.test(cookie);
    if (!hasSession) return res.status(401).json({ ok: false });
    return res.status(200).json({ ok: true });
  } catch {
    return res.status(401).json({ ok: false });
  }
}
