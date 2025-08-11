// FILE: /pages/api/auracode-chat.js
// Enforces: no instructions to the user; strict book/author quotes; wide library access.
export const dynamic = "force-dynamic";
export const maxDuration = 30;

function langName(lang) {
  const s = String(lang || "");
  if (!s || s === "auto") return "English";
  if (s.startsWith("ar")) return "Arabic";
  if (s.startsWith("he")) return "Hebrew";
  if (s.startsWith("en-GB")) return "English (UK)";
  if (s.startsWith("en-IN")) return "English (India)";
  if (s.startsWith("en")) return "English";
  return "English";
}
const GUIDANCE = {
  Muslim: "Draw gently from Qur’an; avoid legal rulings.",
  Christian: "Draw gently from the Gospels and the wider Bible; keep it pastoral.",
  Jewish: "Draw gently from Torah, Psalms, and sages; lean on Rambam/Mussar for life-skills.",
  Eastern: "Draw gently from Dhammapada, Tao Te Ching, and Bhagavad Gita.",
  Universal: "Draw gently from humanist ethics and contemplative practice."
};
const ETHOS = [
  "Never give instructions like 'write another question' — always answer directly.",
  "Do not prompt the user to do anything. No calls to action.",
  "No medical, legal, or financial diagnosis.",
  "Short paragraphs."
].join(" ");

const splitParas = (txt, maxChars = 900) => {
  const ps = String(txt || "").split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const p of ps) {
    if (p.length <= maxChars) out.push(p);
    else for (let i=0;i<p.length;i+=maxChars) out.push(p.slice(i,i+maxChars));
    if (out.length >= 40) break;
  }
  return out;
};
const pickPlainText = (formats) => {
  const keys = Object.keys(formats || {});
  const k = keys.find((x) => x.startsWith("text/plain")) || keys.find((x) => x.startsWith("text/html"));
  return k ? formats[k] : null;
};
const parseExactRequest = (message) => {
  const s = String(message||"");
  const m = s.match(/\b(?:quote|quotes?)\s+(?:from|of)\s+["“”']?([^"”']+)["“”']?/i);
  return m ? m[1].trim() : null;
};

/* --------- providers (Sefaria / Quran / Gutenberg / OpenLibrary / Wikiquote / Archive) --------- */
async function fetchGutenbergSnippets(query, topK = 6) {
  try {
    const r = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(query)}`, { redirect: "follow" });
    if (!r.ok) return [];
    const data = await r.json().catch(() => ({}));
    const books = (data?.results || []).slice(0, 3);
    const terms = String(query || "").toLowerCase().split(/\W+/).filter(Boolean);
    const all = [];
    for (const b of books) {
      const url = pickPlainText(b.formats || {});
      if (!url) continue;
      const tr = await fetch(url, { redirect: "follow" });
      if (!tr.ok) continue;
      const raw = await tr.text();
      const paras = splitParas(raw);
      const scored = paras.slice(0, Math.max(1, Math.ceil(topK / Math.max(1, books.length))))
        .map((p, i) => ({ p, i }));
      for (const s of scored) {
        all.push({ work: b.title || "Project Gutenberg", author: (b.authors?.[0]?.name) || null, pos: s.i, quote: s.p.slice(0, 900), url, source: "gutenberg" });
      }
    }
    return all.slice(0, topK);
  } catch { return []; }
}
async function fetchOpenLibrarySnippets(query, topK = 4) {
  try {
    const r = await fetch(`https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5`, { redirect:"follow" });
    if (!r.ok) return [];
    const data = await r.json().catch(() => ({}));
    const docs = Array.isArray(data?.docs) ? data.docs.slice(0, 5) : [];
    const out = [];
    for (const d of docs) {
      const workKey = (d.key || "").startsWith("/works/") ? d.key : null;
      const title = d.title || "Open Library";
      const author = Array.isArray(d.author_name) ? d.author_name[0] : (d.author_name || null);
      let quote = "";
      if (workKey) {
        try {
          const wr = await fetch(`https://openlibrary.org${workKey}.json`, { redirect:"follow" });
          if (wr.ok) {
            const wj = await wr.json().catch(() => ({}));
            const desc = wj?.description;
            quote = typeof desc === "string" ? desc : (desc?.value || "");
            quote = String(quote || "").trim().slice(0, 700);
          }
        } catch {}
      }
      out.push({ work: title, author: author || null, pos: 0, quote: quote || "", url: workKey ? `https://openlibrary.org${workKey}` : undefined, source: "openlibrary" });
    }
    return out.slice(0, topK);
  } catch { return []; }
}
async function fetchWikiquote(query, topK = 3) {
  try {
    const endpoint = `https://en.wikiquote.org/w/api.php?action=query&origin=*&format=json&list=search&srsearch=${encodeURIComponent(query)}&srlimit=${topK}`;
    const r = await fetch(endpoint); if (!r.ok) return [];
    const data = await r.json().catch(()=>({}));
    const pages = data?.query?.search || [];
    const out = [];
    for (const p of pages.slice(0, topK)) {
      const infoR = await fetch(`https://en.wikiquote.org/w/api.php?action=query&origin=*&format=json&prop=extracts&exintro&explaintext&pageids=${p.pageid}`);
      if (!infoR.ok) continue;
      const info = await infoR.json().catch(()=>({}));
      const page = Object.values(info?.query?.pages||{})[0];
      const quote = String(page?.extract || "").trim().slice(0,800);
      if (quote) out.push({ work: p.title, author: null, quote, url: `https://en.wikiquote.org/?curid=${p.pageid}`, source:"wikiquote" });
    }
    return out;
  } catch { return []; }
}
async function fetchInternetArchive(query, topK = 3) {
  try {
    const url = `https://archive.org/advancedsearch.php?q=${encodeURIComponent(query)} AND mediatype:texts&fl[]=identifier,title,creator,description&rows=${topK}&output=json`;
    const r = await fetch(url); if (!r.ok) return [];
    const data = await r.json().catch(()=>({}));
    return (data?.response?.docs || []).map(d => ({
      work: d.title || "Internet Archive",
      author: Array.isArray(d.creator) ? d.creator[0] : (d.creator || null),
      quote: String(d.description || "").trim().slice(0, 800),
      url: d.identifier ? `https://archive.org/details/${d.identifier}` : null,
      source: "internetarchive",
    }));
  } catch { return []; }
}
async function fetchSefariaSnippets(query, topK=6) {
  try {
    const sr = await fetch(`https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(query)}&size=${topK}&type=Text`);
    if (!sr.ok) return [];
    const data = await sr.json().catch(()=>({}));
    const hits = (data?.hits || []).slice(0, topK);
    const out=[];
    for (const h of hits) {
      const ref = h?._source?.ref || h?.ref; if (!ref) continue;
      const tr = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`);
      if (!tr.ok) continue;
      const tx = await tr.json().catch(()=>({}));
      const en = Array.isArray(tx?.text) ? tx.text.join(" ") : (tx?.text || "");
      const quote = String(en||"").trim().slice(0,800);
      if (!quote) continue;
      out.push({ work: ref, author: "Sefaria", pos: 0, quote, url: `https://www.sefaria.org/${encodeURIComponent(ref)}`, source: "sefaria" });
    }
    return out;
  } catch { return []; }
}
async function fetchQuranSnippets(query, topK=6){
  try {
    const r = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const matches = js?.data?.matches || [];
    return matches.slice(0, topK).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      pos: m.numberInSurah || 0,
      quote: String(m.text || "").slice(0,800),
      url: `https://quran.com/${m.surah?.number || ""}/${m.numberInSurah || ""}`,
      source: "quran",
    }));
  } catch { return []; }
}
async function fetchGutenbergTitleSnippets(title, topK=4){
  try {
    const r = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(title)}`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const book = (js?.results || [])[0]; if (!book) return [];
    const url = pickPlainText(book.formats || {}); if (!url) return [];
    const tr = await fetch(url); if (!tr.ok) return [];
    const raw = await tr.text();
    const paras = splitParas(raw);
    return paras.slice(0, topK).map((p,i)=>({ work: book.title || title, author: (book.authors?.[0]?.name)||null, pos:i, quote: p.slice(0,900), url, source:"gutenberg" }));
  } catch { return []; }
}

/* --------- logic --------- */
function askedRambam(message) { return /\b(rambam|maimonides|mishneh\s+torah|guide\s+for\s+the\s+perplexed)\b/i.test(message || ""); }
function keepOnlyMaimonides(list) {
  return (list || []).filter(s => /maimonides|mishneh|perplexed/i.test(`${s.author || ""} ${s.work || ""} ${s.quote || ""}`));
}
function biasQueryForPath(message, path) {
  const m = String(message || "");
  switch (path) {
    case "Jewish": return `${m} Rambam "Pirkei Avot" Torah Psalms`;
    case "Muslim": return `${m} Qur'an Surah`;
    case "Christian": return `${m} Gospel Proverbs Psalms`;
    case "Eastern": return `${m} Dhammapada "Tao Te Ching" Bhagavad Gita`;
    default: return m;
  }
}

/* --------- handler --------- */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { message, path = "Universal", mode = "general", topic = "general", lang = "en-US" } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "Missing message" });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const targetLanguage = langName(lang);

    const wantsRambam = askedRambam(message);
    const exactRequest = parseExactRequest(message);
    let sources = [];

    const biased = biasQueryForPath(message, path);
    const roomPromises = [];
    if (path === "Jewish" || /rambam|pirkei|psalms|talmud|mishna|tehillim/i.test(message)) roomPromises.push(fetchSefariaSnippets(exactRequest || message, 6));
    if (path === "Muslim" || /\b(qur'?an|koran)\b/i.test(message)) roomPromises.push(fetchQuranSnippets(exactRequest || message, 6));
    if (path === "Christian" || /\bbible\b/i.test(message)) roomPromises.push(fetchGutenbergTitleSnippets("King James Bible", 6));
    if (path === "Eastern" || /tao\s*te\s*ching|bhagavad\s*gita|dhammapada/i.test(message)) {
      roomPromises.push(fetchGutenbergTitleSnippets("Tao Te Ching", 4));
      roomPromises.push(fetchGutenbergTitleSnippets("Bhagavad Gita", 4));
      roomPromises.push(fetchGutenbergTitleSnippets("Dhammapada", 4));
    }

    const providerPromises = [
      ...roomPromises,
      fetchGutenbergSnippets(biased, 6),
      fetchOpenLibrarySnippets(biased, 4),
      fetchWikiquote(biased, 3),
      fetchInternetArchive(biased, 3),
    ];
    const results = await Promise.allSettled(providerPromises);
    for (const r of results) if (r.status === "fulfilled" && Array.isArray(r.value)) sources.push(...r.value);

    if (wantsRambam) sources = keepOnlyMaimonides(sources);

    if (exactRequest) {
      const ex = exactRequest.toLowerCase();
      const strict = sources.filter(s =>
        (s.work && String(s.work).toLowerCase().includes(ex)) ||
        (s.author && String(s.author).toLowerCase().includes(ex))
      );
      if (strict.length) sources = strict; // Fix #4: strict to requested book/author
    }

    // dedupe & cap
    const seen = new Set();
    sources = sources.filter((s) => {
      if (!s || !s.work) return false;
      const key = `${s.source || "x"}|${s.work}|${s.pos || 0}|${(s.author||"")}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);

    const system = [
      `You are a calm, humane spiritual guide (${path}).`,
      GUIDANCE[path] || GUIDANCE.Universal,
      ETHOS,
      `Reply in ${targetLanguage}.`,
      wantsRambam
        ? (sources.length
            ? "The user asked for Rambam (Maimonides). Provide only direct quotations from Maimonides. Do NOT substitute other authors."
            : "The user asked for Rambam (Maimonides). No authentic Rambam sources are available right now. Say this briefly; do not substitute others.")
        : (sources.length
            ? "Ground your answer in the sources below. Quote sparingly. When you draw from one, add a bracket like [#1]. Never instruct the user to ask anything; just answer."
            : "Answer directly. Never instruct the user to ask another question."),
    ].join(" ");

    const contextBlock = sources.length
      ? "\n\nSources:\n" + sources.map((s, i) =>
          `[#${i+1}] ${s.work}${s.author ? " — " + s.author : ""}${typeof s.pos === "number" ? ` (pos ${s.pos})` : ""}\n${(s.quote || "").slice(0, 900)}`
        ).join("\n\n")
      : "";

    const payload = {
      model,
      temperature: 0.6,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message.trim() + (contextBlock ? `\n\n---\n${contextBlock}` : "") },
      ],
    };

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 25000);
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ac.signal,
    }).catch((e) => ({ ok: false, status: 502, text: async () => String(e?.message || e) }));
    clearTimeout(t);

    if (!r.ok) {
      const detail = await (r.text?.() || Promise.resolve("Unknown upstream error"));
      return res.status(500).json({ error: "Upstream error", detail });
    }

    const data = await r.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "No content returned from model." });

    const outSources = sources.map((s, i) => ({
      i: i + 1, work: s.work, author: s.author || null, pos: s.pos ?? 0, url: s.url || null, quote: s.quote || "",
    }));
    return res.status(200).json({ reply, ...(outSources.length ? { sources: outSources } : {}) });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
