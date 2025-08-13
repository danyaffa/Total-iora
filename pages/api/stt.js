// FILE: /pages/api/stt.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

function b64ToBuffer(b64) {
  const bin = Buffer.from(b64, "base64");
  return bin;
}

// quick BCP-47 guess from Unicode ranges
function guessLang(txt) {
  const s = String(txt || "");
  if (/[؀-ۿ]/.test(s)) return "ar";     // Arabic
  if (/[א-ת]/.test(s)) return "he";     // Hebrew
  if (/[а-яёА-ЯЁ]/.test(s)) return "ru";
  if (/[\u3400-\u9FBF]/.test(s)) return "zh";
  if (/[áéíóúñü¿¡]/i.test(s)) return "es";
  if (/[àâçéèêëïîôùû]/i.test(s)) return "fr";
  return "en";
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const { b64, mime } = req.body || {};
    if (!b64) return res.status(400).json({ error: "Missing audio" });

    const openai = new OpenAI({ apiKey });

    const buf = b64ToBuffer(String(b64));
    // The SDK accepts a Blob-like object; filename helps routing
    const file = new File([buf], `audio.${(mime||"audio/webm").split("/")[1] || "webm"}`, { type: mime || "audio/webm" });

    // Try the newest transcriber, fall back to whisper-1
    let result;
    try {
      result = await openai.audio.transcriptions.create({
        file, model: "gpt-4o-transcribe"
      });
    } catch {
      result = await openai.audio.transcriptions.create({
        file, model: "whisper-1"
      });
    }

    const text = String(result?.text || "").trim();
    const lang = text ? guessLang(text) : null;

    return res.status(200).json({ text, lang });
  } catch (err) {
    console.error("STT error:", err);
    return res.status(500).json({ error: "stt_failed", detail: String(err?.message || err) });
  }
}
