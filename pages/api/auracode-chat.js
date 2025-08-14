// FILE: /pages/api/auracode-chat.js
import { OpenAI } from 'openai';
import retry from 'async-retry';
import pino from 'pino';
import cld from 'cld';

// --- Structured Logger ---
const logger = pino({ level: process.env.PINO_LOG_LEVEL || 'info' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// --- Source Fetchers ---
async function fetchSources(query, lang) {
  logger.info({ query, lang }, 'Fetching sources...');

  try {
    if (lang === 'Arabic') {
      // Example: Quran API
      const res = await fetch(`https://api.quran.com/v4/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      return data.matches?.map(m => ({
        source: `Qur'an ${m.surah.name} ${m.verse_key}`,
        text: m.text
      })) || [];
    }

    if (lang === 'Hebrew') {
      // Example: Sefaria API for Torah / Psalms
      const res = await fetch(`https://www.sefaria.org/api/texts/${encodeURIComponent(query)}?lang=he`);
      const data = await res.json();
      if (data.he && data.he.length) {
        return data.he.map((t, i) => ({
          source: `${data.ref} (${i + 1})`,
          text: t
        }));
      }
    }

    if (lang === 'English') {
      // Example: Bible / Psalms (English)
      const res = await fetch(`https://bible-api.com/${encodeURIComponent(query)}`);
      const data = await res.json();
      if (data.verses) {
        return data.verses.map(v => ({
          source: `${v.book_name} ${v.chapter}:${v.verse}`,
          text: v.text
        }));
      }
    }
  } catch (err) {
    logger.warn({ err }, 'Source fetch failed.');
  }

  return []; // Always return an array
}

// --- Language Detection ---
async function detectLanguage(lang, message) {
  const x = String(lang || 'auto').toLowerCase();
  if (x !== 'auto') {
    if (x.startsWith('ar')) return 'Arabic';
    if (x.startsWith('he')) return 'Hebrew';
    if (x.startsWith('en')) return 'English';
  }
  try {
    const result = await cld.detect(message);
    if (result.reliable && result.languages.length > 0) {
      const detectedLang = result.languages[0].name.toLowerCase();
      if (detectedLang.includes('arabic')) return 'Arabic';
      if (detectedLang.includes('hebrew')) return 'Hebrew';
      if (detectedLang.includes('english')) return 'English';
      return result.languages[0].name;
    }
  } catch (error) {
    logger.warn({ err: error }, 'cld detection failed.');
  }
  if (/[؀-ۿ]/.test(message)) return 'Arabic';
  if (/[א-ת]/.test(message)) return 'Hebrew';
  if (/[\u4E00-\u9FFF]/.test(message)) return 'Chinese';
  return 'English';
}

// --- API Handler ---
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, lang = 'auto', requestId } = req.body || {};
  const log = logger.child({ requestId });

  if (!message) {
    log.warn('No message provided.');
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const targetLanguage = await detectLanguage(lang, message);
    log.info({ message, clientLang: lang, detectedLang: targetLanguage }, 'Processing request.');

    const sources = await retry(
      async () => fetchSources(message, targetLanguage),
      { retries: 2, minTimeout: 500 }
    );

    const sourceText = sources.length
      ? sources.map(s => `Source: ${s.source}\nText: ${s.text}`).join('\n\n')
      : '';

    const systemPrompt = `You are a helpful assistant.
Provide citations from the sources when available.
${sourceText ? `Use the following sources to answer:\n${sourceText}` : ''}
IMPORTANT: Respond only in ${targetLanguage}.`;

    const completion = await retry(
      async () => {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
        });
        if (!response.choices?.length) throw new Error('No choices from OpenAI.');
        return response;
      },
      { retries: 2, minTimeout: 1000 }
    );

    const reply = completion.choices[0].message.content;
    const citations = reply.match(/\[\d+\]/g) || [];

    res.status(200).json({ reply, citations, sources });
  } catch (error) {
    log.error({ err: error }, 'Handler failed.');
    res.status(500).json({ error: 'Processing failed' });
  }
}
