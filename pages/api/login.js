// FILE: /pages/api/login.js
import { scryptSync, timingSafeEqual } from "crypto";

function verifyPassword(plain, stored) {
  // format: s1$<salt>$<hashHex>
  const [scheme, salt, hash] = String(stored || "").split("$");
  if (scheme !== "s1" || !salt || !hash) return false;
  const test = scryptSync(String(plain), salt, 64);
  const bufHash = Buffer.from(hash, "hex");
  return bufHash.length === test.length && timingSafeEqual(bufHash, test);
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { email = "", password = "" } = req.body || {};
  if (!email || !password) return res.status(400).json({ error: "Missing email or password" });

  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_SERVICE_KEY || "";

  let ok = false;
  if (url && key) {
    try {
      // Fetch the row for this email
      const endpoint = `${url}/rest/v1/registrations?select=username,email,password_hash&email=eq.${encodeURIComponent(email.toLowerCase())}&limit=1`;
      const r = await fetch(endpoint, { headers: { apikey: key, Authorization: `Bearer ${key}` }});
      const rows = r.ok ? await r.json() : [];
      const row = rows?.[0];
      if (row?.password_hash && verifyPassword(password, row.password_hash)) ok = true;
    } catch {}
  }

  if (!ok) return res.status(401).json({ error: "Invalid credentials" });

  // Session cookie (session-only; expires on browser close)
  res.setHeader("Set-Cookie", `ac_session=1; Path=/; SameSite=Lax; HttpOnly; Secure`);
  return res.status(200).json({ ok: true });
}
