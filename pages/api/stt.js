// FILE: /pages/api/stt.js
export const runtime = "nodejs";
export const config = { api: { bodyParser: { sizeLimit: "24mb" } } };

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  try {
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const { b64, mime = "audio/webm", lang = "auto" } = req.body || {};
    if (!b64) return res.status(400).json({ error: "Missing audio payload" });

    // Decode base64 -> Buffer
    const buf = Buffer.from(b64, "base64");
    const type = String(mime).toLowerCase();

    // Choose a safe extension for the content-type we saw
    const ext =
      type.includes("m4a") ? "m4a" :
      type.includes("mp4") ? "mp4" :
      type.includes("ogg") ? "ogg" :
      type.includes("wav") ? "wav" :
      type.includes("mp3") ? "mp3" :
      "webm";

    // NOTE: In Node 18, use Blob + filename (File is undefined).
    const form = new FormData();
    form.append("file", new Blob([buf], { type }), `speech.${ext}`);
    form.append("model", process.env.OPENAI_TRANSCRIBE_MODEL || "whisper-1");
    if (lang && lang !== "auto") form.append("language", String(lang).split("-")[0]);
    form.append("response_format", "json");

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: form,
    });

    const js = await r.json().catch(() => ({}));
    if (!r.ok) {
      return res.status(502).json({
        error: "Transcription failed",
        detail: js && (js.error?.message || JSON.stringify(js))
      });
    }

    return res.status(200).json({ text: js?.text || "" });
  } catch (e) {
    return res.status(500).json({ error: "Server error", detail: String(e?.message || e) });
  }
}
