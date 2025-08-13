// FILE: /pages/api/tts.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET,POST,OPTIONS");
    return res.status(204).end();
  }
  if (!["GET", "POST"].includes(req.method || "")) {
    res.setHeader("Allow", "GET,POST,OPTIONS");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const text = req.method === "GET" ? String(req.query.text || "") : String(req.body?.text || "");
    const voice = req.method === "GET" ? String(req.query.voice || "verse") : String(req.body?.voice || "verse");
    if (!text.trim()) return res.status(400).json({ error: "Missing text" });

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts"; // also works with "tts-1"

    const out = await openai.audio.speech.create({
      model,
      voice,          // multilingual voice
      input: text,    // any language string
      format: "mp3",
    });

    const buf = Buffer.from(await out.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).send(buf);
  } catch (err) {
    console.error("TTS error:", err?.status || "", err?.message || err);
    const status = Number(err?.status) || 500;
    return res.status(status).json({ error: "tts_failed", detail: String(err?.message || err) });
  }
}
