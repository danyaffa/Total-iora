// FILE: /pages/api/stt.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Allow larger body for cumulative audio chunks (default 1MB is too small)
export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

import OpenAI from "openai";
import { withApi } from "../../lib/apiSecurity";
import { logger } from "../../lib/logger";
import { geminiTranscribe, geminiAvailable } from "../../lib/gemini";

const log = logger.child({ fn: "api.stt" });

function detectLangFromText(s, fallback = "en-US") {
  const t = String(s || "");
  if (/[\u0600-\u06FF]/.test(t)) return "ar-SA";
  if (/[\u0590-\u05FF]/.test(t)) return "he-IL";
  if (/[\u0400-\u04FF]/.test(t)) return "ru-RU";
  if (/[\u4E00-\u9FFF]/.test(t)) return "zh-CN";
  if (/[\u0900-\u097F]/.test(t)) return "hi-IN";
  if (/[\u3040-\u30FF]/.test(t)) return "ja-JP";
  if (/[\u0E00-\u0E7F]/.test(t)) return "th-TH";
  return fallback;
}

// REMOVED: looksLikeSilence(). It sampled raw bytes and checked if
// >85% were near-zero. That heuristic only works for uncompressed PCM
// audio. Browsers send webm/opus, which is heavily compressed — the
// byte distribution has zero correlation to audio silence. For any
// real recording, this function was returning true and the handler
// was returning an empty transcription without ever calling an AI
// provider. That is almost certainly why recording never worked.
// Whisper and Gemini both return empty text cleanly on silent input,
// so we don't need a pre-filter.

async function transcribeWithOpenAI(buf, mime, lang) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY not set");
  const openai = new OpenAI({ apiKey });
  const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
  const file = new File([buf], `recording.${ext}`, { type: mime });
  const modelName = process.env.STT_MODEL || "whisper-1";
  const params = { file, model: modelName };
  if (lang && lang !== "auto") params.language = lang;
  const out = await openai.audio.transcriptions.create(params);
  return (out?.text || "").trim();
}

async function handler(req, res) {
  const { b64, mime = "audio/webm", lang = "auto", debug = false } = req.body || {};
  if (!b64 || typeof b64 !== "string") {
    return res.status(400).json({ error: "missing_audio" });
  }

  let buf;
  try {
    buf = Buffer.from(b64, "base64");
  } catch {
    return res.status(400).json({ error: "invalid_audio_encoding" });
  }

  const audioBytes = buf.byteLength;

  // Minimum-size floor is kept only to reject obviously empty buffers
  // (< 256 bytes is not a real recording — it's usually MediaRecorder
  // header fragments before any audio is captured). 1800 was too
  // aggressive and was rejecting valid short chunks from the live
  // preview loop.
  if (audioBytes < 256) {
    return res.status(200).json({
      text: "",
      lang: lang === "auto" ? "en-US" : lang,
      provider: null,
      reason: "audio_too_small",
      audioBytes,
    });
  }

  const MAX_BYTES = 8 * 1024 * 1024;
  if (audioBytes > MAX_BYTES) {
    return res.status(413).json({ error: "payload_too_large", audioBytes });
  }

  // Provider fallback chain: try OpenAI Whisper first. On ANY failure
  // (missing key, model not allowed, quota, network, malformed audio),
  // fall back to Gemini if a GEMINI_API_KEY is configured.
  let text = "";
  let provider = null;
  let openaiError = null;
  let geminiError = null;
  let openaiTried = false;
  let geminiTried = false;

  // --- OpenAI attempt -----------------------------------------------------
  if (process.env.OPENAI_API_KEY) {
    openaiTried = true;
    try {
      text = await transcribeWithOpenAI(buf, mime, lang);
      if (text) provider = "openai";
      else openaiError = "OpenAI returned empty transcription";
    } catch (err) {
      const status = err?.status || err?.response?.status || null;
      const code = err?.code || err?.error?.code || (status ? `http_${status}` : null);
      openaiError = `OpenAI STT failed (${code || "unknown"}): ${String(err?.message || err)}`;
      log.warn("openai_stt_failed_trying_gemini", {
        code,
        status,
        error: String(err?.message || err),
      });
    }
  } else {
    openaiError = "OPENAI_API_KEY not set";
  }

  // --- Gemini fallback ----------------------------------------------------
  if (!text && geminiAvailable()) {
    geminiTried = true;
    try {
      text = await geminiTranscribe(buf, mime);
      if (text) provider = "gemini";
      else geminiError = "Gemini returned empty transcription";
    } catch (err) {
      geminiError = String(err?.message || err);
      log.error("gemini_stt_failed", { error: geminiError });
    }
  }

  const diagnostics = {
    audioBytes,
    mime,
    lang,
    openaiTried,
    geminiTried,
    openaiError,
    geminiError,
  };

  // --- Both failed / both empty -------------------------------------------
  if (!provider) {
    const parts = [];
    if (openaiError) parts.push(openaiError);
    if (geminiError) parts.push(`Gemini fallback also failed: ${geminiError}`);
    if (!geminiAvailable() && openaiTried) parts.push("No GEMINI_API_KEY set for fallback.");
    return res.status(503).json({
      error: "service_unavailable",
      debug_hint: parts.join(" | ") || "Both STT providers returned empty.",
      diagnostics,
    });
  }

  // --- Success (either provider) -----------------------------------------
  const detected = lang === "auto" ? detectLangFromText(text, "en-US") : lang;
  const resp = { text, lang: detected, provider };
  if (debug) resp.diagnostics = diagnostics;
  return res.status(200).json(resp);
}

export default withApi(handler, {
  name: "api.stt",
  methods: ["POST"],
  // Live transcription in OracleVoice.js sends a ~500ms chunk every
  // 600ms, so a 60-second recording produces up to ~100 STT requests.
  // 180/min = 3/sec gives comfortable headroom while still catching abuse.
  rate: { max: 180, windowMs: 60_000 },
});
