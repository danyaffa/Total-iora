// FILE: /pages/api/transcribe.js
export const config = { api: { bodyParser: { sizeLimit: "25mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const { audioB64 = "", mime = "audio/webm" } = req.body || {};
    if (!audioB64) return res.status(400).json({ error: "Missing audio" });

    const buffer = Buffer.from(audioB64, "base64");
    const file = new File([buffer], mime.includes("mp4") ? "speech.m4a" : "speech.webm", { type: mime });

    const fd = new FormData();
    fd.append("file", file);
    fd.append("model", "whisper-1");         // OpenAI Whisper
    // fd.append("language", "en");           // optionally fix language

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: fd,
    });

    const data = await r.json();
    if (!r.ok) return res.status(502).json({ error: data?.error?.message || "Transcription error" });

    return res.status(200).json({ text: data.text || "" });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
}
