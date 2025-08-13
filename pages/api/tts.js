// FILE: /pages/api/tts.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

export default async function handler(req, res) {
  // Allow CORS + all normal verbs
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET,POST,OPTIONS");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    return res.status(204).end();
  }
  if (!["GET", "POST"].includes(req.method || "")) {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const text = req.method === "GET" ? String(req.query.text || "") : String(req.body?.text || "");
    const voice = req.method === "GET" ? String(req.query.voice || "alloy") : String(req.body?.voice || "alloy");
    if (!text.trim()) return res.status(400).json({ error: "Missing text" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const openai = new OpenAI({ apiKey });
    const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";

    // Some SDK builds require "format", others "response_format".
    let out;
    try {
      out = await openai.audio.speech.create({
        model, voice, input: text, format: "mp3",
      });
    } catch (e1) {
      // Fallback parameter name
      out = await openai.audio.speech.create({
        model, voice, input: text, response_format: "mp3",
      });
    }

    const buf = Buffer.from(await out.arrayBuffer());
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Access-Control-Allow-Origin", "*");
    return res.status(200).send(buf);
  } catch (err) {
    console.error("TTS error:", err);
    return res.status(500).json({ error: "tts_failed", detail: String(err?.message || err) });
  }
}
