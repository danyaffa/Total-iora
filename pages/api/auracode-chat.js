// FILE: /pages/api/auracode-chat.js
// Works WITHOUT any database.
// Adds FREE retrieval from Project Gutenberg + Open Library (quotes + links).
// If later you add Supabase + pgvector + RPC `match_wisdom`, it will also ground to your corpus.
//
// Env now (required): OPENAI_API_KEY
// Optional later: SUPABASE_URL, SUPABASE_SERVICE_KEY
//
// Frontend sends: { message, path, mode, topic, lang }
// 2025-08-11 updates:
// - Bias retrieval to tradition (e.g., Rambam/Maimonides for Jewish path)
// - If user mentions Rambam/Maimonides, strongly prefer those quotes
// - Small prompt tweak: if ungrammatical input, you may briefly restate it first (also handled client-side)

export const dynamic = "force-dynamic";
export const maxDuration = 30;

/* ---------------- helpers ---------------- */

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
  Muslim:
    "Draw gently from Qur’an and Hadith where fitting, adab & akhlaq, and Sufi practice. Offer mercy and clarity.",
  Christian:
    "Draw gently from the Gospels, parables, virtues, the Fathers, and the witness of the saints.",
  Jewish:
    "Draw gently from Torah, Psalms, and sages. For life-skills, lean on Rambam (Hilchot De’ot) and Mussar middot.",
  Eastern:
    "Draw gently from the Noble Eightfold Path, Taoist harmony, and Vedic disciplines such as yamas/niyamas.",
  Universal:
    "Draw gently from humanist ethics and contemplative practice. Offer presence over promises.",
};

const MODE_PROMPTS = {
  general:   "Your mode is one of gentle guidance. Be wise and reflective.",
  practical: "Your mode is practical. Focus on clear, actionable steps.",
  wisdom:    "Your mode is timeless wisdom. Offer succinct, well-sourced insight.",
  comfort:   "Your mode is comforting. Be exceptionally warm, empathetic, and reassuring.",
};

const TOPIC_PROMPTS = {
  general:       "Topic: general guidance for the present moment.",
  healthy:       "Topic: healthy living—sleep, simple movement, nourishing food, self-care. Avoid medical advice.",
  relationships: "Topic: human relationships—listening, boundaries, reconciliation, empathy.",
  partner:       "Topic: finding a life partner—character, shared values, patience, and practical steps to meet people.",
  work:          "Topic: work & purpose—meaningful contribution, integrity, sustainable habits.",
  parenting:     "Topic: parenting—patience, modeling virtues, age-appropriate guidance.",
  grief:         "Topic: grief & healing—gentleness, permission to grieve, small rituals of remembrance.",
  addiction:     "Topic: addiction support (non-clinical). Encourage safe supports and professional help when needed.",
  mindfulness:   "Topic: mindfulness & calm—breath, presence, and simple contemplative practice.",
};

const ETHOS =
  "Never provide medical, legal, or financial diagnosis. Encourage qualified help when needed. Do not promise outcomes. Keep paragraphs short. If the user's wording is unclear or ungrammatical, you may briefly restate it first for clarity.";

/* ---------------- FREE web retrieval (no keys) ---------------- */

function splitParas(txt, maxChars = 900) {
  const ps = String(txt || "").split(/\n{2,}/).map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const p of ps) {
    if (p.length <= maxChars) out.push(p);
    else for (let i=0;i<p.length;i+=maxChars) out.push(p.slice(i,i+maxChars));
    if (out.length >= 40) break;
  }
  return out;
}
function scorePara(p, terms) {
  const s = p.toLowerCase();
  let sc = 0;
  for (const t of terms) if (s.includes(t)) sc += Math.min(10, t.length);
  const L = p.length; if (L > 160 && L < 800) sc += 20;
  return sc;
}
function pickPlainText(formats) {
  const keys = Object.keys(formats || {});
  const k = keys.find((x) => x.startsWith("text/plain")) || keys.find((x) => x.startsWith("text/html"));
  return k ? formats[k] : null;
}

// NEW: bias queries to tradition
function biasQueryForPath(message, path) {
  const m = String(message || "");
  switch (path) {
    case "Jewish":
      return `${m} Rambam Maimonides "Mishneh Torah" "Guide for the Perplexed"`;
    case "Muslim":
      return `${m} Qur'an Hadith Ghazali`;
    case "Christian":
      return `${m} Gospel Augustine Aquinas`;
    case "Eastern":
      return `${m} Dhammapada "Tao Te Ching" Bhagavad Gita`;
    default:
      return m;
  }
}

// Helper: filter to Rambam if explicitly requested
function filterForRambamIfAsked(sources, message, path) {
  const askRambam = /\b(rambam|maimonides|mishneh\s+torah|guide\s+for\s+the\s+perplexed)\b/i.test(message || "");
  if (!askRambam && path !== "Jewish") return sources;
  const pref = sources.filter((s) =>
    /maimonides|mishneh|perplexed/i.test(`${s.author || ""} ${s.work || ""} ${s.quote || ""}`)
  );
  // if we found any Rambam sources, prefer them; otherwise fall back to originals
  return pref.length ? pref.concat(sources.filter(x => !pref.includes(x))).slice(0, 8) : sources;
}

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
      const scored = paras
        .map((p, i) => ({ p, i, score: scorePara(p, terms) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, Math.max(1, Math.ceil(topK / Math.max(1, books.length))));
      for (const s of scored) {
        all.push({
          work: b.title || "Project Gutenberg",
          author: (b.authors?.[0]?.name) || null,
          pos: s.i,
          quote: s.p.slice(0, 900),
          url,
          source: "gutenberg",
        });
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
      // try brief description endpoints
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
      if (!quote && d.first_sentence) {
        quote = Array.isArray(d.first_sentence) ? d.first_sentence[0] : (d.first_sentence?.value || d.first_sentence || "");
        quote = String(quote || "").trim().slice(0, 300);
      }
      out.push({
        work: title,
        author: author || null,
        pos: 0,
        quote: quote || "",
        url: workKey ? `https://openlibrary.org${workKey}` : undefined,
        source: "openlibrary",
      });
    }
    return out.slice(0, topK);
  } catch { return []; }
}

/* ---------------- OPTIONAL Supabase retrieval ---------------- */

async function retrieveSupabase({ question, path, lang }) {
  const SUPABASE_URL = process.env.SUPABASE_URL || "";
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) return [];

  // 1) Embed
  const embRes = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "text-embedding-3-large", input: question }),
  });
  if (!embRes.ok) return [];
  const embJson = await embRes.json().catch(() => ({}));
  const embedding = embJson?.data?.[0]?.embedding;
  if (!embedding) return [];

  // 2) RPC
  const filter_lang = (String(lang || "en").startsWith("ar") && "ar") || "en";
  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_wisdom`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({ query_embedding: embedding, match_count: 8, filter_path: path || "Universal", filter_lang }),
  }).catch(() => null);

  if (!rpcRes || !rpcRes.ok) return [];
  const rows = await rpcRes.json().catch(() => []);
  return (rows || []).map((p, i) => ({
    work: p.work, author: p.author || null, pos: p.pos ?? 0,
    quote: String(p.chunk || "").slice(0, 900), url: p.url || null, source: "supabase"
  }));
}

/* ---------------- main handler ---------------- */

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, path = "Universal", mode = "general", topic = "general", lang = "en-US" } = req.body || {};

    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Missing message" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      return res.status(503).json({
        error: "Missing OPENAI_API_KEY",
        hint: "Set OPENAI_API_KEY in your environment, then redeploy.",
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const targetLanguage = langName(lang);

    // 1) Gather optional sources:
    let sources = [];
    // Supabase corpus (if you add it later)
    try { sources = sources.concat(await retrieveSupabase({ question: message, path, lang })); } catch {}

    // Free web, now biased to tradition
    const biased = biasQueryForPath(message, path);
    try { sources = sources.concat(await fetchGutenbergSnippets(biased, 6)); } catch {}
    try { sources = sources.concat(await fetchOpenLibrarySnippets(biased, 4)); } catch {}

    // Prefer Rambam when asked / Jewish path
    sources = filterForRambamIfAsked(sources, message, path);

    // De-dup and cap
    const seen = new Set();
    sources = sources.filter((s) => {
      const key = `${s.source}|${s.work}|${s.pos}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 8);

    // 2) Build prompt
    const system = [
      `You are a calm, humane spiritual guide (${path}).`,
      GUIDANCE[path] || GUIDANCE.Universal,
      TOPIC_PROMPTS[topic] || TOPIC_PROMPTS.general,
      MODE_PROMPTS[mode] || MODE_PROMPTS.general,
      ETHOS,
      `Reply in ${targetLanguage}.`,
      sources.length
        ? "Ground your answer in the sources below. Quote sparingly. When you draw from one, add a bracket like [#1]."
        : "If you reference scripture/sages, do so generally (no hard citations available).",
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
    }).catch((e) => {
      return { ok: false, status: 502, text: async () => String(e?.message || e) };
    });

    clearTimeout(t);

    if (!r.ok) {
      const detail = await (r.text?.() || Promise.resolve("Unknown upstream error"));
      return res.status(500).json({ error: "Upstream error", detail });
    }

    const data = await r.json().catch(() => ({}));
    const reply = data?.choices?.[0]?.message?.content?.trim();
    if (!reply) return res.status(502).json({ error: "No content returned from model." });

    // Return sources with stable indices + quotes
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
