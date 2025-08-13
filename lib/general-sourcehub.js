// General (non-sacred) sources: Wikipedia + Gutenberg
// Returns uniform items: { work, author, pos, quote, url, source }

const SRC = {
  wikiPage: (title) => `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/\s/g, "_"))}`,
  gutenberg: (id) => `https://www.gutenberg.org/ebooks/${id}`,
};

function clamp(s, n = 900) { return String(s || "").slice(0, n); }
function isHTML(s) { return /<\s*html[\s>]/i.test(String(s || "")); }
function htmlToPlain(raw) {
  let s = String(raw || "");
  s = s.replace(/<head[\s\S]*?<\/head>/gi, " ")
       .replace(/<script[\s\S]*?<\/script>/gi, " ")
       .replace(/<style[\s\S]*?<\/style>/gi, " ")
       .replace(/<nav[\s\S]*?<\/nav>/gi, " ")
       .replace(/<footer[\s\S]*?<\/footer>/gi, " ");
  s = s.replace(/<\/(p|div|h[1-6]|li|section|br)>/gi, "\n\n")
       .replace(/<(p|div|h[1-6]|li|section|br)[^>]*>/gi, "\n");
  s = s.replace(/<[^>]+>/g, " ")
       .replace(/\r/g, "").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").replace(/[ \t]{2,}/g, " ");
  return s.trim();
}
function cleanPara(p) {
  const s = String(p || "").trim();
  if (s.length < 120) return "";
  if (/^\s*(contents|table of contents|chapter|book|part|section|introduction|foreword|preface|index|license)\b/i.test(s)) return "";
  if (/[A-Z\s]{18,}/.test(s) && !/[a-z]/.test(s)) return "";
  return s;
}
async function withTimeout(run, ms = 12000) {
  const ac = new AbortController(); const t = setTimeout(() => ac.abort(), ms);
  try { return await run(ac.signal); } finally { clearTimeout(t); }
}
async function getJSON(url, ms = 12000) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, { signal }); if (!r.ok) return null;
    return await r.json().catch(() => null);
  }, ms);
}
async function getTEXT(url, ms = 12000) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, { signal }); if (!r.ok) return "";
    return await r.text().catch(() => "");
  }, ms);
}

/* ---------- Wikipedia ---------- */
async function fetchWikipediaSnippets(query, topK = 4) {
  try {
    const search = await getJSON(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${topK}&format=json&utf8=1&origin=*`
    );
    const hits = search?.query?.search || [];
    const out = [];
    for (const h of hits.slice(0, topK)) {
      const pageTitle = h?.title; const pageId = h?.pageid;
      if (!pageId || !pageTitle) continue;
      const ex = await getJSON(
        `https://en.wikipedia.org/w/api.php?action=query&prop=extracts&explaintext=1&exsentences=12&pageids=${pageId}&format=json&origin=*`
      );
      const page = ex?.query?.pages?.[pageId]; const extract = page?.extract || "";
      const quote = cleanPara(extract) || clamp(extract, 900);
      if (!quote) continue;
      out.push({
        work: pageTitle,
        author: "Wikipedia",
        pos: 0,
        quote,
        url: SRC.wikiPage(pageTitle),
        source: "wikipedia",
      });
      if (out.length >= topK) break;
    }
    return out;
  } catch { return []; }
}

/* ---------- Gutenberg (general) ---------- */
async function fetchGutenbergByQuery(query, topK = 3) {
  try {
    const js = await getJSON(`https://gutendex.com/books/?languages=en&search=${encodeURIComponent(query)}`);
    const results = js?.results || []; if (!results.length) return [];
    // Prefer non-poetry, non-index items that look explanatory
    results.sort((a,b) => (b.download_count||0) - (a.download_count||0));
    const out = [];
    for (const book of results.slice(0, Math.max(1, topK))) {
      const fmts = book.formats || {};
      const rawURL =
        (fmts["text/plain; charset=utf-8"] && !/\.zip$/i.test(fmts["text/plain; charset=utf-8"])) ? fmts["text/plain; charset=utf-8"] :
        (fmts["text/plain"] && !/\.zip$/i.test(fmts["text/plain"])) ? fmts["text/plain"] :
        (fmts["text/html; charset=utf-8"] && !/\.zip$/i.test(fmts["text/html; charset=utf-8"])) ? fmts["text/html; charset=utf-8"] :
        (fmts["text/html"] && !/\.zip$/i.test(fmts["text/html"])) ? fmts["text/html"] : null;
      if (!rawURL) continue;

      const raw = await getTEXT(rawURL);
      const plain = isHTML(raw) ? htmlToPlain(raw) : raw;
      const paras = String(plain||"").split(/\n{2,}/).map(s=>s.trim()).filter(Boolean).map(cleanPara).filter(Boolean);
      if (!paras.length) continue;

      out.push({
        work: book.title || query,
        author: (book.authors?.[0]?.name)||null,
        pos: 0,
        quote: clamp(paras[0], 900),
        url: SRC.gutenberg(book.id),
        source: "gutenberg",
      });
      if (out.length >= topK) break;
    }
    return out;
  } catch { return []; }
}

/* ---------- public API ---------- */
export async function searchGeneralFirst({ query, max = 6 } = {}) {
  const q = String(query || "").trim();
  if (!q) return [];
  const k1 = Math.min(4, max);
  const k2 = Math.max(0, max - k1);

  const [wiki, gut] = await Promise.allSettled([
    fetchWikipediaSnippets(q, k1),
    fetchGutenbergByQuery(q, k2 || 2),
  ]);

  let items = [];
  for (const r of [wiki, gut]) if (r.status === "fulfilled" && Array.isArray(r.value)) items = items.concat(r.value);

  // De-dupe
  const seen = new Set();
  items = items.filter(s => {
    const key = `${s.source}|${s.work}|${(s.quote||"").slice(0,60)}`;
    if (seen.has(key)) return false; seen.add(key); return true;
  });

  return items.slice(0, max);
}
