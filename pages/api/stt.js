// FILE: /pages/api/stt.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

function detectLangFromText(s, fallback = "en-US") {
  const t = String(s || "");
  if (/[ء-ي]/.test(t)) return "ar";           // Arabic
  if (/[\u0590-\u05FF]/.test(t)) return "he"; // Hebrew
  if (/[\u0400-\u04FF]/.test(t)) return "ru"; // Russian
  if (/[\u4E00-\u9FFF]/.test(t)) return "zh"; // Chinese
  if (/[\u0900-\u097F]/.test(t)) return "hi"; // Hindi
  if (/[\u3040-\u30FF]/.test(t)) return "ja"; // Japanese
  if (/[\u0E00-\u0E7F]/.test(t)) return "th"; // Thai
  return fallback;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const { b64, mime = "audio/webm", lang = "auto" } = req.body || {};
    if (!b64) return res.status(400).json({ error: "Missing audio payload" });

    const openai = new OpenAI({ apiKey });

    // Decode base64 -> Buffer -> File (Node 18+ has global File/Blob/FormData)
    const buf = Buffer.from(b64, "base64");
    const file = new File([buf], `recording.${mime.includes("mp4") ? "mp4" : "webm"}`, { type: mime });

    // Use OpenAI transcription. Models that work: "whisper-1" (stable) or "gpt-4o-mini-transcribe".
    // Prefer whisper-1 for broad audio formats.
    const result = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      // If you ever want to force a hint, you can set language here using `language: "en"`
    });

    const text = (result?.text || "").trim();
    const detected = lang === "auto" ? detectLangFromText(text, "en-US") : lang;

    return res.status(200).json({ text, lang: detected });
  } catch (err) {
    console.error("STT error:", err);
    return res.status(500).json({ error: "stt_failed", detail: String(err?.message || err) });
  }
}
