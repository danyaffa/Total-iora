// FILE: /pages/api/login.js
import { scryptSync } from "crypto";

function verify(hashString, password){
  // format: s1$<salt>$<hash>
  const [scheme, salt, hash] = String(hashString||"").split("$");
  if (scheme !== "s1" || !salt || !hash) return false;
  const calc = scryptSync(password, salt, 64).toString("hex");
  return calc === hash;
}

export default async function handler(req,res){
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  const { email="", password="" } = req.body || {};
  if (!email || !password) return res.status(400).json({ error:"Missing email or password" });

  const SECURE = req.headers["x-forwarded-proto"] === "https";
  const cookie = `ac_session=1; Max-Age=${30*24*3600}; Path=/; SameSite=Lax${SECURE?"; Secure":""}`;

  const SUPABASE_URL = process.env.SUPABASE_URL || "";
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
  const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "registrations";

  if (SUPABASE_URL && SUPABASE_SERVICE_KEY){
    // Check Supabase
    try{
      const u = `${SUPABASE_URL}/rest/v1/${encodeURIComponent(SUPABASE_TABLE)}?select=password_hash&email=eq.${encodeURIComponent(email.toLowerCase())}&limit=1`;
      const r = await fetch(u,{
        headers:{
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        }
      });
      if (!r.ok) return res.status(502).json({ error:"Auth backend unavailable" });
      const rows = await r.json();
      const ok = rows?.[0]?.password_hash && verify(rows[0].password_hash, password);
      if (!ok) return res.status(401).json({ error:"Invalid credentials" });
      res.setHeader("Set-Cookie", cookie);
      return res.status(200).json({ ok:true });
    }catch(e){
      return res.status(500).json({ error:"Auth error" });
    }
  }

  // Dev mode: allow any credentials so you can proceed now
  res.setHeader("Set-Cookie", cookie);
  return res.status(200).json({ ok:true, dev:true });
}
