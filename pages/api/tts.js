// FILE: /pages/api/tts.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

export default async function handler(req, res) {
  if (!["POST", "GET"].includes(req.method || "")) {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const text =
      req.method === "GET" ? String(req.query.text || "") : String(req.body?.text || "");
    const voice =
      req.method === "GET" ? String(req.query.voice || "verse") : String(req.body?.voice || "verse");

    if (!text.trim()) return res.status(400).json({ error: "Missing text" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";

    const out = await openai.audio.speech.create({
      model,
      voice,                 // multilingual voice
      input: text,           // the API will speak Arabic/Hebrew/etc automatically
      format: "mp3",
    });

    const buf = Buffer.from(await out.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(buf);
  } catch (err) {
    console.error("TTS error:", err);
    res.status(500).json({ error: "tts_failed", detail: String(err?.message || err) });
  }
}
