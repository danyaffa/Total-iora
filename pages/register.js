// FILE: /pages/api/register.js
// Stores registrations (optional Supabase). Also sets "ac_registered=1" cookie to unlock the index.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name = "", email = "", phone = "", marketing = false, usage = false } = req.body || {};
  if (!name.trim() || !email.trim() || !phone.trim()) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Set unlock cookie for 1 year
  res.setHeader("Set-Cookie", `ac_registered=1; Max-Age=${365 * 24 * 3600}; Path=/; SameSite=Lax; Secure`);

  const SUPABASE_URL = process.env.SUPABASE_URL || "";
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
  const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "registrations";

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY) {
    try {
      const row = {
        name,
        email: email.toLowerCase(),
        phone,
        marketing: !!marketing,
        usage: !!usage,
        created_at: new Date().toISOString(),
      };
      const r = await fetch(`${SUPABASE_URL}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}`, {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "return=representation",
        },
        body: JSON.stringify(row),
      });
      if (!r.ok) {
        const t = await r.text();
        return res.status(502).json({ error: "Failed to store signup", detail: t });
      }
      const data = await r.json();
      return res.status(200).json({ ok: true, message: "Registered. Welcome!", id: data?.[0]?.id });
    } catch (e) {
      return res.status(500).json({ error: "Unexpected error", detail: String(e?.message || e) });
    }
  }

  // Dev/no-DB fallback
  console.log("[register] dev-mode signup:", { name, email, phone, marketing, usage });
  return res.status(200).json({ ok: true, message: "Registered. Welcome!", devMode: true });
}
