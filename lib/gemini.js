// FILE: /lib/gemini.js
// Thin Gemini (Google Generative Language API) helper used as a
// fallback whenever OpenAI fails. Uses raw fetch so we don't need a
// new npm dependency — Google's REST API is stable and well-documented.
//
// Expects two env vars set in Vercel (already present per user report):
//   GEMINI_API_KEY   — a key from https://aistudio.google.com/apikey
//   GEMINI_MODEL     — e.g. "gemini-1.5-pro" or "gemini-1.5-flash"
//                      (defaults to gemini-1.5-pro if not set)
//
// All three exported functions throw on failure so callers can
// distinguish "Gemini works and returned a result" from "Gemini also
// failed" and surface both errors to the operator.

const GEMINI_ENDPOINT =
  "https://generativelanguage.googleapis.com/v1beta/models";

/**
 * Resolve the Gemini model name. The v1beta API is strict: bare names
 * like "gemini-1.5-pro" return 404 — you must use "gemini-1.5-pro-latest"
 * or a dated version like "gemini-1.5-pro-002". This helper adds the
 * "-latest" suffix automatically for known families if the user's env
 * var is set to the bare name.
 *
 * Default is "gemini-1.5-flash-latest" because Flash is universally
 * available in v1beta and is fast + cheap enough for STT/chat fallback.
 */
function getModel() {
  let m = (process.env.GEMINI_MODEL || "").trim();
  if (!m) return "gemini-1.5-flash-latest";

  // Strip any stray quotes or whitespace from env var values.
  m = m.replace(/^["']|["']$/g, "").trim();

  // Bare names need the -latest suffix to resolve in v1beta.
  //   gemini-1.5-pro     -> gemini-1.5-pro-latest
  //   gemini-1.5-flash   -> gemini-1.5-flash-latest
  //   gemini-pro         -> gemini-pro (leave; older v1 name)
  if (/^gemini-1\.5-(pro|flash)$/i.test(m)) {
    m = `${m}-latest`;
  }
  return m;
}

function getApiKey() {
  const k = process.env.GEMINI_API_KEY;
  if (!k) throw new Error("GEMINI_API_KEY not set");
  return k;
}

/**
 * Transcribe an audio buffer using Gemini's multi-modal audio input.
 * Gemini 1.5 models accept inline audio up to ~20 MB and can transcribe
 * in any language.
 *
 * @param {Buffer} buf    raw audio bytes
 * @param {string} mime   MIME type (audio/webm, audio/mp4, audio/ogg...)
 * @returns {Promise<string>} transcribed text, or "" if Gemini returned nothing
 */
export async function geminiTranscribe(buf, mime) {
  const apiKey = getApiKey();
  const model = getModel();
  const base64Audio = Buffer.from(buf).toString("base64");

  const url = `${GEMINI_ENDPOINT}/${encodeURIComponent(
    model
  )}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { inline_data: { mime_type: mime || "audio/webm", data: base64Audio } },
          {
            text:
              "Transcribe this audio exactly as spoken, in the original " +
              "language. Return only the spoken text. No preamble, no " +
              "quotes, no translation, no summary.",
          },
        ],
      },
    ],
    generationConfig: { temperature: 0.0 },
  };

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const errBody = await r.text().catch(() => "");
    let msg = `HTTP ${r.status}`;
    try {
      const parsed = JSON.parse(errBody);
      msg = parsed?.error?.message || parsed?.error?.status || msg;
    } catch {
      msg = errBody.slice(0, 300) || msg;
    }
    throw new Error(`Gemini STT failed (${r.status}): ${msg}`);
  }

  const data = await r.json().catch(() => ({}));
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text || "")
      .join("")
      .trim() || "";
  return text;
}

/**
 * Generate a chat completion from Gemini. Takes an array of messages
 * in OpenAI chat format and converts them to Gemini's format.
 * Gemini uses "user" / "model" roles (not "user"/"assistant") and
 * requires at least one "user" turn.
 *
 * @param {Array<{role: "system"|"user"|"assistant", content: string}>} messages
 * @param {object} [opts]
 * @param {number} [opts.temperature=0.6]
 * @returns {Promise<string>} the generated text
 */
export async function geminiChat(messages, opts = {}) {
  const apiKey = getApiKey();
  const model = getModel();
  const temperature = typeof opts.temperature === "number" ? opts.temperature : 0.6;

  // Gemini treats "system" via a separate systemInstruction field.
  const systemParts = [];
  const contents = [];
  for (const m of messages) {
    const role = m?.role;
    const content = String(m?.content || "");
    if (!content) continue;
    if (role === "system") {
      systemParts.push(content);
    } else if (role === "user") {
      contents.push({ role: "user", parts: [{ text: content }] });
    } else if (role === "assistant") {
      contents.push({ role: "model", parts: [{ text: content }] });
    }
  }
  if (!contents.length) {
    throw new Error("Gemini chat requires at least one user message");
  }

  const body = {
    contents,
    generationConfig: { temperature },
  };
  if (systemParts.length) {
    body.systemInstruction = { parts: [{ text: systemParts.join("\n\n") }] };
  }

  const url = `${GEMINI_ENDPOINT}/${encodeURIComponent(
    model
  )}:generateContent?key=${apiKey}`;

  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!r.ok) {
    const errBody = await r.text().catch(() => "");
    let msg = `HTTP ${r.status}`;
    try {
      const parsed = JSON.parse(errBody);
      msg = parsed?.error?.message || parsed?.error?.status || msg;
    } catch {
      msg = errBody.slice(0, 300) || msg;
    }
    throw new Error(`Gemini chat failed (${r.status}): ${msg}`);
  }

  const data = await r.json().catch(() => ({}));
  const text =
    data?.candidates?.[0]?.content?.parts
      ?.map((p) => p?.text || "")
      .join("")
      .trim() || "";
  return text;
}

/** @returns {boolean} true if a GEMINI_API_KEY is configured. */
export function geminiAvailable() {
  return Boolean(process.env.GEMINI_API_KEY);
}
