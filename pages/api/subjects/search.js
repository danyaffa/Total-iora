// FILE: /pages/api/subjects/search.js
import { searchSacredFirst } from "../../../lib/sacred-sourcehub.js";
import { searchGeneralFirst } from "../../../lib/general-sourcehub.js";
import { withApi } from "../../../lib/apiSecurity";

async function handler(req, res) {
  const { query = "", path = "Universal", max = 8 } = req.body || {};
  const q = String(query || "").trim();
  if (!q) return res.status(400).json({ error: "missing_query" });
  if (q.length > 500) return res.status(413).json({ error: "query_too_long" });
  const safeMax = Math.max(1, Math.min(20, Number(max) || 8));

  let quotes = await searchSacredFirst({ query: q, path, max: safeMax });
  if (!Array.isArray(quotes)) quotes = [];

  if (quotes.length < safeMax) {
    const more = await searchGeneralFirst({ query: q, max: safeMax - quotes.length });
    quotes = quotes.concat(more || []);
    const seen = new Set();
    quotes = quotes
      .filter((s) => {
        const key = `${s.source}|${s.work}|${(s.quote || "").slice(0, 60)}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      })
      .slice(0, safeMax);
  }

  return res.status(200).json({ quotes });
}

export default withApi(handler, {
  name: "api.subjects.search",
  methods: ["POST"],
  rate: { max: 30, windowMs: 60_000 },
});
