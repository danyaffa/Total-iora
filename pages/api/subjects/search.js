// FILE: /pages/api/subjects/search.js
import { searchSacredFirst } from "../../../lib/sacred-sourcehub.js";
import { searchGeneralFirst } from "../../../lib/general-sourcehub.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { query = "", path = "Universal", max = 8 } = req.body || {};
    const q = String(query || "").trim();
    if (!q) return res.status(400).json({ error: "Missing query" });

    let quotes = await searchSacredFirst({ query: q, path, max });
    if (!Array.isArray(quotes)) quotes = [];

    if (quotes.length < max) {
      const more = await searchGeneralFirst({ query: q, max: max - quotes.length });
      quotes = quotes.concat(more || []);
      // de-dupe + cap
      const seen = new Set();
      quotes = quotes.filter(s => {
        const key = `${s.source}|${s.work}|${(s.quote||"").slice(0,60)}`;
        if (seen.has(key)) return false; seen.add(key); return true;
      }).slice(0, max);
    }

    return res.status(200).json({ quotes });
  } catch (e) {
    return res.status(500).json({ error: "Search failed", detail: String(e?.message || e) });
  }
}
