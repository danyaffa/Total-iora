// FILE: /pages/api/stt.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

export default async function handler(req, res){
  if (req.method !== "POST") return res.status(405).json({ error:"Method not allowed" });
  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { b64 = "", mime = "audio/webm", lang = "en" } = body;
    if (!b64) return res.status(400).json({ error:"Missing audio" });

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
    if (!OPENAI_API_KEY) return res.status(503).json({ error:"Missing OPENAI_API_KEY" });

    const buf = Buffer.from(b64, "base64");
    const blob = new Blob([buf], { type: mime });

    const bias = [
      "God, LORD, Allah, Qur'an, Quran, Koran, Hadith, Sunnah",
      "Gospel, Jesus, Christ, Trinity, Father, Son, Holy Spirit",
      "Torah, Tanakh, Talmud, Psalms, Kabbalah, Maimonides, Rambam, Mussar",
      "Bhagavad Gita, Krishna, Arjuna, Dharma, Dhammapada, Buddha, Tao, Laozi",
      "Sufi, dhikr, muraqabah, mitzvah, halacha, shema, shalom"
    ].join("; ");

    const fd = new FormData();
    fd.append("file", blob, `audio.${(mime || "webm").split("/")[1] || "webm"}`);
    fd.append("model", "whisper-1");
    fd.append("temperature", "0");
    fd.append("language", (lang || "en").split("-")[0]);
    fd.append("prompt", bias);

    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
      body: fd
    });

    if (!r.ok) {
      const t = await r.text().catch(()=> "");
      return res.status(502).json({ error:"Transcription failed", detail: t });
    }

    const js = await r.json().catch(()=> ({}));
    const text = js?.text || "";
    return res.status(200).json({ text });
  } catch (e) {
    return res.status(500).json({ error:"Server error", detail:String(e?.message || e) });
  }
}
