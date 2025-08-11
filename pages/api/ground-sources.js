// Returns grounded quotes from free sources based on room/path.
// POST { query, path, lang, max? } -> { quotes: [{work,author,url,pos,text}] }
//
// Sources used (no API keys):
// - Jewish:   Sefaria search + texts
// - Muslim:   https://api.alquran.cloud (search endpoint)
// - Christian: Project Gutenberg (KJV) text, local search
// - Eastern:  Tao Te Ching (Gutenberg) + Meditations fallback
// - Universal: Meditations (Gutenberg)

export const config = { api: { bodyParser: { sizeLimit: "1mb" } } };

async function sefariaQuotes(query, max = 5) {
  try {
    const url = `https://www.sefaria.org/api/search-wrapper?query=${encodeURIComponent(
      `${query} Rambam Maimonides`
    )}&size=${Math.max(3, Math.min(12, max * 3))}&type=Text`;
    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (!r.ok) return [];
    const data = await r.json().catch(() => ({}));
    const hits = (data?.hits?.hits || []).slice(0, 12);
    const out = [];
    for (const h of hits) {
      const ref =
        h?._source?.ref ||
        (Array.isArray(h?.fields?.ref) ? h.fields.ref[0] : null) ||
        h?._id ||
        null;
      if (!ref) continue;
      const turl = `https://www.sefaria.org/api/texts/${encodeURIComponent(
        ref
      )}?lang=en&commentary=0&pad=0`;
      const tr = await fetch(turl, { headers: { Accept: "application/json" } });
      if (!tr.ok) continue;
      const tj = await tr.json().catch(() => ({}));
      const raw =
        (Array.isArray(tj?.text) ? tj.text.join(" ") : tj?.text) || "";
      const text = String(raw).replace(/\s+/g, " ").trim();
      if (!text) continue;
      out.push({
        work: ref,
        author: "Maimonides (Rambam) / Jewish sources",
        url: `https://www.sefaria.org/${encodeURIComponent(ref)}`,
        pos: 0,
        text: text.slice(0, 900),
      });
      if (out.length >= max) break;
    }
    return out;
  } catch {
    return [];
  }
}

async function quranQuotes(query, lang = "en", max = 5) {
  try {
    const edition = lang.startsWith("ar") ? "quran-uthmani" : "en.pickthall";
    const r = await fetch(
      `https://api.alquran.cloud/v1/search/${encodeURIComponent(
        query
      )}/all/${edition}`
    );
    if (!r.ok) return [];
    const data = await r.json().catch(() => ({}));
    const ayahs = data?.data?.matches || data?.data?.ayahs || [];
    const out = [];
    for (const a of ayahs) {
      const surah =
        a?.surah?.englishName || a?.surah?.name || a?.surah?.nameSimple || "";
      const num =
        (a?.numberInSurah != null ? a.numberInSurah : a?.number) || 0;
      const text =
        a?.text || a?.ayah?.text || a?.data?.text || a?.verse?.text || "";
      if (!text) continue;
      out.push({
        work: `Qur’an ${surah} ${num}`,
        author: "—",
        url: `https://quran.com/${a?.surah?.number || ""}/${num || ""}`,
        pos: num || 0,
        text: String(text).slice(0, 900),
      });
      if (out.length >= max) break;
    }
    return out;
  } catch {
    return [];
  }
}

// -------- Gutenberg helpers (KJV, Tao, Meditations) ----------
function splitParas(txt, maxChars = 900) {
  const ps = String(txt).split(/\n{2,}/).map(s=>s.trim()).filter(Boolean);
  const out = [];
  for (const p of ps) {
    if (p.length <= maxChars) out.push(p);
    else for (let i = 0; i < p.length; i += maxChars) out.push(p.slice(i, i + maxChars));
    if (out.length >= 120) break;
  }
  return out;
}
function scorePara(p, terms) {
  const s = p.toLowerCase(); let sc = 0;
  for (const t of terms) if (s.includes(t)) sc += t.length;
  const L = p.length; if (L > 160 && L < 800) sc += 40;
  return sc;
}
async function pickFromGutenberg(url, work, author, query, max = 5) {
  try {
    const r = await fetch(url, { redirect: "follow" });
    if (!r.ok) return [];
    const txt = await r.text();
    const paras = splitParas(txt);
    const terms = String(query || "").toLowerCase().split(/\W+/).filter(Boolean);
    const top = paras
      .map((p, i) => ({ p, i, score: scorePara(p, terms) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, max);
    return top.map(s => ({
      work, author, url, pos: s.i, text: s.p
    }));
  } catch {
    return [];
  }
}

async function bibleKJVQuotes(query, max = 5) {
  // KJV (Project Gutenberg #10)
  return pickFromGutenberg(
    "https://www.gutenberg.org/cache/epub/10/pg10.txt",
    "Bible (KJV)",
    "—",
    query,
    max
  );
}
async function taoQuotes(query, max = 5) {
  // Tao Te Ching (Legge) PG #216
  return pickFromGutenberg(
    "https://www.gutenberg.org/cache/epub/216/pg216.txt",
    "Tao Te Ching (Legge)",
    "Laozi",
    query,
    max
  );
}
async function meditationsQuotes(query, max = 5) {
  // Meditations PG #2680
  return pickFromGutenberg(
    "https://www.gutenberg.org/cache/epub/2680/pg2680.txt",
    "Meditations",
    "Marcus Aurelius",
    query,
    max
  );
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const { query = "", path = "Universal", lang = "en-US", max = 6 } = req.body || {};
  const want = String(path || "Universal");
  const q = String(query || "").trim();
  if (!q) return res.status(200).json({ quotes: [] });

  const lower = q.toLowerCase();
  const includesRambam = /rambam|maimonides|mishneh torah|guide for the perplexed/i.test(q);

  let quotes = [];

  try {
    if (want === "Jewish" || includesRambam) {
      quotes = quotes.concat(await sefariaQuotes(q, max));
    }
    if (want === "Muslim") {
      quotes = quotes.concat(await quranQuotes(q, lang, Math.max(2, Math.floor(max/2))));
    }
    if (want === "Christian") {
      quotes = quotes.concat(await bibleKJVQuotes(q, Math.max(2, Math.floor(max/2))));
    }
    if (want === "Eastern") {
      quotes = quotes.concat(await taoQuotes(q, Math.max(2, Math.floor(max/2))));
      if (quotes.length < max) quotes = quotes.concat(await meditationsQuotes(q, 2));
    }
    if (want === "Universal") {
      quotes = quotes.concat(await meditationsQuotes(q, Math.max(2, Math.floor(max/2))));
    }

    // Always have a little fallback if empty:
    if (quotes.length === 0) {
      const fallback = await meditationsQuotes(q, Math.min(2, max));
      quotes = quotes.concat(fallback);
    }
  } catch {}

  // trim to max and return
  return res.status(200).json({ quotes: quotes.slice(0, max) });
}
