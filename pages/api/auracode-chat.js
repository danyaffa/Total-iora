// FILE: /pages/api/auracode-chat.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

/* ---------- utils ---------- */
const clamp = (s, n = 900) => String(s || "").slice(0, n);
const isOK = (s) => !!(s && String(s).trim());
const SRC_LINK = {
  sefaria: (ref) => `https://www.sefaria.org/${encodeURIComponent(ref)}?lang=bi`,
  quran:   (surahNum, ayahNum) => `https://quran.com/${surahNum}/${ayahNum}`,
  gutenberg: (bookId) => `https://www.gutenberg.org/ebooks/${bookId}`,
};
function langNameBCP47(tag) {
  const s = String(tag || "");
  if (!s || s === "auto") return "English";
  if (s.startsWith("ar")) return "Arabic";
  if (s.startsWith("he")) return "Hebrew";
  if (s.startsWith("ru")) return "Russian";
  if (s.startsWith("zh")) return "Chinese";
  if (s.startsWith("hi")) return "Hindi";
  if (s.startsWith("ja")) return "Japanese";
  if (s.startsWith("th")) return "Thai";
  if (s.startsWith("en-GB")) return "English (UK)";
  if (s.startsWith("en-IN")) return "English (India)";
  if (s.startsWith("en")) return "English";
  return "English";
}
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
       .replace(/<footer[\s\S]*?<\/footer>/gi," ");
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

/* ---------- providers ---------- */
async function fetchSefariaSnippets(query, topK = 6) {
  try {
    const data = await (await fetch(`https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(query)}&size=${topK}&type=Text`)).json();
    const hits = (data?.hits || []).slice(0, topK);
    const out = [];
    for (const h of hits) {
      const ref = h?._source?.ref || h?.ref; if (!ref) continue;
      const tx = await (await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`)).json();
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
    const lang = /[ء-ي]/.test(String(query||"")) ? "ar" : "en";
    const js = await (await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/${lang}`)).json();
    const matches = js?.data?.matches || [];
    return matches.slice(0, topK).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: lang === "ar" ? "القرآن" : "Qur'an",
      pos: m.numberInSurah || 0,
      quote: clamp(m.text, 900),
      url: SRC_LINK.quran(m.surah?.number || "", m.numberInSurah || ""),
      source: "quran",
    })).filter(allowSource);
  } catch { return []; }
}
async function fetchGutenbergTitleSnippets(title, topK = 4){
  try {
    const js = await (await fetch(`https://gutendex.com/books/?languages=en&search=${encodeURIComponent(title)}`)).json();
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
    const raw = await (await fetch(rawURL)).text();
    const plain = isHTML(raw) ? htmlToPlain(raw) : raw;
    const paras = String(plain||"").split(/\n{2,}/).map(s=>s.trim()).filter(Boolean).map(cleanPara).filter(Boolean);
    return paras.slice(0, topK).map((p,i)=>({
      work: book.title || title, author: (book.authors?.[0]?.name)||null, pos:i,
      quote: clamp(p, 900), url: landingURL, source:"gutenberg",
    })).filter(allowSource);
  } catch { return []; }
}

/* ---------- main handler ---------- */
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, path = "Universal", mode = "gentle", topic = "general", lang = "en-US", maxSources = 8, polish = false } = req.body || {};
    if (!isOK(message)) return res.status(400).json({ error: "Missing message" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });
    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const targetLanguage = langNameBCP47(lang);

    // sources by room
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
    sources = sources.slice(0, maxSources).filter(allowSource);

    const ETHOS = [
      "Answer directly. Do not instruct the user to reformulate another question.",
      "No platform instructions, no meta talk.",
      "No medical, legal, or financial diagnosis; offer supportive, general guidance only.",
      `Reply entirely in ${targetLanguage}. Keep paragraphs short.`,
    ].join(" ");

    const GUIDANCE = {
      Muslim: "Draw gently from the Qur’an and sound tradition; no legal rulings.",
      Christian: "Draw gently from the Gospels and wider Bible; keep it pastoral.",
      Jewish: "Draw gently from Torah, Psalms, and sages; lean on ethics/Mussar.",
      Eastern: "Draw gently from Dhammapada, Tao Te Ching, and Bhagavad Gita.",
      Universal: "Draw gently from shared wisdom and contemplative practice."
    };

    const system = `${ETHOS} ${GUIDANCE[path] || GUIDANCE.Universal}`;
    const user = [
      polish ? "Please polish the grammar of the question first, silently." : "",
      "Question:",
      message,
      sources.length ? "\nYou may optionally weave relevant short quotes from the sources list." : "",
    ].join("\n");

    const toolNote = sources.length
      ? "Sources list:\n" + sources.map((s,i)=>`[${i+1}] ${s.work}${s.author?` — ${s.author}`:""}${s.url?` <${s.url}>`:""}`).join("\n")
      : "No sources matched.";

    const chat = await openai.chat.completions.create({
      model,
      temperature: 0.6,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
        { role: "system", content: toolNote }
      ],
    });

    const reply = chat?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ reply, sources });
  } catch (e) {
    return res.status(500).json({ error: "chat_failed", detail: String(e?.message || e) });
  }
}
