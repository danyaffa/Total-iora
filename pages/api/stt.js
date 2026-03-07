// FILE: /pages/api/stt.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Allow larger body for cumulative audio chunks (default 1MB is too small)
export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

import OpenAI from "openai";

// quick language guess from result text (used for TTS routing)
function detectLangFromText(s, fallback = "en-US") {
  const t = String(s || "");
  if (/[ء-ي]/.test(t)) return "ar-SA";
  if (/[\u0590-\u05FF]/.test(t)) return "he-IL";
  if (/[\u0400-\u04FF]/.test(t)) return "ru-RU";
  if (/[\u4E00-\u9FFF]/.test(t)) return "zh-CN";
  if (/[\u0900-\u097F]/.test(t)) return "hi-IN";
  if (/[\u3040-\u30FF]/.test(t)) return "ja-JP";
  if (/[\u0E00-\u0E7F]/.test(t)) return "th-TH";
  return fallback;
}

// crude energy check to avoid sending obvious silence
function looksLikeSilence(bytes) {
  if (!bytes || !bytes.length) return true;
  // sample every 16th byte; if almost all under 6, call it silence
  let low = 0, seen = 0;
  for (let i = 0; i < bytes.length; i += 16) {
    const v = bytes[i];
    if (v < 6) low++;
    seen++;
  }
  return seen > 8 && (low / seen) > 0.85;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const { b64, mime = "audio/webm", lang = "auto" } = req.body || {};
    if (!b64) return res.status(400).json({ error: "Missing audio payload" });

    // base64 -> Buffer
    const buf = Buffer.from(b64, "base64");

    // micro‑optimizations: skip tiny or silent chunks to keep live text snappy
    if (buf.byteLength < 1800 || looksLikeSilence(buf)) {
      // return empty so the client doesn’t append duplicates
      return res.status(200).json({ text: "", lang: lang === "auto" ? "en-US" : lang });
    }

    // defensive cap (avoid someone sending minutes of audio to the preview endpoint)
    const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
    if (buf.byteLength > MAX_BYTES) {
      return res.status(413).json({ error: "Payload too large" });
    }

    const openai = new OpenAI({ apiKey });

    // Node 18+ has File/Blob
    const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
    const file = new File([buf], `recording.${ext}`, { type: mime });

    const params = {
      file,
      model: process.env.STT_MODEL || "whisper-1",
    };
    if (lang && lang !== "auto") {
      params.language = lang;
    }

    const out = await openai.audio.transcriptions.create(params);

    const text = (out?.text || "").trim();
    const detected = lang === "auto" ? detectLangFromText(text, "en-US") : lang;

    return res.status(200).json({ text, lang: detected });
  } catch (err) {
    console.error("STT error:", err);
    return res.status(500).json({ error: "stt_failed", detail: String(err?.message || err) });
  }
}
