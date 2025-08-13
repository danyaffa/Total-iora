// FILE: /pages/api/stt.js  (robust multilingual speech-to-text)
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { b64, mime = "audio/webm", lang = "auto" } = req.body || {};
    if (!b64) return res.status(400).json({ error: "Missing audio" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const openai = new OpenAI({ apiKey });

    const bytes = Buffer.from(b64, "base64");
    const file = new File([bytes], `clip.${mime.includes("mp4") ? "m4a" : "webm"}`, { type: mime });

    // pick the best available STT model
    const model = process.env.OPENAI_STT_MODEL || "gpt-4o-transcribe"; // fallback works with "whisper-1"
    const opts = { model, file };
    const base = String(lang || "auto").split("-")[0];
    if (base && base !== "auto") opts.language = base;

    const tr = await openai.audio.transcriptions.create(opts);
    res.status(200).json({ text: tr?.text || "" });
  } catch (err) {
    console.error("STT error:", err);
    res.status(500).json({ error: "stt_failed", detail: String(err?.message || err) });
  }
}
