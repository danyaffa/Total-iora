// FILE: /pages/api/stt.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI, { toFile } from "openai";

export const config = {
  api: { bodyParser: { sizeLimit: "25mb" } },
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const { b64, mime } = req.body || {};
    if (!b64) return res.status(400).json({ error: "Missing audio payload" });

    const buf = Buffer.from(b64, "base64");
    const openai = new OpenAI({ apiKey });

    // Model picks up language automatically (Arabic/Hebrew/anything)
    const model = process.env.OPENAI_STT_MODEL || "gpt-4o-mini-transcribe"; // fallback works: "whisper-1"
    const file = await toFile(buf, `speech.${(mime || "audio/webm").split("/")[1] || "webm"}`, { type: mime || "audio/webm" });

    const tr = await openai.audio.transcriptions.create({
      model,
      file,
      // leave language undefined → auto-detect
    });

    return res.status(200).json({
      text: tr?.text || "",
      lang: tr?.language || null,
    });
  } catch (err) {
    console.error("STT error:", err?.status || "", err?.message || err);
    const status = Number(err?.status) || 500;
    return res.status(status).json({ error: "stt_failed", detail: String(err?.message || err) });
  }
}
