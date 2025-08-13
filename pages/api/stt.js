// FILE: /pages/api/stt.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";
import { toFile } from "openai/uploads";

// crude script-based detector to tag the audio language if client sends "auto"
function guessBCP47(text) {
  const s = String(text || "");
  if (/[ء-ي]/.test(s)) return "ar";
  if (/[\u0590-\u05FF]/.test(s)) return "he";
  if (/[\u0400-\u04FF]/.test(s)) return "ru";
  if (/[\u4E00-\u9FFF]/.test(s)) return "zh";
  if (/[\u0900-\u097F]/.test(s)) return "hi";
  if (/[\u3040-\u30FF]/.test(s)) return "ja";
  if (/[\u0E00-\u0E7F]/.test(s)) return "th";
  return "en-US";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { b64, mime = "audio/webm", lang = "auto" } = req.body || {};
    if (!b64) return res.status(400).json({ error: "Missing audio (b64)" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const buf = Buffer.from(b64, "base64");
    const filename =
      mime.includes("mp4") || mime.includes("aac") ? "audio.mp4" :
      mime.includes("ogg") ? "audio.ogg" :
      mime.includes("wav") ? "audio.wav" :
      "audio.webm";

    const openai = new OpenAI({ apiKey });

    // model notes:
    // - "gpt-4o-mini-transcribe" auto-detects language and works well on webm/ogg/mp4
    // - you can switch to "whisper-1" if you prefer
    const model = process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe";

    const trx = await openai.audio.transcriptions.create({
      model,
      file: await toFile(buf, filename, { type: mime }),
      // Only pass "language" when client didn't ask for auto. (Otherwise let the model auto-detect.)
      ...(lang && lang !== "auto" ? { language: lang } : {}),
      response_format: "json",
      // temperature: 0.2  // (optional) a tad of robustness
    });

    const text = (trx?.text || "").trim();
    const detected = guessBCP47(text);

    return res.status(200).json({ text, lang: lang === "auto" ? detected : lang });
  } catch (err) {
    console.error("STT error:", err);
    res.status(500).json({ error: "stt_failed", detail: String(err?.message || err) });
  }
}
