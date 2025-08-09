import { generateReading } from "../../lib/openai";

export default async function handler(req, res){
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const body = req.body || {};
    const reading = await generateReading(body);
    res.status(200).json({ reading });
  } catch (e) {
    res.status(200).json({ reading: "Today, trust the small courage already within you." });
  }
}
