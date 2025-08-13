// FILE: /pages/api/tts.js
import { OpenAI } from 'openai';
import CircuitBreaker from 'opossum';
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

// RESILIENCE: Define the function that the circuit breaker will wrap.
async function generateSpeech(text, model, voice, response_format) {
  const ttsModel = model |

| process.env.OPENAI_TTS_MODEL |
| 'tts-1';
  const speech = await openai.audio.speech.create({
    model: ttsModel,
    voice: voice |

| 'alloy',
    input: text,
    response_format: response_format |

| 'mp3',
  });
  return Buffer.from(await speech.arrayBuffer());
}

// RESILIENCE: Configure and instantiate the circuit breaker.
const circuitBreakerOptions = {
  timeout: 8000, // If the function takes longer than 8 seconds, trigger a failure.
  errorThresholdPercentage: 50, // When 50% of requests fail, trip the circuit.
  resetTimeout: 30000, // After 30 seconds, try again.
};
const breaker = new CircuitBreaker(generateSpeech, circuitBreakerOptions);

// LOGGING: Log circuit breaker state changes for observability.
breaker.on('open', () => logger.warn({ name: breaker.name }, 'Circuit breaker opened.'));
breaker.on('close', () => logger.info({ name: breaker.name }, 'Circuit breaker closed.'));
breaker.on('halfOpen', () => logger.info({ name: breaker.name }, 'Circuit breaker is half-open, next request is a test.'));
breaker.on('fallback', () => logger.warn({ name: breaker.name }, 'TTS fallback triggered.'));

// The breaker will now fast-fail if the TTS service is down.
breaker.fallback(() => {
  throw new Error('TTS service is currently unavailable.');
});

export default async function handler(req, res) {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { text, model, voice, format, response_format, requestId } = {...req.query,...req.body };
  const log = logger.child({ requestId });

  if (!text) {
    log.warn('Request received with no text for TTS.');
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    log.info({ textLength: text.length }, 'Processing TTS request.');
    
    // PATCH: Tolerate both `format` and `response_format` parameters.
    const audioFormat = response_format |

| format |
| 'mp3';
    
    // Use the circuit breaker to fire the request.
    const audioBuffer = await breaker.fire(text, model, voice, audioFormat);

    res.setHeader('Content-Type', `audio/${audioFormat}`);
    res.status(200).send(audioBuffer);
    log.info('TTS audio generated and sent successfully.');

  } catch (error) {
    log.error({ err: error, breakerState: breaker.toJSON().state }, 'Error in TTS handler.');
    res.status(500).json({ error: error.message |

| 'Failed to generate speech.' });
  }
}
