// FILE: /pages/api/auracode-chat.js  (only the idea shown)
export default async function handler(req, res) {
  const { message, path, mode } = req.body || {};
  const isSkills = mode === "skills";

  const GUIDANCE = {
    Muslim: "Draw on adab & akhlaq, Qur’an, hadith, and Sufi practice. Offer practical steps.",
    Christian: "Draw on the Gospels, virtues, Church Fathers, and the saints. Offer kind, specific habits.",
    Jewish: "Draw on Rambam (Hilchot De’ot), Mussar, Psalms, and halacha where appropriate. Offer practical middot work.",
    Eastern: "Draw on the Eightfold Path, Taoist harmony, and Vedic disciplines. Offer daily practices.",
    Universal: "Draw on humanist ethics and contemplative practices. Offer simple, compassionate steps.",
  };

  const system = isSkills
    ? `You are a gentle guide for ${path} life skills. ${GUIDANCE[path] || ""} Keep it concrete, 3–6 steps max. No medical/legal claims.`
    : `You are a gentle ${path} spiritual guide. Offer presence, clarity, and short reflections.`;

  // ...use "system" + "message" with your LLM call, then res.json({ reply })
}
