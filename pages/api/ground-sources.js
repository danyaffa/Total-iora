// FILE: /pages/api/ground-sources.js
// Grounded quotes for Oracle — UPDATED, safer, and more useful.
// - Keeps your strict stance: NO CIA/.gov/FOIA or junk sources.
// - Adds a real “quote-from-this-book” path (stop repeating the same 3 snippets).
// - Randomizes sections so results aren’t always from the top of the text.
// - Dedupes aggressively (no near-duplicate paragraphs).
// - Still fast + drop-in: returns { quotes: [{work, author, text, url, pos}] }.
//
// Request body (JSON):
// { query: "user text", path: "Universal|Jewish|Muslim|Christian|Eastern",
//   max?: number (default 6), lang?: string,
//   book?: string,                 // force quotes from a specific book (e.g., "Meditations", "Psalms")
//   strict?: boolean,              // default true; only allow approved domains when true
//   minChars?: number, maxChars?: number }  // tune paragraph sizes
//
// Notes:
// - If `book` is provided, we prioritize that title via Gutenberg (public domain).
// - Jewish: Sefaria. Muslim: Qur’an (alquran.cloud). Christian/Eastern: Gutenberg titles.
// - Universal: a balanced mix (Tao Te Ching, Gita, Dhammapada, + Sefaria).
//
// Response: 200 { quotes: [...] }  (empty array on error to keep UI calm)

export const dynamic = "force-dynamic";
export const maxDuration = 28;

/* -------------------------- utils -------------------------- */

const ok = (s) => !!(s && String(s).trim());
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
const norm = (s) => String(s || "").trim().replace(/\s+/g, " ");
const pickPlainText = (fmts) => {
  const k = Object.keys(fmts || {});
  const p = k.find((x) => x.startsWith("text/plain"));
  if (p) return fmts[p];
  const h = k.find((x) => x.startsWith("text/html"));
  return h ? fmts[h] : null;
};
const BAN_REGEX = /(central intelligence agency|cia|foia|world factbook|\.gov\b|whitehouse|nsa|fbi)/i;
const ALLOWED_DOMAINS = [
  "sefaria.org",
  "www.sefaria.org",
  "api.alquran.cloud",
  "quran.com",
  "www.quran.com",
  "gutenberg.org",
  "www.gutenberg.org",
  "gutendex.com",
  "www.gutendex.com",
];

// Default paragraph size window (tunable via body)
const DEFAULT_MIN = 180;
const DEFAULT_MAX = 700;

function hostOf(url) {
  try { return new URL(url).host.toLowerCase(); } catch { return ""; }
}

function allowSource(s, strict = true) {
  const all = `${s.work || ""} ${s.author || ""} ${s.url || ""}`;
  if (BAN_REGEX.test(all)) return false;
  if (!strict || !s.url) return true;
  const h = hostOf(s.url);
  return ALLOWED_DOMAINS.includes(h);
}

function uniqueByKey(list, keyFn) {
  const seen = new Set();
  const out = [];
  for (const it of list) {
    const key = keyFn(it);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out;
}

// Split raw text into reasonably sized, meaningful paragraphs
function splitParas(raw, { minChars = DEFAULT_MIN, maxChars = DEFAULT_MAX } = {}) {
  const minC = clamp(Number(minChars) || DEFAULT_MIN, 80, 1200);
  const maxC = Math.max(minC + 40, clamp(Number(maxChars) || DEFAULT_MAX, 160, 1400));
  const chunks = String(raw || "")
    .replace(/\r/g, "")
    .split(/\n{2,}/g)
    .map((p) => norm(p))
    .filter((p) => p.length >= minC && p.length <= maxC);
  return chunks;
}

// Sample paragraphs across the whole book (not just the top)
function diverseSample(arr, k = 6) {
  if (!Array.isArray(arr) || !arr.length) return [];
  const n = arr.length;
  const want = clamp(k, 1, 12);
  if (n <= want) return arr.slice(0, want);
  const step = Math.max(1, Math.floor(n / want));
  const picks = [];
  let i = Math.floor((Date.now() % step)); // moving offset for variety
  while (picks.length < want && i < n) {
    picks.push(arr[i]);
    i += step;
  }
  return picks.slice(0, want);
}

/* --------------------- providers (approved) --------------------- */

// Sefaria (Jewish)
async function fetchSefariaByQuery(query, topK = 6, opts = {}) {
  try {
    const sr = await fetch(
      `https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(query)}&size=${topK}&type=Text`
    );
    if (!sr.ok) return [];
    const data = await sr.json().catch(() => ({}));
    const hits = (data?.hits || []).slice(0, topK);
    const out = [];
    for (const h of hits) {
      const ref = h?._source?.ref || h?.ref;
      if (!ref) continue;
      const tr = await fetch(
        `https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`
      );
      if (!tr.ok) continue;
      const tx = await tr.json().catch(() => ({}));
      const en = Array.isArray(tx?.text) ? tx.text.join(" ") : tx?.text || "";
      const paras = splitParas(en, opts);
      const picks = diverseSample(paras, 2);
      picks.forEach((p, idx) =>
        out.push({
          work: ref,
          author: "Sefaria",
          pos: idx,
          text: p,
          url: `https://www.sefaria.org/${encodeURIComponent(ref)}`,
          source: "sefaria",
        })
      );
    }
    return out;
  } catch {
    return [];
  }
}

// Qur’an (Muslim)
async function fetchQuranByQuery(query, topK = 6, opts = {}) {
  try {
    const r = await fetch(
      `https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`
    );
    if (!r.ok) return [];
    const js = await r.json().catch(() => ({}));
    const matches = js?.data?.matches || [];
    const picks = diverseSample(matches, topK);
    return picks.map((m, i) => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      pos: i,
      text: norm(m.text || "").slice(0, clamp(opts.maxChars || DEFAULT_MAX, 200, 1200)),
      url: `https://quran.com/${m.surah?.number || ""}/${m.numberInSurah || ""}`,
      source: "quran",
    }));
  } catch {
    return [];
  }
}

// Gutenberg (public domain books)
async function fetchGutenbergByTitle(title, topK = 6, opts = {}) {
  try {
    const r = await fetch(
      `https://gutendex.com/books/?search=${encodeURIComponent(title)}`
    );
    if (!r.ok) return [];
    const js = await r.json().catch(() => ({}));
    const book = (js?.results || [])[0];
    if (!book) return [];
    const url = pickPlainText(book.formats || {});
    if (!url) return [];
    const tr = await fetch(url);
    if (!tr.ok) return [];
    const raw = await tr.text();
    const paras = splitParas(raw, opts);
    const picks = diverseSample(paras, topK);
    return picks.map((p, i) => ({
      work: book.title || title,
      author: (book.authors?.[0]?.name) || null,
      pos: i,
      text: p,
      url,
      source: "gutenberg",
    }));
  } catch {
    return [];
  }
}

/* --------------------- router / handler --------------------- */

export default async function handler(req, res) {
  if (req.method !== "POST")
    return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      query,
      path = "Universal",
      max = 6,
      lang = "en",
      book = "",           // if set, prioritize this book (Gutenberg)
      strict = true,       // keep to approved domains by default
      minChars = DEFAULT_MIN,
      maxChars = DEFAULT_MAX,
    } = req.body || {};

    const limit = clamp(Number(max) || 6, 1, 12);
    const paraOpts = { minChars, maxChars };

    // 1) If a specific book is requested, go straight there (prevents “same 3 quotes” problem).
    let results = [];
    if (ok(book)) {
      results = await fetchGutenbergByTitle(book, limit, paraOpts);
    } else {
      // 2) Otherwise branch by room
      const tasks = [];
      switch (path) {
        case "Jewish":
          if (ok(query)) tasks.push(fetchSefariaByQuery(query, 6, paraOpts));
          break;
        case "Muslim":
          if (ok(query)) tasks.push(fetchQuranByQuery(query, 6, paraOpts));
          break;
        case "Christian":
          // KJV is the most accessible public-domain text
          tasks.push(fetchGutenbergByTitle("King James Bible", limit, paraOpts));
          break;
        case "Eastern":
          tasks.push(fetchGutenbergByTitle("Tao Te Ching", 4, paraOpts));
          tasks.push(fetchGutenbergByTitle("Bhagavad Gita", 4, paraOpts));
          tasks.push(fetchGutenbergByTitle("Dhammapada", 4, paraOpts));
          break;
        default: // Universal
          tasks.push(fetchGutenbergByTitle("Tao Te Ching", 2, paraOpts));
          tasks.push(fetchGutenbergByTitle("Bhagavad Gita", 2, paraOpts));
          tasks.push(fetchGutenbergByTitle("Dhammapada", 2, paraOpts));
          if (ok(query)) tasks.push(fetchSefariaByQuery(query, 2, paraOpts));
          break;
      }
      const settled = await Promise.allSettled(tasks);
      for (const s of settled) {
        if (s.status === "fulfilled" && Array.isArray(s.value)) {
          results = results.concat(s.value);
        }
      }
    }

    // 3) Filter, dedupe, cap
    results = results
      .filter((q) => allowSource(q, !!strict) && ok(q.text))
      .map((q) => ({
        work: q.work,
        author: q.author || null,
        text: norm(q.text).slice(0, clamp(maxChars, 160, 1400)),
        url: q.url || null,
        pos: Number.isFinite(q.pos) ? q.pos : 0,
      }));

    // dedupe by (work|norm(text)) to avoid the “same paragraph” syndrome
    results = uniqueByKey(results, (x) => `${x.work}|${x.text.toLowerCase().slice(0, 64)}`);

    // Shuffle lightly so repeated requests don’t look identical
    for (let i = results.length - 1; i > 0; i--) {
      const j = Math.floor(((Date.now() >> 6) + i) % (i + 1));
      [results[i], results[j]] = [results[j], results[i]];
    }

    results = results.slice(0, limit);

    return res.status(200).json({ quotes: results });
  } catch (err) {
    // Quiet failure: return empty quotes (keeps Oracle calm)
    return res.status(200).json({ quotes: [] });
  }
}
