// FILE: /pages/api/translate.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const { text, target } = req.body || {};
    const src = String(text || "").trim();
    const tgt = String(target || "").trim();
    if (!src || !tgt) return res.status(400).json({ error: "Missing text/target" });

    const openai = new OpenAI({ apiKey });
    const r = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0,
      messages: [
        { role: "system", content: `Translate the user's text. Output ONLY the translation in ${tgt}.` },
        { role: "user", content: src },
      ],
    });

    const out = r?.choices?.[0]?.message?.content?.trim() || "";
    res.status(200).json({ text: out });
  } catch (err) {
    console.error("Translate error:", err);
    res.status(500).json({ error: "translate_failed", detail: String(err?.message || err) });
  }
}
