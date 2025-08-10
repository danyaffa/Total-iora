// FILE: /pages/api/register.js
// Stores registrations. Today: optional Supabase; otherwise returns 200 so UX flows.
// To persist, set env vars: SUPABASE_URL, SUPABASE_SERVICE_KEY, SUPABASE_TABLE (default: registrations)

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { name = "", email = "", phone = "", marketing = false, usage = false } = req.body || {};
  if (!name.trim() || !email.trim() || !phone.trim()) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL || "";
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
  const SUPABASE_TABLE = process.env.SUPABASE_TABLE || "registrations";

  // If Supabase is configured, insert row via PostgREST
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

  // Fallback: no DB configured yet (free mode). Return OK so UX isn’t blocked.
  console.log("[register] Dev mode signup:", { name, email, phone, marketing, usage });
  return res.status(200).json({
    ok: true,
    message: "Registered. Welcome!",
    devMode: true,
  });
}

/*
Supabase quick table (SQL):

create table if not exists public.registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  phone text not null,
  marketing boolean default false,
  usage boolean default false
);
alter table public.registrations enable row level security;
create policy "allow inserts from service role" on public.registrations for insert to public using (true) with check (true);
*/
