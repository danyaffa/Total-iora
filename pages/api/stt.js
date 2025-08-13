export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { b64, audioChunk, mime = "audio/webm", lang = "auto" } = req.body || {};
    const base64 = b64 || audioChunk;
    if (!base64) return res.status(400).json({ error: "Missing audio data" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });
    const openai = new OpenAI({ apiKey });

    const buf = Buffer.from(base64, "base64");
    // Use Web File in Node 18+ (supported on Vercel)
    const file = new File([buf], `input.${(mime.split("/")[1] || "webm")}`, { type: mime });

    const tr = await openai.audio.transcriptions.create({
      file,
      model: process.env.OPENAI_STT_MODEL || "whisper-1",
      ...(lang && lang !== "auto" ? { language: lang } : {}),
      response_format: "json",
      temperature: 0.2,
    });

    const text = tr?.text || "";
    return res.status(200).json({ text, lang: tr?.language || lang || "auto" });
  } catch (err) {
    console.error("STT error:", err);
    return res.status(500).json({ error: "stt_failed", detail: String(err?.message || err) });
  }
}
