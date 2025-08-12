// FILE: /pages/api/ground-sources.js
// Purpose: Return a curated list of quotes/snippets ONLY from approved sacred sources for a given query.
// Same whitelist and English-only Gutenberg filtering as in auracode-chat.js.

export const dynamic = "force-dynamic";
export const maxDuration = 28;

/* ---------- utils ---------- */
const ok = (s) => !!(s && String(s).trim());
const trim = (s, n=800) => String(s||"").trim().slice(0,n);

function allowSource(s) {
  const all = `${s?.work || ""} ${s?.author || ""} ${s?.url || ""}`.toLowerCase();
  const banned = /(central intelligence agency|cia|foia|world factbook|\.gov\b|whitehouse|nsa|fbi)/i;
  return !banned.test(all);
}
function keepEnglishBooks(list){ return (list||[]).filter(b => (b.languages||[]).includes("en")); }
function cleanPara(p){
  const s = String(p||"").trim();
  if (s.length < 120) return "";
  if (/^\s*(contents|chapter|book|part|section|introduction|foreword|preface|index)\b/i.test(s)) return "";
  if (/[A-Z\s]{18,}/.test(s) && !/[a-z]/.test(s)) return "";
  return s;
}
const pickPlainText = (fmts) => {
  const f = fmts || {};
  return f["text/plain; charset=utf-8"] || f["text/plain"] || f["text/html"] || null;
};

/* ---------- providers (mirrored) ---------- */
async function fetchSefaria(query, max=6) {
  try {
    const sr = await fetch(`https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(query)}&size=${max}&type=Text`);
    if (!sr.ok) return [];
    const data = await sr.json().catch(()=>({}));
    const hits = (data?.hits || []).slice(0, max);
    const out = [];
    for (const h of hits) {
      const ref = h?._source?.ref || h?.ref; if (!ref) continue;
      const tr = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`);
      if (!tr.ok) continue;
      const tx = await tr.json().catch(()=>({}));
      const en = Array.isArray(tx?.text) ? tx.text.join(" ") : (tx?.text || "");
      const text = cleanPara(en) || en;
      if (!text) continue;
      out.push({ work: ref, author: "Sefaria", text: trim(text, 700), url: `https://www.sefaria.org/${encodeURIComponent(ref)}` });
    }
    return out.filter(allowSource);
  } catch { return []; }
}

async function fetchQuran(query, max=6) {
  try {
    const r = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const matches = js?.data?.matches || [];
    return matches.slice(0, max).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      text: trim(m.text, 700),
      url: `https://quran.com/${m.surah?.number || ""}/${m.numberInSurah || ""}`,
    })).filter(allowSource);
  } catch { return []; }
}

async function fetchGutenbergTitle(title, max=4){
  try {
    const r = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(title)}`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const list = keepEnglishBooks(js?.results || []);
    const book = list[0] || (js?.results||[])[0]; if (!book) return [];
    const url = pickPlainText(book.formats || {}); if (!url) return [];
    const tr = await fetch(url); if (!tr.ok) return [];
    const raw = await tr.text();
    const paras = String(raw||"").split(/\n{2,}/).map(cleanPara).filter(Boolean).slice(0, max);
    return paras.map((p)=>({ work: book.title || title, author: (book.authors?.[0]?.name)||null, text: trim(p,700), url })).filter(allowSource);
  } catch { return []; }
}

/* ---------- handler ---------- */
export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { query, path = "Universal", max = 6 } = req.body || {};
    if (!ok(query)) return res.status(200).json({ quotes: [] });

    const tasks = [];
    if (path === "Jewish") tasks.push(fetchSefaria(query, max));
    if (path === "Muslim") tasks.push(fetchQuran(query, max));
    if (path === "Christian") tasks.push(fetchGutenbergTitle("King James Bible", max));
    if (path === "Eastern") {
      tasks.push(fetchGutenbergTitle("Tao Te Ching", 4));
      tasks.push(fetchGutenbergTitle("Bhagavad Gita", 4));
      tasks.push(fetchGutenbergTitle("Dhammapada", 4));
    }
    if (path === "Universal") {
      tasks.push(fetchGutenbergTitle("Tao Te Ching", 2));
      tasks.push(fetchGutenbergTitle("Bhagavad Gita", 2));
      tasks.push(fetchGutenbergTitle("Dhammapada", 2));
      tasks.push(fetchSefaria(query, 2));
    }

    const results = await Promise.allSettled(tasks);
    let merged = [];
    for (const r of results) if (r.status === "fulfilled" && Array.isArray(r.value)) merged = merged.concat(r.value);

    // dedupe & cap
    const seen = new Set();
    merged = merged.filter((s) => {
      if (!s || !s.work) return false;
      const key = `${s.work}|${s.author||""}|${s.url||""}|${(s.text||"").slice(0,40)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).filter(allowSource).slice(0, Math.max(1, Number(max)||6));

    return res.status(200).json({ quotes: merged });
  } catch (err) {
    return res.status(200).json({ quotes: [] });
  }
}
