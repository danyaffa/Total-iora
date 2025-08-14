// FILE: /pages/api/stt.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

// quick language guess from result text (used for TTS routing)
function detectLangFromText(s, fallback = "en-US") {
  const t = String(s || "");
  if (/[ء-ي]/.test(t)) return "ar";
  if (/[\u0590-\u05FF]/.test(t)) return "he";
  if (/[\u0400-\u04FF]/.test(t)) return "ru";
  if (/[\u4E00-\u9FFF]/.test(t)) return "zh";
  if (/[\u0900-\u097F]/.test(t)) return "hi";
  if (/[\u3040-\u30FF]/.test(t)) return "ja";
  if (/[\u0E00-\u0E7F]/.test(t)) return "th";
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

    // base64 -> Buffer -> File (Node 18+ has File/Blob)
    const buf = Buffer.from(b64, "base64");
    const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
    const file = new File([buf], `recording.${ext}`, { type: mime });

    // Whisper is the most tolerant of formats
    const out = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
      // language: (lang && lang !== "auto") ? lang : undefined, // optional hint
    });

    const text = (out?.text || "").trim();
    const detected = lang === "auto" ? detectLangFromText(text, "en-US") : lang;

    res.status(200).json({ text, lang: detected });
  } catch (err) {
    console.error("STT error:", err);
    res.status(500).json({ error: "stt_failed", detail: String(err?.message || err) });
  }
}
