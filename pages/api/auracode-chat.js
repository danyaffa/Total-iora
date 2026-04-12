// FILE: /pages/api/auracode-chat.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";
import { withApi } from "../../lib/apiSecurity";
import { logger } from "../../lib/logger";
import { geminiChat, geminiAvailable } from "../../lib/gemini";

const log = logger.child({ fn: "api.auracode-chat" });

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
function curatedFallbackSources(message, path) {
  const want = (s) => new RegExp(s, "i").test(message || "");
  const out = [];

  // Jewish
  if (path === "Jewish" || path === "Universal") {
    out.push({
      work: "Micah 6:8",
      author: "Tanakh",
      quote: "He has told you, O man, what is good; and what does the LORD require of you but to do justice, to love kindness, and to walk humbly with your God?",
      url: "https://www.sefaria.org/Micah.6.8?lang=bi",
      source: "sefaria"
    });
    out.push({
      work: "Psalms 23",
      author: "Tehillim",
      quote: "The LORD is my shepherd; I shall not want…",
      url: "https://www.sefaria.org/Psalms.23?lang=bi",
      source: "sefaria"
    });
  }

  // Muslim
  if (path === "Muslim" || path === "Universal") {
    out.push({
      work: "Qur'an 2:186",
      author: "Qur'an",
      quote: "When My servants ask you concerning Me, indeed I am near…",
      url: "https://quran.com/2/186",
      source: "quran"
    });
    out.push({
      work: "Qur'an 16:90",
      author: "Qur'an",
      quote: "Indeed, Allah orders justice and good conduct and giving to relatives…",
      url: "https://quran.com/16/90",
      source: "quran"
    });
  }

  // Christian
  if (path === "Christian" || path === "Universal") {
    out.push({
      work: "John 13:34",
      author: "New Testament",
      quote: "A new commandment I give to you, that you love one another…",
      url: "https://www.biblegateway.com/passage/?search=John+13%3A34&version=KJV",
      source: "bible"
    });
    out.push({
      work: "Matthew 5:9",
      author: "New Testament",
      quote: "Blessed are the peacemakers, for they shall be called sons of God.",
      url: "https://www.biblegateway.com/passage/?search=Matthew+5%3A9&version=KJV",
      source: "bible"
    });
  }

  // Eastern
  if (path === "Eastern" || path === "Universal") {
    out.push({
      work: "Tao Te Ching 8",
      author: "Laozi",
      quote: "The supreme good is like water…",
      url: "https://taoistic.com/taoteching-laotzu-chapter-8.htm",
      source: "tao"
    });
    out.push({
      work: "Bhagavad Gita 2:47",
      author: "Vyasa",
      quote: "You have a right to perform your prescribed duty, but you are not entitled to the fruits of action.",
      url: "https://www.holy-bhagavad-gita.org/chapter/2/verse/47",
      source: "gita"
    });
  }

  // Light keyword routing (optional)
  if (want("love")) {
    out.unshift({
      work: "1 Corinthians 13",
      author: "New Testament",
      quote: "Love is patient, love is kind…",
      url: "https://www.biblegateway.com/passage/?search=1+Corinthians+13&version=KJV",
      source: "bible"
    });
  }

  return out.slice(0, 6);
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
const VALID_PATHS = new Set(["Muslim", "Christian", "Jewish", "Eastern", "Universal"]);

async function handler(req, res) {
  const {
    message,
    path: bodyPath,
    mode = "gentle",
    topic = "general",
    lang = "en-US",
    maxSources = 8,
    polish = false,
  } = req.body || {};

  // Resolve faith path — body wins (lets the user switch instantly),
  // then header (set by middleware), cookie, env, default.
  const candidates = [
    bodyPath,
    req.headers["x-faith"],
    req.cookies?.faith,
    process.env.FAITH_OVERRIDE,
    "Universal",
  ].map((v) => (v ? String(v).trim() : ""));

  const path =
    candidates.find((v) => VALID_PATHS.has(v)) || "Universal";

  if (!isOK(message)) return res.status(400).json({ error: "missing_message" });
  if (String(message).length > 4000) {
    return res.status(413).json({ error: "message_too_long" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  // Allow the handler to run even if OPENAI_API_KEY is missing, as long
  // as a Gemini key is configured — the fallback chain below will pick
  // it up. Only bail out if NEITHER provider is configured.
  if (!apiKey && !geminiAvailable()) {
    log.error("no_ai_provider_configured");
    return res.status(503).json({
      error: "service_unavailable",
      debug_hint: "No AI provider configured. Set OPENAI_API_KEY and/or GEMINI_API_KEY in Vercel env vars.",
    });
  }
  const openai = apiKey ? new OpenAI({ apiKey }) : null;
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

    // if external fetches found nothing, add curated fallback so the Source button is never empty
    if (!sources.length) {
      sources = curatedFallbackSources(message, path);
    }

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

    // Provider fallback chain: try OpenAI first, fall back to Gemini
    // on any failure. This keeps the user unblocked when one provider
    // has model-permission, quota, or auth issues.
    const chatMessages = [
      { role: "system", content: system },
      { role: "user", content: user },
      { role: "system", content: toolNote },
    ];
    let reply = "";
    let provider = null;
    let openaiError = null;
    let geminiError = null;

    if (openai) {
      try {
        const chat = await openai.chat.completions.create({
          model,
          temperature: 0.6,
          messages: chatMessages,
        });
        reply = chat?.choices?.[0]?.message?.content || "";
        if (reply) provider = "openai";
      } catch (err) {
        const status = err?.status || err?.response?.status || null;
        const errCode = err?.code || err?.error?.code || (status ? `http_${status}` : null);
        openaiError = `OpenAI chat failed (${errCode || "unknown"}): ${String(err?.message || err)}`;
        log.warn("openai_chat_failed_trying_gemini", { model, code: errCode, status });
      }
    } else {
      openaiError = "OPENAI_API_KEY not set";
    }

    if (!reply && geminiAvailable()) {
      try {
        reply = await geminiChat(chatMessages, { temperature: 0.6 });
        if (reply) provider = "gemini";
      } catch (err) {
        geminiError = String(err?.message || err);
        log.error("gemini_chat_failed", { error: geminiError });
      }
    }

    if (!provider) {
      const parts = [];
      if (openaiError) parts.push(openaiError);
      if (geminiError) parts.push(`Gemini fallback also failed: ${geminiError}`);
      if (!geminiAvailable() && openaiError) parts.push("No GEMINI_API_KEY set for fallback.");
      return res.status(503).json({
        error: "service_unavailable",
        debug_hint: parts.join(" | ") || "Both AI providers failed.",
      });
    }

    const payload = { reply, sources, provider };
    payload.citations = payload.sources;  // alias for UIs that expect `citations`
    return res.status(200).json(payload);
}

export default withApi(handler, {
  name: "api.auracode-chat",
  methods: ["POST"],
  rate: { max: 30, windowMs: 60_000 },
});
