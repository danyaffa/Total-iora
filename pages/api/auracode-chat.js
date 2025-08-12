// FILE: /pages/api/auracode-chat.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/* ---------- small utils ---------- */
const clamp = (s, n = 900) => String(s || "").slice(0, n);
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

const GUIDANCE = {
  Muslim: "Draw gently from the Qur’an and sound tradition; no legal rulings.",
  Christian: "Draw gently from the Gospels and wider Bible; keep it pastoral.",
  Jewish: "Draw gently from Torah, Psalms, and sages; lean on ethics/Mussar for life skills.",
  Eastern: "Draw gently from Dhammapada, Tao Te Ching, and Bhagavad Gita.",
  Universal: "Draw gently from shared wisdom and contemplative practice."
};

const ETHOS = [
  "Answer directly. Do NOT instruct the user to ask, write, or reformulate another question.",
  "No platform instructions, no meta talk (no 'as an AI').",
  "No medical, legal, or financial diagnosis. Offer supportive, general guidance only.",
  "Keep paragraphs short and clear. 6–10 sentences unless the user asks for more."
].join(" ");

/* ---------- allowlist & cleaning ---------- */
function allowSource(s) {
  const all = `${s?.work || ""} ${s?.author || ""} ${s?.url || ""}`.toLowerCase();
  const banned = /(central intelligence agency|cia|foia|world factbook|\.gov\b|whitehouse|nsa|fbi)/i;
  return !banned.test(all);
}

function isHTML(s){ return /<\s*html[\s>]/i.test(String(s||"")); }

function htmlToPlain(raw){
  let s = String(raw||"");
  s = s.replace(/<head[\s\S]*?<\/head>/gi," ")
       .replace(/<script[\s\S]*?<\/script>/gi," ")
       .replace(/<style[\s\S]*?<\/style>/gi," ")
       .replace(/<nav[\s\S]*?<\/nav>/gi," ")
       .replace(/<footer[\s\S]*?<\/footer>/gi," ")
       // ✅ FIX: The invalid empty regex `//g` is replaced with the correct one for HTML comments.
       .replace(//g," ");
  s = s.replace(/<\/(p|div|h[1-6]|li|section|br)>/gi,"\n\n")
       .replace(/<(p|div|h[1-6]|li|section|br)[^>]*>/gi,"\n");
  s = s.replace(/<[^>]+>/g," ");
  s = s.replace(/project\s+gutenberg[\s\S]*$/i," ");
  s = s.replace(/\r/g,"").replace(/[ \t]+\n/g,"\n").replace(/\n{3,}/g,"\n\n").replace(/[ \t]{2,}/g," ").trim();
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

/* ---------- fetch helpers with timeout ---------- */
async function withTimeout(run, ms = 12000) {
  const ac = new AbortController();
  const t = setTimeout(() => ac.abort(), ms);
  try { return await run(ac.signal); }
  finally { clearTimeout(t); }
}
async function getJSON(url, ms = 12000) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, { signal });
    if (!r.ok) return null;
    return await r.json().catch(() => null);
  }, ms);
}
async function getTEXT(url, ms = 12000) {
  return withTimeout(async (signal) => {
    const r = await fetch(url, { signal });
    if (!r.ok) return "";
    return await r.text().catch(() => "");
  }, ms);
}

/* ---------- providers (approved only) ---------- */
async function fetchSefariaSnippets(query, topK = 6) {
  try {
    const data = await getJSON(`https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(query)}&size=${topK}&type=Text`);
    const hits = (data?.hits || []).slice(0, topK);
    const out = [];
    for (const h of hits) {
      const ref = h?._source?.ref || h?.ref; if (!ref) continue;
      const tx = await getJSON(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`);
      const en = Array.isArray(tx?.text) ? tx.text.join(" ") : (tx?.text || "");
      const quote = cleanPara(en) || clamp(en, 800);
      if (!quote) continue;
      out.push({
        work: ref,
        author: "Sefaria",
        pos: 0,
        quote,
        url: SRC_LINK.sefaria(ref),
        source: "sefaria",
      });
      if (out.length >= topK) break;
    }
    return out.filter(allowSource);
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
      quote: clamp(m.text, 900),
      url: SRC_LINK.quran(m.surah?.number || "", m.numberInSurah || ""),
      source: "quran",
    })).filter(allowSource);
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
      quote: clamp(p, 900),
      url: landingURL,
      source:"gutenberg",
    })).filter(allowSource);
  } catch { return []; }
}

/* ---------- main handler ---------- */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, path = "Universal", mode = "gentle", topic = "general", lang = "en-US", maxSources = 8 } = req.body || {};
    if (!isOK(message)) return res.status(400).json({ error: "Missing message" });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const targetLanguage = langName(lang);

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

    const seen = new Set();
    sources = sources.filter((s) => {
      if (!s || !s.work) return false;
      const key = `${s.source || "x"}|${s.work}|${s.pos || 0}|${s.author || ""}|${(s.quote || "").slice(0, 60)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, Math.max(1, Math.min(Number(maxSources) || 8, 12)));

    const persona =
      path === "Jewish" ? "Rabbi" :
      path === "Christian" ? "Priest" :
      path === "Muslim" ? "Imam" :
      path === "Eastern" ? "Monk" : "Sage";

    const system = [
      `You are a ${persona} offering concise, compassionate guidance grounded in respected sacred texts.`,
      GUIDANCE[path] || GUIDANCE.Universal,
      ETHOS,
      `Style: ${mode}. Topic: ${topic}.`,
      `Reply in ${targetLanguage}.`,
      sources.length
        ? "Prefer the approved sources provided. If quoting, keep wording faithful and name the work with [#n]."
        : "No approved snippets matched; answer in your own words from tradition without inventing citations."
    ].join(" ");

    const contextBlock = sources.length
      ? "\n\nAPPROVED SOURCES:\n" + sources.map((s, i) =>
          `[#${i + 1}] ${s.work}${s.author ? " — " + s.author : ""}${typeof s.pos === "number" ? ` (pos ${s.pos})` : ""}\n${clamp(s.quote, 900)}`
        ).join("\n\n")
      : "";

    const payload = {
      model,
      temperature: 0.6,
      max_tokens: 520,
      messages: [
        { role: "system", content: system },
        { role: "user", content: String(message).trim() + contextBlock }
      ],
      response_format: { type: "text" }
    };

    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 25000);
    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ac.signal
    }).catch((e) => ({ ok: false, status: 502, text: async () => String(e?.message || e) }));
    clearTimeout(t);

    if (!upstream.ok) {
      const detail = await (upstream.text?.() || Promise.resolve("Unknown upstream error"));
      return res.status(502).json({ error: "Upstream error", detail });
    }

    const data = await upstream.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "No content returned from model." });

    const outSources = sources.map((s, i) => ({
      i: i + 1, work: s.work, author: s.author || null, pos: s.pos ?? 0, url: s.url || null, quote: s.quote || ""
    }));

    return res.status(200).json({ reply, ...(outSources.length ? { sources: outSources } : {}) });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: asText(err?.message || err) });
  }
}
