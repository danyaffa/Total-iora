// /lib/sacred-sourcehub.js
// One hub to fetch quotes/snippets from sacred sources FIRST.
// Whitelisted providers only: Sefaria (Tanakh/Talmud), alquran.cloud (Qur'an),
// Gutendex (public-domain editions: KJV Bible, Tao Te Ching, Bhagavad Gita, Dhammapada).
// All helpers are here so your API routes can "import once, use everywhere".

export const VERSION = "1.0.0";

/* ----------------------- config / whitelist ----------------------- */

export const SACRED_WHITELIST = [
  // Judaism
  { key: "tanakh", provider: "sefaria", label: "Tanakh / Hebrew Bible", tradition: "Judaism" },

  // Christianity (public-domain KJV for broad coverage)
  { key: "bible-kjv", provider: "gutenberg-title", title: "King James Bible", label: "Holy Bible (KJV)", tradition: "Christianity" },

  // Islam
  { key: "quran", provider: "quran", label: "Qur'an", tradition: "Islam" },

  // Eastern/Asian wisdom (popular guidance texts, public domain translations)
  { key: "tao-te-ching", provider: "gutenberg-title", title: "Tao Te Ching", label: "Tao Te Ching", tradition: "Taoism" },
  { key: "bhagavad-gita", provider: "gutenberg-title", title: "Bhagavad Gita", label: "Bhagavad Gītā", tradition: "Hinduism" },
  { key: "dhammapada", provider: "gutenberg-title", title: "Dhammapada", label: "Dhammapada", tradition: "Buddhism" },
];

/* ----------------------- utilities ----------------------- */

const OK = (s) => !!(s && String(s).trim());
const clip = (s, n=900) => String(s||"").trim().slice(0,n);

const BAN_RE = /(central intelligence agency|cia|foia|world factbook|\.gov\b|whitehouse|nsa|fbi)/i;
function allowSource(s) {
  const all = `${s?.work || ""} ${s?.author || ""} ${s?.url || ""}`.toLowerCase();
  return !BAN_RE.test(all);
}

function keepEnglishBooks(list){ return (list||[]).filter(b => (b.languages||[]).includes("en")); }
function cleanPara(p){
  const s = String(p||"").trim();
  if (s.length < 120) return "";
  if (/^\s*(contents|chapter|book|part|section|introduction|foreword|preface|index)\b/i.test(s)) return "";
  if (/[A-Z\s]{18,}/.test(s) && !/[a-z]/.test(s)) return ""; // all-caps headings or TOC
  return s;
}

const pickPlainText = (fmts) => {
  const f = fmts || {};
  return f["text/plain; charset=utf-8"] || f["text/plain"] || f["text/html"] || null;
};

async function withTimeout(promise, ms=12000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await promise(ac.signal); }
  finally { clearTimeout(t); }
}

async function fetchJSON(url, ms=12000) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, { signal });
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  }, ms);
}
async function fetchTEXT(url, ms=12000) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, { signal });
    if (!r.ok) return "";
    return await r.text().catch(() => "");
  }, ms);
}

/* ----------------------- providers ----------------------- */

// Sefaria: search text, then fetch English verse/segment by ref
export async function fetchSefariaSnippets(query, max=6){
  try {
    const search = await fetchJSON(`https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(query)}&size=${max}&type=Text`);
    const hits = (search?.hits || []).slice(0, max);
    const out = [];
    for (const h of hits) {
      const ref = h?._source?.ref || h?.ref; if (!ref) continue;
      const data = await fetchJSON(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`);
      const en = Array.isArray(data?.text) ? data.text.join(" ") : (data?.text || "");
      const quote = cleanPara(en) || String(en||"").slice(0,900);
      if (!quote) continue;
      out.push({ work: ref, author: "Sefaria", text: clip(quote, 900), url: `https://www.sefaria.org/${encodeURIComponent(ref)}`, source: "sefaria" });
      if (out.length >= max) break;
    }
    return out.filter(allowSource);
  } catch { return []; }
}

// Qur'an: API search (English)
export async function fetchQuranSnippets(query, max=6){
  try {
    const js = await fetchJSON(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`);
    const matches = js?.data?.matches || [];
    return matches.slice(0, max).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      text: clip(m.text, 900),
      url: `https://quran.com/${m.surah?.number || ""}/${m.numberInSurah || ""}`,
      source: "quran",
    })).filter(allowSource);
  } catch { return []; }
}

// Gutenberg (Gutendex): search by title, fetch first English edition's plain text, split/clean paras
export async function fetchGutenbergTitleSnippets(title, max=4){
  try {
    const meta = await fetchJSON(`https://gutendex.com/books/?search=${encodeURIComponent(title)}`);
    const list = keepEnglishBooks(meta?.results || []);
    const book = list[0] || (meta?.results||[])[0]; if (!book) return [];
    const url = pickPlainText(book.formats || {}); if (!url) return [];
    const raw = await fetchTEXT(url);
    const paras = String(raw||"").split(/\n{2,}/).map(cleanPara).filter(Boolean).slice(0, max);
    return paras.map((p) => ({
      work: book.title || title,
      author: (book.authors?.[0]?.name) || null,
      text: clip(p, 900),
      url,
      source: "gutenberg",
    })).filter(allowSource);
  } catch { return []; }
}

/* ----------------------- routing / orchestration ----------------------- */

export function planByPath(path, query, max=6) {
  // choose which sources to hit first based on the current "room"
  const tasks = [];
  switch (path) {
    case "Jewish":
      tasks.push({ fn: fetchSefariaSnippets, args: [query, max] });
      break;
    case "Muslim":
      tasks.push({ fn: fetchQuranSnippets, args: [query, max] });
      break;
    case "Christian":
      tasks.push({ fn: fetchGutenbergTitleSnippets, args: ["King James Bible", max] });
      break;
    case "Eastern":
      tasks.push({ fn: fetchGutenbergTitleSnippets, args: ["Tao Te Ching", Math.min(4, max)] });
      tasks.push({ fn: fetchGutenbergTitleSnippets, args: ["Bhagavad Gita", Math.min(4, max)] });
      tasks.push({ fn: fetchGutenbergTitleSnippets, args: ["Dhammapada", Math.min(4, max)] });
      break;
    default: // Universal: blend a little of each
      tasks.push({ fn: fetchGutenbergTitleSnippets, args: ["Tao Te Ching", 2] });
      tasks.push({ fn: fetchGutenbergTitleSnippets, args: ["Bhagavad Gita", 2] });
      tasks.push({ fn: fetchGutenbergTitleSnippets, args: ["Dhammapada", 2] });
      tasks.push({ fn: fetchSefariaSnippets, args: [query, 2] });
      tasks.push({ fn: fetchQuranSnippets, args: [query, 2] });
      break;
  }
  return tasks;
}

export async function searchSacredFirst({ query, path="Universal", max=8 } = {}) {
  // Execute the planned sacred fetches, merge, de-dupe, cap
  if (!OK(query)) return { quotes: [], meta: { path, version: VERSION } };

  const tasks = planByPath(path, query, Math.max(1, Number(max) || 8));
  const settled = await Promise.allSettled(tasks.map(t => t.fn(...t.args)));

  let merged = [];
  for (const r of settled) {
    if (r.status === "fulfilled" && Array.isArray(r.value)) merged = merged.concat(r.value);
  }

  // de-dupe
  const seen = new Set();
  merged = merged.filter((s) => {
    if (!s || !s.work) return false;
    const key = `${s.source||"x"}|${s.work}|${s.author||""}|${(s.text||"").slice(0,50)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).filter(allowSource).slice(0, Math.max(1, Number(max)||8));

  return { quotes: merged, meta: { path, count: merged.length, version: VERSION } };
}

/* ----------------------- optional: open web hook ----------------------- */
// Stub for your wider web layer. Keep it empty here to ensure sacred-first policy.
// Later, you can wire this to your own search or retrieval pipeline.
export async function searchOpenWebFallback(/* { query, max=5 } */) {
  return []; // intentionally empty (you decide what "White Web" means and plug it here)
}

/* ----------------------- convenience: sacred then maybe open web ----------------------- */

export async function getSourcesSacredThenOpen({ query, path="Universal", maxSacred=8, maxOpen=0 } = {}) {
  const sacred = await searchSacredFirst({ query, path, max: maxSacred });
  let open = [];
  if ((!sacred.quotes?.length) && maxOpen > 0) {
    open = await searchOpenWebFallback({ query, max: maxOpen }).catch(() => []);
  }
  return { sacred, open };
}
