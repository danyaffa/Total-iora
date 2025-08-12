// FILE: /pages/api/auracode-chat.js
// Purpose: Answer a user message, grounded ONLY in approved sacred sources.
// Sources allowed: Sefaria (Tanakh/Talmud), alquran.cloud (Qur’an), Gutenberg (KJV Bible, Tao Te Ching, Bhagavad Gita, Dhammapada).
// Filters out government/.gov/FOIA/CIA/etc. Cleans Gutenberg paras to avoid TOCs and junk.
// NOTE: This updates your EXISTING page in-place (no new files).

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/* ---------- small utils ---------- */
const clamp = (s, n = 900) => String(s || "").slice(0, n);
const asText = (v) => (typeof v === "string" ? v : JSON.stringify(v || ""));
const isOK = (s) => !!(s && String(s).trim());

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
function keepEnglishBooks(list) { return (list || []).filter(b => (b.languages || []).includes("en")); }
function cleanPara(p) {
  const s = String(p || "").trim();
  if (s.length < 120) return "";
  if (/^\s*(contents|chapter|book|part|section|introduction|foreword|preface|index)\b/i.test(s)) return "";
  if (/[A-Z\s]{18,}/.test(s) && !/[a-z]/.test(s)) return ""; // all-caps headings/TOC
  return s;
}
const splitParas = (txt) => String(txt || "").split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
const pickPlainText = (fmts) => {
  const f = fmts || {};
  return f["text/plain; charset=utf-8"] || f["text/plain"] || f["text/html"] || null;
};

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
        url: `https://www.sefaria.org/${encodeURIComponent(ref)}`,
        source: "sefaria"
      });
      if (out.length >= topK) break;
    }
    return out.filter(allowSource);
  } catch { return []; }
}

async function fetchQuranSnippets(query, topK = 6) {
  try {
    const js = await getJSON(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`);
    const matches = js?.data?.matches || [];
    return matches.slice(0, topK).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      pos: m.numberInSurah || 0,
      quote: clamp(m.text, 900),
      url: `https://quran.com/${m.surah?.number || ""}/${m.numberInSurah || ""}`,
      source: "quran",
    })).filter(allowSource);
  } catch { return []; }
}

async function fetchGutenbergTitleSnippets(title, topK = 4) {
  try {
    const js = await getJSON(`https://gutendex.com/books/?search=${encodeURIComponent(title)}`);
    const list = keepEnglishBooks(js?.results || []);
    const book = list[0] || (js?.results || [])[0]; if (!book) return [];
    const url = pickPlainText(book.formats || {}); if (!url) return [];
    const raw = await getTEXT(url);
    const paras = splitParas(raw).map(cleanPara).filter(Boolean);
    return paras.slice(0, topK).map((p, i) => ({
      work: book.title || title,
      author: (book.authors?.[0]?.name) || null,
      pos: i,
      quote: clamp(p, 900),
      url,
      source: "gutenberg"
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

    // Sacred-first plan (room-aware)
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

    // de-dupe & cap
    const seen = new Set();
    sources = sources.filter((s) => {
      if (!s || !s.work) return false;
      const key = `${s.source || "x"}|${s.work}|${s.pos || 0}|${s.author || ""}|${(s.quote || "").slice(0, 60)}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, Math.max(1, Math.min(Number(maxSources) || 8, 12)));

    // system + user prompt
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
