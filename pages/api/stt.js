// /pages/api/stt.js
export const config = { api: { bodyParser: { sizeLimit: "25mb" } } }; // allow audio
export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  try {
    const { b64, mime, lang } = req.body || {};
    if (!b64) return res.status(400).json({ error: "Missing audio" });
    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error: "Missing OPENAI_API_KEY" });

    const file = new File([Buffer.from(b64, "base64")], "voice.webm", { type: mime || "audio/webm" });
    const fd = new FormData();
    fd.append("file", file);
    fd.append("model", "whisper-1");
    if (lang) fd.append("language", String(lang).split("-")[0]); // e.g. en, ar, he

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: fd,
    });

    if (!r.ok) {
      const t = await r.text();
      return res.status(502).json({ error: "Upstream STT error", detail: t });
    }
    const js = await r.json().catch(()=>({}));
    return res.status(200).json({ text: js?.text || "" });
  } catch (e) {
    return res.status(500).json({ error: "STT server error", detail: String(e?.message || e) });
  }
}
