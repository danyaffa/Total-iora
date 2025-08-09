// FILE: /pages/api/dna.js
// Creates the "Oracle Universe DNA" write-up.
// Requires: OPENAI_API_KEY in your project environment.

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { name = "", birth = "", place = "", path = "Universal", question = "" } = req.body || {};

    const ethos =
      "Offer warm, grounded guidance. No promises of outcomes. Avoid medical/legal/financial advice. Encourage qualified help when needed.";

    const frame = [
      `User: ${name || "Friend"}. Path: ${path}. Birth: ${birth || "—"}. Place: ${place || "—"}.`,
      `Concern: ${question || "General guidance request."}`,
      "Write in clear, short paragraphs with gentle titles.",
      "Sections to include:",
      "- Snapshot (tone like a horoscope, but humble)",
      "- Strengths & Shadows",
      "- Practices for 7 Days (numbered, concrete, 5–8 lines total)",
      "- A Blessing (2–4 lines)",
    ].join("\n");

    const tradition = {
      Muslim: "Use Qur’anic imagery, adab & akhlaq, and Sufi practices like dhikr and muraqabah when appropriate.",
      Christian: "Use Gospel themes, virtues, Fathers and saints, examen-like reflection.",
      Jewish: "Use Psalms, Rambam (Hilchot De’ot), Mussar middot (e.g., patience, humility), and gentle halachic mindfulness.",
      Eastern: "Use the Eightfold Path, metta, Taoist balance, and simple yoga/ayurvedic habits when fitting.",
      Universal: "Use humanist compassion, breath, journaling, and service.",
    }[path] || "";

    const system = `You are a gentle ${path} guide. ${tradition} ${ethos}`;

    const payload = {
      model: "gpt-4o-mini",
      temperature: 0.85,
      messages: [
        { role: "system", content: system },
        { role: "user", content: frame },
      ],
    };

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(500).json({ error: "Upstream error", detail: t });
    }

    const data = await r.json();
    const report = data?.choices?.[0]?.message?.content?.trim() || "I’m here with you.";
    return res.status(200).json({ report });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e?.message || e) });
  }
}
