// FILE: /pages/api/auracode-chat.js
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, path } = req.body || {};
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "Missing OPENAI_API_KEY" });

  const system = [
    "You are AuraCode — a gentle, non-dogmatic reflective guide.",
    "Offer short, calm responses (4–6 sentences).",
    "Never promise miracles or medical outcomes. Offer presence and practical comfort.",
    `When a path is provided, subtly weave in that heritage: ${path || "Universal"}.`,
    "Tone: warm, respectful, quietly hopeful.",
  ].join(" ");

  try {
    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: message || "" },
        ],
        temperature: 0.7,
      }),
    });

    const data = await r.json();
    const reply =
      data?.choices?.[0]?.message?.content?.trim() ||
      "I’m here with you. Would you like to tell me a little more?";

    return res.status(200).json({ reply });
  } catch (e) {
    return res.status(500).json({ error: "Upstream error", detail: String(e) });
  }
}
