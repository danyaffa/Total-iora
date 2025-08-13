// FILE: /pages/api/tts.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method === "OPTIONS") {
    res.setHeader("Allow", "GET,POST,OPTIONS");
    return res.status(204).end();
  }
  if (!["POST", "GET"].includes(req.method || "")) {
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const text = req.method === "GET" ? String(req.query.text || "") : String(req.body?.text || "");
    const voice = req.method === "GET" ? String(req.query.voice || "verse") : String(req.body?.voice || "verse");
    if (!text.trim()) return res.status(400).json({ error: "Missing text" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const openai = new OpenAI({ apiKey });
    const tryModels = [
      process.env.OPENAI_TTS_MODEL || "tts-1",
      "gpt-4o-mini-tts"
    ];

    let arrayBuf = null;
    let lastErr = null;

    for (const model of tryModels) {
      try {
        // First try with response_format (newer SDKs)
        let out = await openai.audio.speech.create({
          model, voice, input: text, response_format: "mp3"
        });
        arrayBuf = await out.arrayBuffer();
        break;
      } catch (e1) {
        try {
          // Fallback to format (older SDKs)
          let out2 = await openai.audio.speech.create({
            model, voice, input: text, format: "mp3"
          });
          arrayBuf = await out2.arrayBuffer();
          break;
        } catch (e2) {
          lastErr = e2;
        }
      }
    }

    if (!arrayBuf) throw lastErr || new Error("TTS generation failed");

    const buf = Buffer.from(arrayBuf);
    res.setHeader("Content-Type", "audio/mpeg");
    res.setHeader("Cache-Control", "no-store");
    res.status(200).send(buf);
  } catch (err) {
    res.status(500).json({ error: "tts_failed", detail: String(err?.message || err) });
  }
}
