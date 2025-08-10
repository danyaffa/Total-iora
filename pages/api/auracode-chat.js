// FILE: /pages/api/auracode-chat.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

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
        hint: "Set OPENAI_API_KEY in Vercel → Project → Settings → Environment Variables, then redeploy.",
      });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const targetLanguage = langName(lang);

    const GUIDANCE = {
      Muslim:   "Draw gently from Qur’an and hadith where fitting, adab & akhlaq, and Sufi practice. Offer mercy and clarity.",
      Christian:"Draw gently from the Gospels, parables, virtues, Church Fathers, and the witness of the saints.",
      Jewish:   "Draw gently from Torah, Psalms, and sages. For life-skills, lean on Rambam (Hilchot De’ot) and Mussar middot.",
      Eastern:  "Draw gently from the Noble Eightfold Path, Taoist harmony, and Vedic disciplines like yamas/niyamas.",
      Universal:"Draw gently from humanist ethics and contemplative practice. Offer presence over promises.",
    };

    // *** ADDED THIS LOGIC TO MATCH THE FRONTEND ***
    const MODE_PROMPTS = {
      general:    "Your mode is one of gentle guidance. Be wise and reflective.",
      practical:  "Your mode is practical. Focus on providing clear, actionable steps.",
      wisdom:     "Your mode is to share timeless wisdom. Adopt the tone of a historian or scholar.",
      comfort:    "Your mode is comforting. Be exceptionally warm, empathetic, and reassuring.",
    };

    const TOPIC_PROMPTS = {
      general:      "Topic focus: general guidance for the present moment.",
      healthy:      "Topic focus: healthy living—sleep, simple movement, nourishing food, self-care. Avoid medical advice.",
      relationships:"Topic focus: human relationships—listening, boundaries, reconciliation, empathy.",
      partner:      "Topic focus: finding a life partner—character, shared values, patience, and practical steps to meet people.",
      work:         "Topic focus: work & purpose—meaningful contribution, integrity, and sustainable habits.",
      parenting:    "Topic focus: parenting—patience, modeling virtues, age-appropriate guidance.",
      grief:        "Topic focus: grief & healing—gentleness, permission to grieve, small rituals of remembrance.",
      addiction:    "Topic focus: addiction support (non-clinical). Encourage safe supports and professional help when needed.",
      mindfulness:  "Topic focus: mindfulness & calm—breath, presence, and simple contemplative practice.",
    };

    const ETHOS = "Never provide medical, legal, or financial diagnosis. Encourage qualified help if needed. Do not promise outcomes.";

    const system = [
      `You are a calm, humane spiritual guide (${path}).`,
      GUIDANCE[path] || GUIDANCE.Universal,
      TOPIC_PROMPTS[topic] || TOPIC_PROMPTS.general,
      // *** FIXED THIS LINE TO USE THE CORRECT VARIABLE ***
      MODE_PROMPTS[mode] || MODE_PROMPTS.general,
      ETHOS,
      `Reply in ${targetLanguage}. Keep paragraphs short.`,
    ].join(" ");

    const payload = {
      model,
      temperature: 0.8, // Simplified temperature
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
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

    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
