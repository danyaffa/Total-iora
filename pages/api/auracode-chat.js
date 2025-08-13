// FILE: /pages/api/auracode-chat.js
import OpenAI from 'openai';

// tiny console-based logger (keeps log calls; no pino needed)
const logger = {
  child: (meta) => ({
    info: (msg, ...rest) => console.info('[auracode-chat]', meta, msg, ...rest),
    warn: (msg, ...rest) => console.warn('[auracode-chat]', meta, msg, ...rest),
    error: (msg, ...rest) => console.error('[auracode-chat]', meta, msg, ...rest),
  }),
  info: (...a) => console.info('[auracode-chat]', ...a),
  warn: (...a) => console.warn('[auracode-chat]', ...a),
  error: (...a) => console.error('[auracode-chat]', ...a),
};

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// small retry helper (no async-retry dep)
async function withRetry(fn, retries = 2, delayMs = 600, onRetry = () => {}) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try { return await fn(); }
    catch (e) {
      lastErr = e;
      if (i < retries) {
        await onRetry(e, i);
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

// Language detection without cld
function detectLanguage(lang, text) {
  const x = String(lang || 'auto').toLowerCase();
  if (x && x !== 'auto') {
    if (x.startsWith('ar')) return 'Arabic';
    if (x.startsWith('he')) return 'Hebrew';
    if (x.startsWith('en')) return 'English';
  }
  if (/[؀-ۿ]/.test(text)) return 'Arabic';
  if (/[א-ת]/.test(text)) return 'Hebrew';
  if (/[\u4E00-\u9FFF]/.test(text)) return 'Chinese';
  return 'English';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { message, lang = 'auto', requestId } = req.body || {};
  const log = logger.child({ requestId });

  if (!message) {
    log.warn('No message');
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const targetLanguage = detectLanguage(lang, message);
    log.info({ message, clientLang: lang, detectedLang: targetLanguage }, 'Processing');

    const systemPrompt =
`You are a helpful assistant.
IMPORTANT: You must respond exclusively in ${targetLanguage}.
If the user wrote in ${targetLanguage}, answer in ${targetLanguage}.`;

    const completion = await withRetry(
      async () => {
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        });
        if (!resp?.choices?.length) throw new Error('OpenAI returned no choices');
        return resp;
      },
      2,
      800,
      (err, i) => log.warn({ attempt: i + 1, err: String(err) }, 'Retrying OpenAI')
    );

    const reply = completion.choices[0]?.message?.content || '';
    const citations = (reply.match(/\[\d+\]/g) || []).map(String);

    log.info({ replyLength: reply.length }, 'Success');
    return res.status(200).json({ reply, citations, sources: [] });
  } catch (error) {
    log.error({ err: String(error) }, 'auracode-chat error');
    return res.status(500).json({ error: 'Failed to process chat request.' });
  }
}
