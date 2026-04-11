// FILE: /pages/api/translate.js
export const dynamic = "force-dynamic";
export const maxDuration = 30;

import OpenAI from "openai";
import { withApi } from "../../lib/apiSecurity";
import { logger } from "../../lib/logger";

const log = logger.child({ fn: "api.translate" });

async function handler(req, res) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    log.error("missing_openai_key");
    return res.status(503).json({ error: "service_unavailable" });
  }

  const { text, target } = req.body || {};
  const src = String(text || "").trim();
  const tgt = String(target || "").trim();
  if (!src || !tgt) return res.status(400).json({ error: "missing_text_or_target" });
  if (src.length > 4000) return res.status(413).json({ error: "text_too_long" });
  if (tgt.length > 80) return res.status(400).json({ error: "invalid_target" });

  const openai = new OpenAI({ apiKey });
  const r = await openai.chat.completions.create({
    model: process.env.OPENAI_MODEL || "gpt-4o-mini",
    temperature: 0,
    messages: [
      {
        role: "system",
        content: `Translate the user's text. Output ONLY the translation in ${tgt}.`,
      },
      { role: "user", content: src },
    ],
  });

  const out = r?.choices?.[0]?.message?.content?.trim() || "";
  res.status(200).json({ text: out });
}

export default withApi(handler, {
  name: "api.translate",
  methods: ["POST"],
  rate: { max: 30, windowMs: 60_000 },
});
