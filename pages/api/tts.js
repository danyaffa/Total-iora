// FILE: /pages/api/tts.js
// GET /api/tts?text=... → returns audio/mpeg (binary), as your component expects.

export const config = { api: { bodyParser: false } };

import OpenAI from 'openai';
import pino from 'pino';

const logger = pino({ level: process.env.PINO_LOG_LEVEL || 'info' });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).end('Method Not Allowed');
  }
  try {
    const text = String(req.query.text || '').trim();
    if (!text) return res.status(400).end('Missing text');

    const speech = await openai.audio.speech.create({
      model: 'tts-1',
      voice: 'alloy',
      input: text.slice(0, 5000)
    });

    const arrayBuffer = await speech.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', buffer.length.toString());
    res.status(200).end(buffer);
  } catch (error) {
    logger.error({ err: error }, 'TTS error');
    res.status(500).end('TTS failed');
  }
}
