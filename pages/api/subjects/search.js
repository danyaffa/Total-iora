// FILE: /pages/api/subjects/search.js
// Uses your sacred-sourcehub to return quotes for a subject page.

import { searchSacredFirst } from "../../../lib/sacred-sourcehub";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { query, path = "Universal", max = 8 } = req.body || {};
    const { quotes } = await searchSacredFirst({ query, path, max });
    return res.status(200).json({ quotes });
  } catch (e) {
    return res.status(500).json({ error: "Search failed", detail: String(e?.message || e) });
  }
}
