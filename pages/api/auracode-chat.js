// FILE: /pages/api/auracode-chat.js
import { OpenAI } from 'openai';
import retry from 'async-retry';
import pino from 'pino';
import cld from 'cld';

// LOGGING: Initialize structured logger
const logger = pino({ level: process.env.PINO_LOG_LEVEL |

| 'info' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CONFIG: Vercel deployment settings
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// FAKE SOURCE FETCHERS (placeholders for Sefaria/Qur'an/Gutenberg)
async function fetchSources(query, lang) {
  // Simulating fetching from sources like Qur'an, Sefaria, etc.
  // In a real implementation, this would involve complex logic.
  logger.info({ query, lang }, 'Fetching sources...');
  await new Promise(resolve => setTimeout(resolve, 800)); // Simulate network latency
  if (lang === 'Arabic' && query.includes('قرآن')) {
    return;
  }
  if (lang === 'Hebrew' && query.includes('תורה')) {
    return;
  }
  return;
}

/**
 * PATCH: Robust language detection logic.
 * This function now uses a dedicated library (cld) for accurate detection
 * and falls back to a simple regex check for short or ambiguous text.
 * It prioritizes the language explicitly sent from the client.
 * @param {string} lang - Language code from the client (e.g., "en", "ar", "auto").
 * @param {string} message - The user's message text.
 * @returns {Promise<string>} The full language name (e.g., "English", "Arabic").
 */
async function detectLanguage(lang, message) {
  const x = String(lang |

| 'auto').toLowerCase();
  
  if (x && x!== 'auto') {
    if (x.startsWith('ar')) return 'Arabic';
    if (x.startsWith('he')) return 'Hebrew';
    if (x.startsWith('en')) return 'English';
    // Add other direct mappings as needed
  }

  // Use robust library for 'auto' or unmapped languages
  try {
    const result = await cld.detect(message);
    if (result.reliable && result.languages.length > 0) {
      const detectedLang = result.languages.name.toLowerCase();
      if (detectedLang.includes('arabic')) return 'Arabic';
      if (detectedLang.includes('hebrew')) return 'Hebrew';
      // Add more mappings from the library's output
    }
  } catch (error) {
    logger.warn({ err: error }, 'cld language detection failed, falling back to regex.');
  }

  // Fallback regex for simple script detection
  if (/[؀-ۿ]/.test(message)) return 'Arabic';
  if (/[א-ת]/.test(message)) return 'Hebrew';
  if (/[\u4E00-\u9FFF]/.test(message)) return 'Chinese';
  
  return 'English';
}

export default async function handler(req, res) {
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { message, lang = 'auto', requestId } = req.body |

| {};
  const log = logger.child({ requestId });

  if (!message) {
    log.warn('Request received with no message.');
    return res.status(400).json({ error: 'Message is required' });
  }

  try {
    const targetLanguage = await detectLanguage(lang, message);
    log.info({ message, clientLang: lang, detectedLang: targetLanguage }, 'Processing chat request.');

    // RESILIENCE: Wrap source fetching in a retry block to handle transient network issues.
    const sources = await retry(
      async () => fetchSources(message, targetLanguage),
      {
        retries: 2,
        minTimeout: 500,
        onRetry: (error) => {
          log.warn({ err: error }, 'Retrying source fetch...');
        },
      }
    );

    const sourceText = sources.map(s => `Source: ${s.source}\nText: ${s.text}`).join('\n\n');

    // PATCH: System prompt now includes a clear instruction to respond in the target language.
    const systemPrompt = `You are a helpful assistant.
Provide citations from the sources when available.
${sourceText? `Use the following sources to answer the user's question:\n${sourceText}` : ''}
IMPORTANT: You must respond exclusively in ${targetLanguage}. If the user wrote in ${targetLanguage}, answer in ${targetLanguage}.`;

    // RESILIENCE: Wrap OpenAI call in a retry block.
    const completion = await retry(
      async () => {
        const response = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: message },
          ],
        });
        if (!response.choices |

| response.choices.length === 0) {
          throw new Error('OpenAI returned no choices.');
        }
        return response;
      },
      {
        retries: 2,
        minTimeout: 1000,
        onRetry: (error) => {
          log.warn({ err: error }, 'Retrying OpenAI chat completion call...');
        },
      }
    );

    const reply = completion.choices.message.content;

    // Basic citation extraction (can be improved)
    const citations = reply.match(/\[\d+\]/g) ||;

    log.info({ targetLanguage, replyLength: reply.length }, 'Successfully generated response.');
    res.status(200).json({ reply, citations, sources });

  } catch (error) {
    log.error({ err: error }, 'Error in auracode-chat handler.');
    res.status(500).json({ error: 'Failed to process chat request.' });
  }
}
