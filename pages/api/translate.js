// FILE: /pages/api/translate.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const text   = String(req.body?.text || "");
    const target = String(req.body?.target || "English");
    if (!text.trim()) return res.status(400).json({ error: "Missing text" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const openai = new OpenAI({ apiKey });
    const model  = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const r = await openai.chat.completions.create({
      model,
      temperature: 0.2,
      messages: [
        { role: "system", content: `Translate faithfully into ${target}. Keep scripture names and proper nouns accurate.` },
        { role: "user",   content: text }
      ]
    });
    const out = r?.choices?.[0]?.message?.content || "";
    return res.status(200).json({ text: out });
  } catch (e) {
    return res.status(500).json({ error: "translate_failed", detail: String(e?.message || e) });
  }
}
