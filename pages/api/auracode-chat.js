// FILE: /pages/api/auracode-chat.js
// Works WITHOUT any database.
// OPTIONAL: If you later add Supabase + pgvector + the RPC `match_wisdom`, this will
// automatically ground answers in your wisdom corpus. If not configured, it still replies.
//
// Env required (now):
//   OPENAI_API_KEY
//
// Optional env (only if you later add retrieval):
//   SUPABASE_URL
//   SUPABASE_SERVICE_KEY
//
// Frontend sends: { message, path, mode, topic, lang, remoteSources? }

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
  "Never provide medical, legal, or financial diagnosis. Encourage qualified help when needed. Do not promise outcomes. Keep paragraphs short.";

/* ---------------- OPTIONAL retrieval (Supabase; safe to ignore if not set) ---------------- */

async function retrievePassages({ question, path, lang }) {
  const SUPABASE_URL = process.env.SUPABASE_URL || "";
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || "";
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY || "";

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || !OPENAI_API_KEY) return [];

  // 1) Embed question
  const embRes = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "text-embedding-3-large",
      input: question,
    }),
  });

  if (!embRes.ok) return [];
  const embJson = await embRes.json().catch(() => ({}));
  const embedding = embJson?.data?.[0]?.embedding;
  if (!embedding) return [];

  // 2) Call Supabase RPC (if present)
  const filter_lang = (String(lang || "en").startsWith("ar") && "ar") || "en";
  const rpcRes = await fetch(`${SUPABASE_URL}/rest/v1/rpc/match_wisdom`, {
    method: "POST",
    headers: {
      apikey: SUPABASE_SERVICE_KEY,
      Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify({
      query_embedding: embedding,
      match_count: 8,
      filter_path: path || "Universal",
      filter_lang,
    }),
  }).catch(() => null);

  if (!rpcRes || !rpcRes.ok) return [];
  const rows = await rpcRes.json().catch(() => []);
  // Expect rows: { work, author, chunk, url, pos, similarity }
  return Array.isArray(rows) ? rows.slice(0, 8) : [];
}

/* ---------------- main handler ---------------- */

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const {
      message,
      path = "Universal",
      mode = "general",
      topic = "general",
      lang = "en-US",
      // NEW: accept free web snippets gathered by the client (no-cost grounding)
      remoteSources = [], // [{work, author, pos, text, url}]
    } = req.body || {};

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

    // Try optional Supabase retrieval (safe no-op if not set)
    let passages = [];
    try { passages = await retrievePassages({ question: message, path, lang }); } catch { passages = []; }

    // Merge client-provided remoteSources (free web) + server passages; cap total to 8
    const merged = [
      ...(Array.isArray(remoteSources) ? remoteSources.map((p) => ({
        work: p.work || "—", author: p.author || null, pos: p.pos ?? 0, chunk: p.text || "", url: p.url || null
      })) : []),
      ...(Array.isArray(passages) ? passages : []),
    ].filter((p) => p && p.chunk && p.chunk.trim()).slice(0, 8);

    // Build optional context
    const contextBlock = merged.length
      ? "\n\nWisdom sources:\n" +
        merged
          .map((p, i) => `[#${i + 1}] ${p.work}${p.author ? " — " + p.author : ""} (${p.pos ?? 0})\n${p.chunk}`)
          .join("\n\n")
      : "";

    const system = [
      `You are a calm, humane spiritual guide (${path}).`,
      GUIDANCE[path] || GUIDANCE.Universal,
      TOPIC_PROMPTS[topic] || TOPIC_PROMPTS.general,
      MODE_PROMPTS[mode] || MODE_PROMPTS.general,
      ETHOS,
      `Reply in ${targetLanguage}.`,
      merged.length
        ? "Ground your answer in the wisdom sources below. Quote sparingly. If you use a passage, add a short bracket citation like [#1]."
        : "If you reference scripture or sages, do so generally (no hard citations) because no sources are attached for this question.",
    ]
      .filter(Boolean)
      .join(" ");

    const userContent =
      message.trim() +
      (contextBlock ? `\n\n---\n${contextBlock}` : "");

    const payload = {
      model,
      temperature: 0.6,
      messages: [
        { role: "system", content: system },
        { role: "user", content: userContent },
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

    // Include sources if we had any (won’t break UI)
    const sources =
      merged.length
        ? merged.map((p, i) => ({
            i: i + 1,
            work: p.work,
            author: p.author || null,
            pos: p.pos ?? 0,
            url: p.url || null,
          }))
        : [];

    return res.status(200).json({ reply, ...(sources.length ? { sources } : {}) });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
