// FILE: /pages/api/auracode-chat.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

const clamp = (s, n = 900) => String(s || "").slice(0, n);
const asText = (v) => (typeof v === "string" ? v : JSON.stringify(v || ""));
const isOK  = (s) => !!(s && String(s).trim());

const SRC_LINK = {
  sefaria:  (ref) => `https://www.sefaria.org/${encodeURIComponent(ref)}?lang=bi`,
  quran:    (surahNum, ayahNum) => `https://quran.com/${surahNum}/${ayahNum}`,
  gutenberg:(bookId) => `https://www.gutenberg.org/ebooks/${bookId}`,
};

function detectLangName(message, fallback = "English") {
  const t = String(message || "");
  if (/[؀-ۿ]/.test(t)) return "Arabic";
  if (/[\u0590-\u05FF]/.test(t)) return "Hebrew";
  if (/[а-яёґїі]/i.test(t)) return "Russian";
  return fallback;
}
const GUIDANCE = {
  Muslim:    "Draw gently from the Qur’an and sound tradition; no legal rulings.",
  Christian: "Draw gently from the Gospels and wider Bible; keep it pastoral.",
  Jewish:    "Draw gently from Torah, Psalms, and sages; lean on ethics/Mussar for life skills.",
  Eastern:   "Draw gently from Dhammapada, Tao Te Ching, and Bhagavad Gita.",
  Universal: "Draw gently from shared wisdom and contemplative practice."
};
const ETHOS = [
  "Answer directly. Do NOT instruct the user to ask, write, or reformulate another question.",
  "No platform instructions, no meta talk.",
  "No medical, legal, or financial diagnosis. Offer supportive, general guidance only.",
  "Keep paragraphs short and clear. 6–10 sentences unless the user asks for more."
].join(" ");

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
       .replace(/<header[\s\S]*?<\/header>/gi," ");
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
      out.push({ work: ref, author: "Sefaria", pos: 0, quote, url: SRC_LINK.sefaria(ref), source: "sefaria" });
      if (out.length >= topK) break;
    }
    return out.filter(allowSource);
  } catch { return []; }
}

async function fetchQuranSnippets(query, topK = 6){
  try {
    const isArabic = /[؀-ۿ]/.test(String(query || ""));
    if (isArabic) {
      const js = await getJSON(`https://api.quran.com/api/v4/search?q=${encodeURIComponent(query)}&size=${topK}&language=ar`);
      const matches = js?.results || js?.data?.matches || [];
      const out = (matches || []).slice(0, topK).map((m, i) => {
        const surah = m?.verse?.surah?.id || m?.surah_id || m?.chapter_id || "";
        const ayah = m?.verse_key ? Number(String(m.verse_key).split(":")[1]) : (m?.verse?.verse_number || m?.aya || 0);
        return {
          work: `القرآن ${m?.verse_key || `${surah}:${ayah}`}`,
          author: "Qur'an (Arabic)",
          pos: i,
          quote: clamp((m?.text || m?.verse?.text_uthmani || m?.verse?.text_indopak || "").trim(), 900),
          url: SRC_LINK.quran(surah || "", ayah || ""),
          source: "quran",
        };
      }).filter(allowSource);
      if (out.length) return out;
    }

    const js2 = await getJSON(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`);
    const matches2 = js2?.data?.matches || [];
    const out2 = matches2.slice(0, topK).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      pos: m.numberInSurah || 0,
      quote: clamp(m.text, 900),
      url: SRC_LINK.quran(m.surah?.number || "", m.numberInSurah || ""),
      source: "quran",
    })).filter(allowSource);
    if (out2.length) return out2;

    return [
      { work: "Qur'an 112:1–4 (Al-Ikhlas)", author: "Qur'an", pos: 0, quote: "", url: SRC_LINK.quran(112, 1), source: "quran" },
      { work: "Qur'an 2:255 (Ayat al-Kursi)", author: "Qur'an", pos: 1, quote: "", url: SRC_LINK.quran(2, 255), source: "quran" },
    ];
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
      work: book.title || title, author: (book.authors?.[0]?.name)||null, pos:i, quote: clamp(p, 900),
      url: landingURL, source:"gutenberg",
    })).filter(allowSource);
  } catch { return []; }
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, path = "Universal", mode = "gentle", topic = "general", lang = "auto", polish = false, maxSources = 8 } = req.body || {};
    if (!isOK(message)) return res.status(400).json({ error: "Missing message" });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const targetLanguage = (lang && lang !== "auto") ? lang : detectLangName(message, "English");

    const tasks = [];
    if (path === "Jewish")     tasks.push(fetchSefariaSnippets(message, 6));
    if (path === "Muslim")     tasks.push(fetchQuranSnippets(message, 6));
    if (path === "Christian")  tasks.push(fetchGutenbergTitleSnippets("King James Bible", 6));
    if (path === "Eastern")   { tasks.push(fetchGutenbergTitleSnippets("Tao Te Ching", 4)); tasks.push(fetchGutenbergTitleSnippets("Bhagavad Gita", 4)); tasks.push(fetchGutenbergTitleSnippets("Dhammapada", 4)); }
    if (path === "Universal") { tasks.push(fetchGutenbergTitleSnippets("Tao Te Ching", 2)); tasks.push(fetchGutenbergTitleSnippets("Bhagavad Gita", 2)); tasks.push(fetchGutenbergTitleSnippets("Dhammapada", 2)); tasks.push(fetchSefariaSnippets(message, 2)); tasks.push(fetchQuranSnippets(message, 2)); }

    const settled = await Promise.allSettled(tasks);
    let sources = [];
    for (const r of settled) if (r.status === "fulfilled" && Array.isArray(r.value)) sources = sources.concat(r.value);

    const seen = new Set();
    sources = sources.filter((s) => {
      if (!s || !s.work) return false;
      const key = `${s.source || "x"}|${s.work}|${s.pos || 0}|${s.author || ""}|${(s.quote || "").slice(0, 60)}`;
      if (seen.has(key)) return false; seen.add(key); return true;
    }).slice(0, maxSources);

    const sys = [
      `You are a ${path === "Muslim" ? "gentle Imam" : path === "Jewish" ? "gentle Rabbi" : path === "Christian" ? "gentle Priest" : path === "Eastern" ? "gentle Monk" : "kind Sage"}.`,
      GUIDANCE[path] || GUIDANCE.Universal,
      `Speak in ${targetLanguage}.`, ETHOS
    ].join(" ");

    const openai = (await import("openai")).default;
    const client = new openai({ apiKey: OPENAI_API_KEY });

    const srcDigest = sources.slice(0, 8).map((s,i)=>`[${i+1}] ${s.work}${s.author ? " — " + s.author : ""}${s.quote ? ` — “${clamp(s.quote,180)}”` : ""}`).join("\n");

    const messages = [
      { role: "system", content: sys },
      { role: "user",   content: `Question:\n${asText(message)}\n\nContext snippets (optional):\n${srcDigest || "(none)"}\n\nMode: ${mode}; Topic: ${topic}; Grammar polish: ${polish ? "yes" : "no"};` }
    ];

    const resp = await client.chat.completions.create({
      model,
      temperature: 0.6,
      messages
    });

    const reply = resp?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply, sources, citations: [] });
  } catch (e) {
    return res.status(500).json({ error: "chat_failed", detail: String(e?.message || e) });
  }
}
