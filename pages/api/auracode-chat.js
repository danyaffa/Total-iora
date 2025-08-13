// FILE: /pages/api/auracode-chat.js
import OpenAI from 'openai';
import retry from 'async-retry';
import pino from 'pino';
import cld from 'cld';

// LOGGING (fixed stray pipes)
const logger = pino({ level: process.env.PINO_LOG_LEVEL || 'info' });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Vercel hints
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

// OPTIONAL: source fetcher (kept but safe)
async function fetchSources(query, lang) {
  logger.info({ query, lang }, 'Fetching sources...');
  await new Promise((r) => setTimeout(r, 200));
  return []; // keep empty list to avoid .map on undefined
}

// Detect language (kept + hardened)
async function detectLanguage(lang, message) {
  const x = String(lang || 'auto').toLowerCase();
  if (x && x !== 'auto') {
    if (x.startsWith('ar')) return 'Arabic';
    if (x.startsWith('he')) return 'Hebrew';
    if (x.startsWith('en')) return 'English';
  }
  try {
    const result = await cld.detect(message);
    if (result?.reliable && result.languages?.length > 0) {
      const names = result.languages.map((l) => (l && l.name ? String(l.name).toLowerCase() : ''));
      if (names.some((n) => n.includes('arabic'))) return 'Arabic';
      if (names.some((n) => n.includes('hebrew'))) return 'Hebrew';
    }
  } catch (e) {
    logger.warn({ err: e }, 'cld detect failed, using regex fallback');
  }
  if (/[؀-ۿ]/.test(message)) return 'Arabic';
  if (/[א-ת]/.test(message)) return 'Hebrew';
  if (/[\u4E00-\u9FFF]/.test(message)) return 'Chinese';
  return 'English';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

  const { message, lang = 'auto', requestId } = req.body || {};
  const log = logger.child({ requestId });

  if (!message) {
    log.warn('Request with no message');
    return res.status(400).json({ error: 'Message is required' });
    }

  try {
    const targetLanguage = await detectLanguage(lang, message);
    log.info({ clientLang: lang, detectedLang: targetLanguage }, 'Processing chat request');

    const sources = await retry(
      async () => fetchSources(message, targetLanguage),
      { retries: 1, minTimeout: 300, onRetry: (err) => log.warn({ err }, 'Retrying source fetch') }
    );

    const sourceText = (sources || [])
      .map((s) => `Source: ${s.source}\nText: ${s.text}`)
      .join('\n\n');

    const systemPrompt =
`You are a helpful assistant.
Provide citations from the sources when available.
${sourceText ? `Use the following sources to answer the user's question:\n${sourceText}\n` : ''}IMPORTANT: You must respond exclusively in ${targetLanguage}.`;

    const completion = await retry(
      async () => {
        const resp = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message }
          ]
        });
        if (!resp?.choices || resp.choices.length === 0) throw new Error('OpenAI returned no choices');
        return resp;
      },
      { retries: 2, minTimeout: 800, onRetry: (err) => log.warn({ err }, 'Retrying OpenAI chat') }
    );

    const reply = completion.choices[0]?.message?.content || '';
    const citations = (reply.match(/\[\d+\]/g) || []).map(String);

    log.info({ replyLength: reply.length }, 'Chat success');
    return res.status(200).json({ reply, citations, sources });
  } catch (error) {
    log.error({ err: error }, 'auracode-chat error');
    return res.status(500).json({ error: 'Failed to process chat request.' });
  }
}
