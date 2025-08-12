// FILE: /pages/api/auracode-chat.js
// Sacred-text whitelist only + paragraph filtering + per-room canon.
// Adds Fathers/Saints for Christian, honors “quote from <book>” asks,
// removes junk/license blobs, dedupes, and returns grounded sources.
// Response: { reply, sources?: [{i,work,author,pos,url,quote}] }

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/* --------------------- helpers --------------------- */

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
  Muslim: "Draw gently from Qur’an and classical wisdom; avoid legal rulings.",
  Christian: "Draw gently from the Gospels and early/medieval saints (Augustine, Kempis); keep it pastoral.",
  Jewish: "Draw gently from Torah, Psalms, and sages (Rambam/Mussar) for life-skills.",
  Eastern: "Draw gently from Dhammapada, Tao Te Ching, and Bhagavad Gita.",
  Universal: "Draw gently from humanist ethics and contemplative practice with sacred quotes for light grounding.",
};

const ETHOS = [
  "Never tell the user to write another question — always answer directly.",
  "No medical, legal, or financial diagnosis.",
  "Short paragraphs."
].join(" ");

const ALLOW_HOST = new Set([
  "sefaria.org","www.sefaria.org",
  "api.alquran.cloud","quran.com","www.quran.com",
  "gutenberg.org","www.gutenberg.org",
  "gutendex.com","www.gutendex.com",
]);

const BAN_RE = /(central intelligence agency|cia|foia|world factbook|\.gov\b|whitehouse|nsa|fbi)/i;

const pickPlainText = (fmts) => {
  const k = Object.keys(fmts || {});
  const t = k.find(x => x.startsWith("text/plain")) || k.find(x => x.startsWith("text/html"));
  return t ? fmts[t] : null;
};

function hostOf(u) { try { return new URL(u).host.toLowerCase(); } catch { return ""; } }

function looksLikeLicense(text="") {
  const t = text.toLowerCase();
  return (
    t.includes("project gutenberg") || t.includes("gutenberg license") ||
    t.includes("this ebook is for the use of anyone") ||
    t.includes("*** start of this") || t.includes("*** end of this") ||
    t.includes("release date:") || t.includes("language:") || t.includes("credits:")
  );
}

function allowSource(s) {
  const all = `${s.work||""} ${s.author||""} ${s.url||""} ${s.quote||""}`.toLowerCase();
  if (BAN_RE.test(all)) return false;
  if (looksLikeLicense(all)) return false;
  if (s.url && !ALLOW_HOST.has(hostOf(s.url))) return false;
  return true;
}

function cleanPara(p) {
  return String(p||"").replace(/\s+/g," ").trim();
}

/* If the user explicitly asks “quote from <book> …”, return a title hint */
function parseBookRequest(message) {
  const m = String(message||"");
  const re = /(quote|citation|verse|line)\s+(?:from|in)\s+["“]?([^"”\n]+)["”]?/i;
  const hit = m.match(re);
  if (!hit) return "";
  const raw = hit[2].trim();
  // quick normalization of popular works
  const map = {
    "bhagavad gita":"Bhagavad Gita",
    "gita":"Bhagavad Gita",
    "dhammapada":"Dhammapada",
    "tao te ching":"Tao Te Ching",
    "bible":"King James Bible",
    "king james":"King James Bible",
    "imitations of christ":"The Imitation of Christ",
    "the imitation of christ":"The Imitation of Christ",
    "confessions":"Confessions of Saint Augustine",
    "confessions of saint augustine":"Confessions of Saint Augustine",
    "meditations":"Meditations",
    "marcus aurelius meditations":"Meditations",
  };
  const k = raw.toLowerCase();
  return map[k] || raw;
}

/* --------------------- providers (approved) --------------------- */

async function fetchSefaria(query, topK=6) {
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
      const para = cleanPara(en).slice(0, 900);
      if (!para) continue;
      out.push({ work: ref, author: "Sefaria", pos: 0, quote: para, url: `https://www.sefaria.org/${encodeURIComponent(ref)}`, source: "sefaria" });
    }
    return out.filter(allowSource);
  } catch { return []; }
}

async function fetchQuran(query, topK=6){
  try {
    const r = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(query)}/all/en`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const matches = js?.data?.matches || [];
    return matches.slice(0, topK).map(m => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      pos: m.numberInSurah || 0,
      quote: cleanPara(m.text).slice(0, 900),
      url: `https://quran.com/${m.surah?.number || ""}/${m.numberInSurah || ""}`,
      source: "quran",
    })).filter(allowSource);
  } catch { return []; }
}

async function fetchGutenbergTitle(title, topK=6){
  try {
    const r = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(title)}`);
    if (!r.ok) return [];
    const js = await r.json().catch(()=>({}));
    const book = (js?.results || [])[0]; if (!book) return [];
    const url = pickPlainText(book.formats || {}); if (!url) return [];
    const tr = await fetch(url); if (!tr.ok) return [];
    const raw = await tr.text();
    const paras = String(raw||"").split(/\n{2,}/)
      .map(s=>cleanPara(s))
      .filter(Boolean)
      .filter(p => !looksLikeLicense(p))
      .filter(p => p.length > 80 && /[a-z]/i.test(p));
    // sample across the text for variety
    const want = Math.max(1, Math.min(topK, 10));
    const step = Math.max(1, Math.floor(paras.length / want));
    const picks = [];
    for (let i = (Date.now()%step); i < paras.length && picks.length < want; i += step) picks.push(paras[i]);
    return picks.map((p,i)=>({ work: book.title || title, author: (book.authors?.[0]?.name)||null, pos:i, quote: p.slice(0,900), url, source:"gutenberg" }))
      .filter(allowSource);
  } catch { return []; }
}

/* --------------------- handler --------------------- */

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, path = "Universal", mode = "general", topic = "general", lang = "en-US" } = req.body || {};
    const userText = (typeof message === "string" ? message : "").trim();
    if (!userText) return res.status(400).json({ error: "Missing message" });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const model = process.env.NEXT_PUBLIC_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
    const targetLanguage = langName(lang);

    // 1) Gather sacred sources (room-aligned)
    const tasks = [];
    const bookHint = parseBookRequest(userText);

    if (bookHint) {
      // user explicitly asked “quote from <book>”
      tasks.push(fetchGutenbergTitle(bookHint, 6));
    } else {
      switch (path) {
        case "Jewish":
          tasks.push(fetchSefaria(userText, 6));
          break;
        case "Muslim":
          tasks.push(fetchQuran(userText, 6));
          break;
        case "Christian":
          tasks.push(fetchGutenbergTitle("King James Bible", 4));                 // Gospels/Bible
          tasks.push(fetchGutenbergTitle("The Imitation of Christ", 2));          // Saints
          tasks.push(fetchGutenbergTitle("Confessions of Saint Augustine", 2));   // Fathers
          break;
        case "Eastern":
          tasks.push(fetchGutenbergTitle("Tao Te Ching", 4));
          tasks.push(fetchGutenbergTitle("Bhagavad Gita", 4));
          tasks.push(fetchGutenbergTitle("Dhammapada", 4));
          break;
        default: // Universal
          tasks.push(fetchQuran(userText, 3));
          tasks.push(fetchSefaria(userText, 3));
          tasks.push(fetchGutenbergTitle("King James Bible", 2));
          tasks.push(fetchGutenbergTitle("Tao Te Ching", 2));
          tasks.push(fetchGutenbergTitle("Bhagavad Gita", 2));
          tasks.push(fetchGutenbergTitle("Dhammapada", 2));
          break;
      }
    }

    const results = await Promise.allSettled(tasks);
    let sources = [];
    for (const r of results) if (r.status === "fulfilled" && Array.isArray(r.value)) sources = sources.concat(r.value);

    // 2) Dedupe + cap + enforce whitelist
    const seen = new Set();
    sources = sources.filter((s) => {
      const key = `${s.source||"x"}|${s.work}|${s.pos||0}|${s.author||""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return allowSource(s);
    }).slice(0, 8);

    // 3) Compose grounded prompt
    const system = [
      `You are a calm, humane spiritual guide (${path}).`,
      GUIDANCE[path] || GUIDANCE.Universal,
      `User-selected mode: ${mode}. Topic: ${topic}.`,
      ETHOS,
      `Reply in ${targetLanguage}.`,
      sources.length
        ? "Ground your answer in the sources below. Quote sparingly. When you draw from one, add a bracket like [#1]."
        : "Answer directly (no citations available).",
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
        { role: "user", content: userText + (contextBlock ? `\n\n---\n${contextBlock}` : "") },
      ],
    };

    // 4) Call OpenAI with timeout
    const ac = new AbortController();
    const kill = setTimeout(() => ac.abort(), 25000);
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ac.signal,
    }).catch((e) => ({ ok: false, status: 502, text: async () => String(e?.message || e) }));
    clearTimeout(kill);

    if (!r.ok) {
      const detail = await (r.text?.() || Promise.resolve("Unknown upstream error"));
      return res.status(500).json({ error: "Upstream error", detail });
    }

    const data = await r.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "No content returned from model." });

    const outSources = sources.map((s, i) => ({
      i: i + 1,
      work: s.work,
      author: s.author || null,
      pos: s.pos ?? 0,
      url: s.url || null,
      quote: s.quote || "",
    }));

    return res.status(200).json({ reply, ...(outSources.length ? { sources: outSources } : {}) });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
