// FILE: /pages/api/auracode-chat.js
// Scripture-first chat: answers are grounded in sacred sources with mandatory citations.
// Sources used:
//   - Jewish: Sefaria (refs + search)
//   - Muslim: alquran.cloud (ayah/surah)
//   - Christian: bible-api.com (KJV verses) + Gutenberg Fathers/Saints
//   - Eastern: Tao Te Ching / Bhagavad Gita / Dhammapada (Gutenberg)
// Strictly filters out .gov/CIA/etc and Gutenberg license text.

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/* ------------------------ utils ------------------------ */

const ok = (s) => !!(s && String(s).trim());
const norm = (s) => String(s || "").trim().replace(/\s+/g, " ");
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

const BAN = /(central intelligence agency|cia|foia|world factbook|\.gov\b|whitehouse|nsa|fbi)/i;
const ALLOWED = new Set([
  "sefaria.org","www.sefaria.org",
  "api.alquran.cloud",
  "bible-api.com","www.bible-api.com",
  "gutendex.com","www.gutendex.com",
  "gutenberg.org","www.gutenberg.org",
]);

const host = (u) => { try { return new URL(u).host.toLowerCase(); } catch { return ""; } };
const allow = (s) => {
  const all = `${s.work||""} ${s.author||""} ${s.url||""} ${s.quote||""}`.toLowerCase();
  if (BAN.test(all)) return false;
  const h = s.url ? host(s.url) : "";
  return !s.url || ALLOWED.has(h);
};

const looksLicense = (t = "") => {
  t = t.toLowerCase();
  return t.includes("project gutenberg") || t.includes("*** start of this") || t.includes("gutenberg license");
};

const pickPlainText = (fmts = {}) => {
  const k = Object.keys(fmts);
  const p = k.find((x) => x.startsWith("text/plain"));
  if (p) return fmts[p];
  const h = k.find((x) => x.startsWith("text/html"));
  return h ? fmts[h] : null;
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

/* -------------------- Jewish (Sefaria) -------------------- */

async function sefariaRef(ref) {
  try {
    const r = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(ref)}?context=0&commentary=0`);
    if (!r.ok) return null;
    const js = await r.json().catch(() => ({}));
    const en = Array.isArray(js?.text) ? js.text.join(" ") : js?.text || "";
    const quote = norm(en).slice(0, 700);
    if (!quote) return null;
    return { work: ref, author: "Tanakh / Sages", quote, url: `https://www.sefaria.org/${encodeURIComponent(ref)}`, pos: 0, source: "sefaria" };
  } catch { return null; }
}

async function sefariaSearch(q, topK = 4) {
  try {
    const sr = await fetch(`https://www.sefaria.org/api/search-wrap?q=${encodeURIComponent(q)}&size=${topK}&type=Text`);
    if (!sr.ok) return [];
    const data = await sr.json().catch(() => ({}));
    const hits = (data?.hits || []).slice(0, topK);
    const out = [];
    for (const h of hits) {
      const ref = h?._source?.ref || h?.ref;
      if (!ref) continue;
      const it = await sefariaRef(ref);
      if (it) out.push(it);
    }
    return out;
  } catch { return []; }
}

/* --------------------- Muslim (Qur'an) --------------------- */

async function quranAyah(surah, ayah) {
  try {
    const r = await fetch(`https://api.alquran.cloud/v1/ayah/${surah}:${ayah}/en.sahih`);
    if (!r.ok) return null;
    const js = await r.json().catch(() => ({}));
    const a = js?.data;
    if (!a?.text) return null;
    return {
      work: `Qur'an ${a?.surah?.englishName || a?.surah?.name || "Surah"} ${surah}:${ayah}`,
      author: "Qur'an",
      quote: norm(a.text),
      url: `https://quran.com/${surah}/${ayah}`,
      pos: ayah,
      source: "quran",
    };
  } catch { return null; }
}

async function quranSearch(q, topK = 6) {
  try {
    const r = await fetch(`https://api.alquran.cloud/v1/search/${encodeURIComponent(q)}/all/en`);
    if (!r.ok) return [];
    const js = await r.json().catch(() => ({}));
    const matches = js?.data?.matches || [];
    return matches.slice(0, topK).map((m, i) => ({
      work: `Qur'an ${m.surah?.englishName || m.surah?.name || "Surah"} ${m.surah?.number}:${m.numberInSurah}`,
      author: "Qur'an",
      quote: norm(m.text).slice(0, 700),
      url: `https://quran.com/${m.surah?.number || ""}/${m.numberInSurah || ""}`,
      pos: i,
      source: "quran",
    }));
  } catch { return []; }
}

/* ------------------ Christian (Bible + Fathers) ------------------ */

// Precise KJV verses via bible-api.com
async function kjvVerse(ref) {
  try {
    const r = await fetch(`https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`);
    if (!r.ok) return null;
    const js = await r.json().catch(() => ({}));
    const text = Array.isArray(js?.verses)
      ? js.verses.map((v) => v.text).join(" ").trim()
      : js?.text || "";
    if (!text) return null;
    return {
      work: `KJV ${js?.reference || ref}`,
      author: "Christian Scriptures",
      quote: norm(text),
      url: `https://bible-api.com/${encodeURIComponent(ref)}?translation=kjv`,
      pos: 0,
      source: "kjv",
    };
  } catch { return null; }
}

// Fathers/Saints via Gutenberg
async function gutenbergByTitle(title, take = 2) {
  try {
    const r = await fetch(`https://gutendex.com/books/?search=${encodeURIComponent(title)}`);
    if (!r.ok) return [];
    const js = await r.json().catch(() => ({}));
    const book = (js?.results || [])[0];
    if (!book) return [];
    const url = pickPlainText(book.formats || {});
    if (!url) return [];
    const tr = await fetch(url);
    if (!tr.ok) return [];
    const raw = await tr.text();
    const paras = String(raw || "")
      .replace(/\r/g, "")
      .split(/\n{2,}/g)
      .map((p) => norm(p))
      .filter((p) => p.length > 160 && p.length < 900 && !looksLicense(p));
    return paras.slice(0, take).map((p, i) => ({
      work: book.title || title,
      author: (book.authors?.[0]?.name) || "Saint",
      quote: p,
      url,
      pos: i,
      source: "gutenberg",
    }));
  } catch { return []; }
}

/* ---------------------- Eastern (classics) ---------------------- */

async function easternClassics(takeEach = 2) {
  const Tao = await gutenbergByTitle("Tao Te Ching", takeEach);
  const Gita = await gutenbergByTitle("Bhagavad Gita", takeEach);
  const Dham = await gutenbergByTitle("Dhammapada", takeEach);
  return [...Tao, ...Gita, ...Dham];
}

/* ------------------- routing & composition ------------------- */

const GUIDANCE = {
  Muslim: "Answer with compassion. Cite verses (e.g., Qur'an 112:1–4, 2:255) and classical wisdom. Avoid legal rulings.",
  Christian: "Answer pastorally. Cite the Gospels/NT where relevant (KJV) and optionally Fathers/Saints.",
  Jewish: "Answer with derech eretz. Cite Torah/Psalms/sages via Sefaria (e.g., Exodus 3:14, Deut 6:4).",
  Eastern: "Answer gently. Cite Tao Te Ching, Bhagavad Gita, Dhammapada where relevant.",
  Universal: "Answer humanely and ground in one or more sacred sources from the set you’re given.",
};

const ETHOS = [
  "Never tell the user to write another question—always answer directly.",
  "No medical, legal, or financial diagnosis.",
  "Use short, clear paragraphs.",
].join(" ");

function wantsGodConcept(message = "") {
  const t = message.toLowerCase();
  return /\bwho\s+is\s+(god|allah)\b/.test(t) || /\bwhat\s+is\s+(god|allah)\b/.test(t);
}

async function collectSources(message, path, maxPer = 6) {
  let out = [];

  if (path === "Muslim") {
    // Strong verses for “Who is God?”
    if (wantsGodConcept(message)) {
      const picks = await Promise.all([
        quranAyah(112, 1), quranAyah(112, 2), quranAyah(112, 3), quranAyah(112, 4), // Al-Ikhlas
        quranAyah(2, 255),  // Ayat al-Kursi
        quranAyah(57, 3),   // The First and the Last…
      ]);
      out = out.concat(picks.filter(Boolean));
    }
    // Query-based
    const q = message.replace(/\bgod\b/gi, "Allah");
    out = out.concat(await quranSearch(q, maxPer));
  }

  if (path === "Jewish") {
    if (wantsGodConcept(message)) {
      const picks = await Promise.all([
        sefariaRef("Genesis 1:1"),
        sefariaRef("Exodus 3:14"),
        sefariaRef("Deuteronomy 6:4"),
        sefariaRef("Psalms 23:1"),
      ]);
      out = out.concat(picks.filter(Boolean));
    }
    out = out.concat(await sefariaSearch(message, 4));
  }

  if (path === "Christian") {
    // Clear KJV verses
    const keyRefs = wantsGodConcept(message)
      ? ["John 1:1", "John 4:24", "1 John 4:8", "Revelation 1:8"]
      : [];
    const verses = await Promise.all(keyRefs.map(kjvVerse));
    out = out.concat(verses.filter(Boolean));
    // Gospels/NT via KJV (if none yet)
    if (!out.length) {
      const more = await Promise.all(["John 1:1", "Colossians 1:15-17"].map(kjvVerse));
      out = out.concat(more.filter(Boolean));
    }
    // Fathers/Saints
    out = out.concat(await gutenbergByTitle("The Imitation of Christ", 2));
    out = out.concat(await gutenbergByTitle("Confessions of Saint Augustine", 2));
  }

  if (path === "Eastern") {
    out = out.concat(await easternClassics(2));
  }

  if (path === "Universal") {
    // Blend of the above; prefer concept hits if asked
    if (wantsGodConcept(message)) {
      const picks = await Promise.all([
        // Jewish
        sefariaRef("Exodus 3:14"),
        // Muslim
        quranAyah(112, 1),
        // Christian
        kjvVerse("John 1:1"),
      ]);
      out = out.concat(picks.filter(Boolean));
    }
    out = out.concat(await quranSearch(message.replace(/\bgod\b/gi, "Allah"), 2));
    out = out.concat(await sefariaSearch(message, 2));
    out = out.concat(await gutenbergByTitle("Tao Te Ching", 2));
    out = out.concat(await gutenbergByTitle("Bhagavad Gita", 2));
    out = out.concat(await gutenbergByTitle("Dhammapada", 2));
  }

  // Clean, dedupe, cap
  const seen = new Set();
  out = out
    .filter((s) => s && allow(s) && ok(s.quote))
    .filter((s) => !looksLicense(s.quote))
    .filter((s) => {
      const key = `${s.source || "x"}|${s.work}|${s.pos || 0}|${s.url || ""}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });

  // Prefer 3–8 items
  const cap = clamp(out.length ? out.length : 0, 3, 8);
  return out.slice(0, cap);
}

/* ------------------------ handler ------------------------ */

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, path = "Universal", mode = "general", topic = "general", lang = "en-US" } = req.body || {};
    if (!ok(message)) return res.status(400).json({ error: "Missing message" });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    const model = process.env.NEXT_PUBLIC_OPENAI_MODEL || process.env.OPENAI_MODEL || "gpt-4o-mini";
    if (!OPENAI_API_KEY) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    // 1) Gather scripture sources first
    const sources = await collectSources(message, path);

    // If still nothing, say so (don’t hallucinate)
    if (!sources.length) {
      return res.status(200).json({
        reply:
          "I wasn’t able to find a suitable passage for that phrasing right now. " +
          "Try naming a specific book or verse (e.g., “Qur’an 112”, “Exodus 3:14”, “John 1:1”).",
        sources: [],
      });
    }

    // 2) Build strict instruction: answer must cite given sources [#1], [#2], …
    const targetLanguage = langName(lang);
    const sys = [
      `You are a calm, humane spiritual guide for the ${path} room.`,
      GUIDANCE[path] || GUIDANCE.Universal,
      ETHOS,
      `Reply in ${targetLanguage}.`,
      "You MUST ground your answer ONLY in the sources provided. Do not invent citations.",
      "When using a source, add a bracket like [#1] where it’s used.",
      "Keep 2–5 concise paragraphs.",
    ].join(" ");

    const contextBlock =
      "\n\nSources:\n" +
      sources
        .map(
          (s, i) =>
            `[#${i + 1}] ${s.work}${s.author ? " — " + s.author : ""}${
              typeof s.pos === "number" ? ` (pos ${s.pos})` : ""
            }\n${s.quote.slice(0, 900)}`
        )
        .join("\n\n");

    const payload = {
      model,
      temperature: 0.5,
      messages: [
        { role: "system", content: sys },
        { role: "user", content: norm(message) + contextBlock },
      ],
    };

    const ac = new AbortController();
    const kill = setTimeout(() => ac.abort(), 28000);
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
      quote: s.quote,
    }));

    return res.status(200).json({ reply, sources: outSources });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
