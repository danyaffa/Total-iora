// FILE: /pages/api/stt.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Allow larger body for cumulative audio chunks (default 1MB is too small)
export const config = { api: { bodyParser: { sizeLimit: "10mb" } } };

import OpenAI from "openai";
import { withApi } from "../../lib/apiSecurity";
import { logger } from "../../lib/logger";

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

function looksLikeSilence(bytes) {
  if (!bytes || !bytes.length) return true;
  let low = 0,
    seen = 0;
  for (let i = 0; i < bytes.length; i += 16) {
    if (bytes[i] < 6) low++;
    seen++;
  }
  return seen > 8 && low / seen > 0.85;
}

async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    log.error("missing_openai_key");
    return res.status(503).json({ error: "service_unavailable" });
  }

  const { b64, mime = "audio/webm", lang = "auto" } = req.body || {};
  if (!b64 || typeof b64 !== "string") {
    return res.status(400).json({ error: "missing_audio" });
  }

  let buf;
  try {
    buf = Buffer.from(b64, "base64");
  } catch {
    return res.status(400).json({ error: "invalid_audio_encoding" });
  }

  if (buf.byteLength < 1800 || looksLikeSilence(buf)) {
    return res.status(200).json({ text: "", lang: lang === "auto" ? "en-US" : lang });
  }

  const MAX_BYTES = 8 * 1024 * 1024;
  if (buf.byteLength > MAX_BYTES) {
    return res.status(413).json({ error: "payload_too_large" });
  }

  const openai = new OpenAI({ apiKey });
  const ext = mime.includes("mp4") ? "mp4" : mime.includes("ogg") ? "ogg" : "webm";
  const file = new File([buf], `recording.${ext}`, { type: mime });

  const modelName = process.env.STT_MODEL || "whisper-1";
  const params = { file, model: modelName };
  if (lang && lang !== "auto") params.language = lang;

  // Wrap the Whisper call so auth/quota/model errors become a
  // self-diagnosing 503 instead of a generic server_error.
  let out;
  try {
    out = await openai.audio.transcriptions.create(params);
  } catch (err) {
    const status = err?.status || err?.response?.status || null;
    const errMsg = String(err?.message || err);
    const errCode = err?.code || err?.error?.code || (status ? `http_${status}` : null);
    log.error("openai_stt_failed", { model: modelName, error: errMsg, code: errCode, status });
    return res.status(503).json({
      error: "service_unavailable",
      debug_hint: `OpenAI STT call failed (${errCode || "unknown"}): ${errMsg}`,
    });
  }

  const text = (out?.text || "").trim();
  const detected = lang === "auto" ? detectLangFromText(text, "en-US") : lang;
  return res.status(200).json({ text, lang: detected });
}

export default withApi(handler, {
  name: "api.stt",
  methods: ["POST"],
  // Live transcription in OracleVoice.js sends a ~500ms chunk every
  // 600ms, so a 60-second recording produces up to ~100 STT requests.
  // The in-flight throttle brings this closer to 40–60/min in practice,
  // but the old limit of 30/min was still too low — after ~30 seconds
  // the live preview stopped updating because every subsequent chunk
  // was getting 429'd (and the client was silently swallowing it).
  // 180/min = 3/sec gives comfortable headroom for streaming STT while
  // still catching abuse.
  rate: { max: 180, windowMs: 60_000 },
});
