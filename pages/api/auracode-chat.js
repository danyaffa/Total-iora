 // FILE: /pages/api/auracode-chat.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/* ---------- utils ---------- */
const clip = (s, n = 900) => String(s || "").trim().slice(0, n);
const asText = (v) => (typeof v === "string" ? v : JSON.stringify(v || ""));
const isOK = (s) => !!(s && String(s).trim());

const SRC_LINK = {
  sefaria: (ref) => `https://www.sefaria.org/${encodeURIComponent(ref)}?lang=bi`,
  quran:   (surahNum, ayahNum) => `https://quran.com/${surahNum}/${ayahNum}`,
  gutenberg: (bookId) => `https://www.gutenberg.org/ebooks/${bookId}`,
};

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

/* ---------- HTTP helpers ---------- */
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

/* ---------- HTML → text ---------- */
function isHTML(s){ return /<\s*html[\s>]/i.test(String(s||"")); }
function htmlToPlain(raw){
  let s = String(raw||"");
  s = s.replace(/<head[\s\S]*?<\/head>/gi," ").replace(/<script[\s\S]*?<\/script>/gi," ")
       .replace(/<style[\s\S]*?<\/style>/gi," ").replace(/<nav[\s\S]*?<\/nav>/gi," ")
       .replace(/<footer[\s\S]*?<\/footer>/gi," ");
  s = s.replace(/<\/(p|div|h[1-6]|li|section|br)>/gi,"\n\n")
       .replace(/<(p|div|h[1-6]|li|section|br)[^>]*>/gi,"\n")
       .replace(/<[^>]+>/g," ")
       .replace(/project\s+gutenberg[\s\S]*$/i," ")
       .replace(/\r/g,"").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").replace(/[ \t]{2,}/g," ")
       .trim();
  return s;
}
function cleanPara(p) {
  const s = String(p || "").trim();
  if (s.length < 120) return "";
  if (/^\s*(contents|table of contents|chapter|book|part|section|introduction|foreword|preface|index|license)\b/i.test(s)) return "";
  if (/[A-Z\s]{18,}/.test(s) && !/[a-z]/.test(s)) return "";
  if (/project\s+gutenberg/i.test(s)) return "";
  return s;
}

/* ---------- sacred fetchers ---------- */
async function fetchSefariaSnippets(query, topK = 6) {
  try {
    const data = await getJSON(`https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(query)}&size=${topK}&type=Text`);
    const hits = (data?.hits || []).slice(0, topK);
    const out = [];
    for (const h of hits) {
      const ref = h?._source?.ref || h?.ref; if (!ref) continue;
      const tx = await getJSON(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`);
      const en = Array.isArray(tx?.text) ? tx.text.join(" ") : (tx?.text || "");
      const quote = cleanPara(en) || clip(en, 800);
      if (!quote) continue;
      out.push({ work: ref, author: "Sefaria", pos: 0, quote, url: SRC_LINK.sefaria(ref), source: "sefaria" });
      if (out.length >= topK) break;
    }
    return out;
  } catch { return []; }
}
async function fetchQuranSnippets(query, topK = 6){
  try {
    const js = await getJSON(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`);
    const matches = js?.data?.matches || [];
    return matches.slice(0, topK).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      pos: m.numberInSurah || 0,
      quote: clip(m.text, 900),
      url: SRC_LINK.quran(m.surah?.number || "", m.numberInSurah || ""),
      source: "quran",
    }));
  } catch { return []; }
}
async function fetchGutenbergTitleSnippets(title, topK = 4){
  try {
    const js = await getJSON(`https://gutendex.com/books/?languages=en&search=${encodeURIComponent(title)}`);
    const results = js?.results || [];
    if (!results.length) return [];
    const want = new RegExp(title.replace(/\s+/g, ".*"), "i");
    results.sort((a,b) => (want.test(a.title||"")?0:1) - (want.test(b.title||"")?0:1));
    const book = results[0]; if (!book) return [];
    const fmts = book.formats || {};
    const rawURL =
      (fmts["text/plain; charset=utf-8"] && !/\.zip$/i.test(fmts["text/plain; charset=utf-8"])) ? fmts["text/plain; charset=utf-8"] :
      (fmts["text/plain"] && !/\.zip$/i.test(fmts["text/plain"])) ? fmts["text/plain"] :
      (fmts["text/html; charset=utf-8"] && !/\.zip$/i.test(fmts["text/html; charset=utf-8"])) ? fmts["text/html; charset=utf-8"] :
      (fmts["text/html"] && !/\.zip$/i.test(fmts["text/html"])) ? fmts["text/html"] : null;
    if (!rawURL) return [];
    const landingURL = SRC_LINK.gutenberg(book.id);
    const raw = await getTEXT(rawURL);
    const plain = isHTML(raw) ? htmlToPlain(raw) : raw;
    const paras = String(plain||"").split(/\n{2,}/).map(s=>s.trim()).filter(Boolean).map(cleanPara).filter(Boolean);
    return paras.slice(0, topK).map((p,i)=>({
      work: book.title || title,
      author: (book.authors?.[0]?.name)||null,
      pos:i,
      quote: clip(p, 900),
      url: landingURL,
      source:"gutenberg",
    }));
  } catch { return []; }
}

/* ---------- main handler ---------- */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : (req.body || {});
    const { message, path = "Universal", mode = "gentle", topic = "general", lang = "en-US", maxSources = 8 } = body;
    if (!isOK(message)) return res.status(400).json({ error: "Missing message" });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const targetLanguage = langName(lang);

    // sacred-first source plan
    const tasks = [];
    if (path === "Jewish") tasks.push(fetchSefariaSnippets(message, 6));
    if (path === "Muslim") tasks.push(fetchQuranSnippets(message, 6));
    if (path === "Christian") tasks.push(fetchGutenbergTitleSnippets("King James Bible", 6));
    if (path === "Eastern") {
      tasks.push(fetchGutenbergTitleSnippets("Tao Te Ching", 4));
      tasks.push(fetchGutenbergTitleSnippets("Bhagavad Gita", 4));
      tasks.push(fetchGutenbergTitleSnippets("Dhammapada", 4));
    }
    if (path === "Universal") {
      tasks.push(fetchGutenbergTitleSnippets("Tao Te Ching", 2));
      tasks.push(fetchGutenbergTitleSnippets("Bhagavad Gita", 2));
      tasks.push(fetchGutenbergTitleSnippets("Dhammapada", 2));
      tasks.push(fetchSefariaSnippets(message, 2));
      tasks.push(fetchQuranSnippets(message, 2));
    }

    const settled = await Promise.allSettled(tasks);
    let sources = [];
    for (const r of settled) if (r.status === "fulfilled" && Array.isArray(r.value)) sources = sources.concat(r.value);

    // de-dupe + cap
    const seen = new Set();
    const manifest = sources.filter((s) => {
      if (!s || !s.work) return false;
      const key = `${s.source || "x"}|${s.work}|${s.pos || 0}|${s.author || ""}|${(s.quote || "").slice(0, 60)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, Math.max(1, Number(maxSources) || 8));

    // human block + numbering
    const sourceBlock = manifest.map((s, i) => {
      const head = `[${i + 1}] ${s.work}${s.author ? ` — ${s.author}` : ""}`;
      return `${head}\n${clip(s.quote, 500)}`;
    }).join("\n\n");

    const system = [
      `You are the Total-iora Guide for the "${path}" room.`,
      `Answer in ${targetLanguage}. Keep it kind and concise.`,
      `You are given SOURCE EXCERPTS, each numbered [n]. Only cite from them.`,
      `Return STRICT JSON only:\n{"answer":"<120–180 words>", "citations":[{"index":n,"exact_quote":"<≤120w>","reason":"<≤20w>"}]}`
    ].join(" ");

    const userMsg = [
      `USER QUESTION: ${asText(message)}`,
      `STYLE: ${mode} | TOPIC: ${topic}`,
      manifest.length ? `\n\nSOURCE EXCERPTS:\n${sourceBlock}` : "\n\nSOURCE EXCERPTS:\n(none)"
    ].join("");

    const aiRes = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages: [
          { role: "system", content: system },
          { role: "user", content: userMsg }
        ]
      })
    });

    if (!aiRes.ok) {
      const errTxt = await aiRes.text().catch(() => "");
      return res.status(502).json({ error: "Upstream error", detail: errTxt, sources: manifest });
    }

    const data = await aiRes.json().catch(() => ({}));
    const raw = data?.choices?.[0]?.message?.content || "{}";

    // parse strict JSON
    let parsed = null;
    try {
      const m = String(raw).match(/\{[\s\S]*\}$/);
      parsed = JSON.parse(m ? m[0] : raw);
    } catch { parsed = null; }

    const answer = parsed?.answer || "I’m here with you.";
    const citationsIn = Array.isArray(parsed?.citations) ? parsed.citations : [];

    const citations = citationsIn.map((c) => {
      const idx = Number(c?.index);
      const item = Number.isInteger(idx) && idx >= 1 && idx <= manifest.length ? manifest[idx - 1] : null;
      if (!item) return null;
      return {
        index: idx,
        work: item.work,
        author: item.author || null,
        url: item.url || "",
        quote: String(c?.exact_quote || item.quote || "").trim(),
        reason: String(c?.reason || "").trim(),
        source: item.source || null
      };
    }).filter(Boolean);

    return res.status(200).json({ path, reply: answer, citations, sources: manifest });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e?.message || e) });
  }
}
