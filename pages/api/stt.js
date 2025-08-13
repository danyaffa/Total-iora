// FILE: /pages/api/stt.js
import { OpenAI } from 'openai';
import retry from 'async-retry';
import pino from 'pino';

// LOGGING: Initialize structured logger
const logger = pino({ level: process.env.PINO_LOG_LEVEL |

| 'info' });

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// CONFIG: Vercel deployment settings
export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Helper to convert base64 to a readable stream for OpenAI SDK
function base64ToReadableStream(base64String, filename = 'audio.webm') {
  const buffer = Buffer.from(base64String, 'base64');
  return {
    file: buffer,
    filename: filename,
  };
}

export default async function handler(req, res) {
  if (req.method!== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { audioChunk, requestId } = req.body;
  const log = logger.child({ requestId });

  if (!audioChunk) {
    log.warn('Request received with no audio chunk.');
    return res.status(400).json({ error: 'Audio chunk is required' });
  }

  try {
    const audioFile = base64ToReadableStream(audioChunk);
    let transcription;
    const modelsToTry = ['gpt-4o-transcribe', 'whisper-1'];

    for (const model of modelsToTry) {
      try {
        log.info({ model }, 'Attempting transcription with model.');
        // RESILIENCE: Wrap OpenAI transcription call in a retry block.
        const response = await retry(
          async () => {
            return await openai.audio.transcriptions.create({
              file: audioFile,
              model: model,
            });
          },
          {
            retries: 1,
            minTimeout: 500,
            onRetry: (error) => {
              log.warn({ err: error, model }, `Retrying transcription with ${model}...`);
            },
          }
        );
        transcription = response;
        log.info({ model, text: transcription.text }, 'Transcription successful.');
        break; // Success, exit loop
      } catch (error) {
        log.error({ err: error, model }, `Failed to transcribe with model ${model}.`);
        if (model === modelsToTry) {
          // If the last model failed, throw the error to be caught by the outer catch block.
          throw error;
        }
      }
    }

    // A coarse language guess can be done here if needed, but we rely on the more robust
    // server-side detection in auracode-chat.js for the final prompt.
    // For client-side hints, we can pass back a simple guess.
    const lang = 'auto'; // Let the main chat API handle robust detection.

    res.status(200).json({ text: transcription.text, lang });

  } catch (error) {
    log.error({ err: error }, 'Error in STT handler.');
    res.status(500).json({ error: 'Speech-to-text transcription failed.' });
  }
}
