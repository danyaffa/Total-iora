// FILE: /pages/api/auracode-chat.js
// Robust Oracle backend: clearer errors, model override, short timeout.
// Requires OPENAI_API_KEY in env. Optional: OPENAI_MODEL (default gpt-4o-mini).

export const dynamic = "force-dynamic";      // don't cache
export const maxDuration = 30;               // Vercel function timeout budget (s)

function langName(lang) {
  const s = String(lang || "");
  if (s.startsWith("ar")) return "Arabic";
  if (s.startsWith("he")) return "Hebrew";
  if (s.startsWith("en-GB")) return "English (UK)";
  if (s.startsWith("en-IN")) return "English (India)";
  if (s.startsWith("en")) return "English";
  return "English";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { message, path = "Universal", mode = "general", lang = "en-US" } = req.body || {};
    if (!message || typeof message !== "string" || !message.trim()) {
      return res.status(400).json({ error: "Missing message" });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) {
      // Tell the UI exactly what's wrong (so you can fix env quickly)
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

    const MODE_PROMPT =
      mode === "skills" ? "Respond as a practical coach grounded in the selected tradition. Offer 3–6 concrete steps. Keep it kind and doable today."
    : mode === "study"  ? "Respond as a gentle study companion. Provide a short explanation and mention 2–4 likely sources/authors (no formal citations)."
                        : "Respond as a compassionate spiritual guide. Offer presence, clarity, and a short reflection.";

    const ETHOS = "Never provide medical, legal, or financial diagnosis. Encourage qualified help if needed. Do not promise outcomes.";

    const system = [
      `You are a calm, humane spiritual guide (${path}).`,
      GUIDANCE[path] || GUIDANCE.Universal,
      MODE_PROMPT,
      ETHOS,
      `Reply in ${targetLanguage}. Keep paragraphs short.`,
    ].join(" ");

    const payload = {
      model,
      temperature: mode === "study" ? 0.7 : 0.8,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
    };

    // Short, safe timeout so UI doesn't hang forever
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 25000);

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ac.signal,
    }).catch((e) => {
      // Network-level failure (DNS/timeout)
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
    // Final catch-all
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
