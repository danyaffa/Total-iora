// FILE: /pages/api/stt.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { b64, mime = "audio/webm", lang = "auto" } = req.body || {};
    if (!b64) return res.status(400).json({ error: "Missing b64" });

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const openai = new OpenAI({ apiKey });
    const buffer = Buffer.from(b64, "base64");
    const blob = new Blob([buffer], { type: mime });

    const tr = await openai.audio.transcriptions.create({
      file: blob,
      model: "whisper-1",
      // language: lang !== "auto" ? lang : undefined,
    });

    const text = tr?.text || "";
    res.status(200).json({ text });
  } catch (err) {
    console.error("STT error:", err);
    res.status(500).json({ error: "stt_failed", detail: String(err?.message || err) });
  }
}
