// FILE: /pages/api/auracode-chat.js
// Next.js API route that shapes the Oracle's behavior.
// Set OPENAI_API_KEY in your Vercel Project Settings > Environment Variables.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { message, path = "Universal", mode = "general", lang = "en-US" } = req.body || {};
    if (!message || typeof message !== "string") {
      return res.status(400).json({ error: "Missing message" });
    }

    const targetLanguage =
      String(lang || "").startsWith("ar") ? "Arabic" :
      String(lang || "").startsWith("he") ? "Hebrew" :
      "English";

    const GUIDANCE = {
      Muslim:   "Draw gently from Qur’an and hadith where fitting, adab & akhlaq, and Sufi practice. Offer mercy and clarity.",
      Christian:"Draw gently from the Gospels, parables, virtues, Church Fathers, and the witness of the saints.",
      Jewish:   "Draw gently from Torah, Psalms, and sages. For life-skills, lean on Rambam (Hilchot De’ot) and Mussar middot.",
      Eastern:  "Draw gently from the Noble Eightfold Path, Taoist harmony, and Vedic disciplines like yamas/niyamas.",
      Universal:"Draw gently from humanist ethics and contemplative practice. Offer presence over promises.",
    };

    const MODE_PROMPT =
      mode === "skills"
        ? "Respond as a practical coach grounded in the selected tradition. Offer 3–6 concrete steps or habits. Name specific practices. Keep it kind, brief, and doable today."
        : mode === "study"
        ? "Respond as a gentle study companion in the selected tradition. Provide a short explanation and mention 2–4 likely sources or authors in one line (no formal citations or links). Keep it concise."
        : "Respond as a compassionate spiritual guide in the selected tradition. Offer presence, clarity, and a short reflection.";

    const ETHOS =
      "Never provide medical, legal, or financial diagnosis. Encourage seeking qualified help if needed. Do not promise outcomes; offer presence, compassion, and clarity.";

    const system = [
      `You are a calm, humane spiritual guide (${path}).`,
      GUIDANCE[path] || GUIDANCE["Universal"],
      MODE_PROMPT,
      ETHOS,
      `Reply in ${targetLanguage}. Keep paragraphs short for easy reading.`,
    ].join(" ");

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: "Missing OPENAI_API_KEY" });
    }

    const payload = {
      model: "gpt-4o-mini",
      temperature: mode === "study" ? 0.7 : 0.8,
      messages: [
        { role: "system", content: system },
        { role: "user", content: message },
      ],
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(500).json({ error: "Upstream error", detail: text });
    }

    const data = await r.json();
    const reply = data?.choices?.[0]?.message?.content?.trim() || "I’m here with you.";
    return res.status(200).json({ reply });
  } catch (err) {
    return res.status(500).json({ error: "Server error", detail: String(err?.message || err) });
  }
}
