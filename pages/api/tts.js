// FILE: /pages/api/tts.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";
import { withApi } from "../../lib/apiSecurity";
import { logger } from "../../lib/logger";

const log = logger.child({ fn: "api.tts" });

async function handler(req, res) {
  const text =
    req.method === "GET" ? String(req.query.text || "") : String(req.body?.text || "");
  const voice =
    req.method === "GET"
      ? String(req.query.voice || "verse")
      : String(req.body?.voice || "verse");

  if (!text.trim()) return res.status(400).json({ error: "missing_text" });
  if (text.length > 4000) return res.status(413).json({ error: "text_too_long" });

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    log.error("missing_openai_key");
    return res.status(503).json({ error: "service_unavailable" });
  }

  const openai = new OpenAI({ apiKey });
  const model = process.env.OPENAI_TTS_MODEL || "gpt-4o-mini-tts";

  // Wrap the TTS call so auth/quota/model errors become a
  // self-diagnosing 503 instead of a generic server_error.
  let out;
  try {
    out = await openai.audio.speech.create({
      model,
      voice,
      input: text,
      format: "mp3",
    });
  } catch (err) {
    const status = err?.status || err?.response?.status || null;
    const errMsg = String(err?.message || err);
    const errCode = err?.code || err?.error?.code || (status ? `http_${status}` : null);
    log.error("openai_tts_failed", { model, error: errMsg, code: errCode, status });
    return res.status(503).json({
      error: "service_unavailable",
      debug_hint: `OpenAI TTS call failed (${errCode || "unknown"}): ${errMsg}`,
    });
  }

  const buf = Buffer.from(await out.arrayBuffer());
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("Cache-Control", "no-store");
  res.status(200).send(buf);
}

export default withApi(handler, {
  name: "api.tts",
  methods: ["POST", "GET"],
  rate: { max: 30, windowMs: 60_000 },
});
