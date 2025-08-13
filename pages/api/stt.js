// FILE: /pages/api/stt.js
// Accepts { audioChunk: <base64> } and returns { text, lang }
// No external logger deps.

export const config = { api: { bodyParser: { sizeLimit: '20mb' } } };

import OpenAI from 'openai';
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function guessLangFromText(t) {
  if (/[؀-ۿ]/.test(t)) return 'ar';
  if (/[א-ת]/.test(t)) return 'he';
  return 'en';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end('Method Not Allowed');
  }
  try {
    const { audioChunk } = req.body || {};
    if (!audioChunk) return res.status(400).json({ error: 'audioChunk is required' });

    const buffer = Buffer.from(audioChunk, 'base64');
    const blob = new Blob([buffer], { type: 'audio/mpeg' });

    const tr = await openai.audio.transcriptions.create({
      file: blob,
      model: 'whisper-1'
    });

    const text = tr?.text || '';
    const lang = guessLangFromText(text);
    return res.status(200).json({ text, lang });
  } catch (error) {
    console.error('[stt] error', error);
    return res.status(500).json({ error: String(error?.message || error) });
  }
}
