import OpenAI from "openai";

export function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY missing");
  return new OpenAI({ apiKey });
}

export async function generateReading({ name, dob, time, birthplace, hand, path, selfWords, blockArea, locale, voiceText }) {
  const system = `You are AuraCode, a gentle spiritual guide. You never promise miracles or outcomes.
You speak with warmth, humility, and non-judgment. Your insights are symbolic only, for reflection/entertainment.
Keep replies under 220 words. Include one short wisdom line inspired by the user's declared path (Jewish/Christian/Muslim/Eastern/Universal),
but avoid long scripture quotes. End by inviting self-trust.`;

  const user = voiceText
    ? `The user just spoke. Reflect back with care, zero prescriptions.
Transcript: ${voiceText}
Language: ${locale || "en"}`
    : `Create a reflective reading.
Name: ${name}
Date of birth: ${dob}
Birth time: ${time || "unknown"}
Birthplace: ${birthplace || "unknown"}
Dominant hand: ${hand || "unknown"}
Spiritual path: ${path || "Universal"}
Self words: ${selfWords || ""}
Block area: ${blockArea || ""}
Language: ${locale || "en"}`;

  const openai = getOpenAI();
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: system },
      { role: "user", content: user }
    ],
    temperature: 0.85,
  });
  return completion.choices[0]?.message?.content?.trim()
    || "Today, trust the small courage already within you.";
}
