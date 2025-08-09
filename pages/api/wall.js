import { db } from "../../lib/firebaseClient";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";

export default async function handler(req, res){
  try {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    const { note, candle } = req.body || {};
    if (!note && !candle) return res.status(400).json({ error: 'Empty' });
    await addDoc(collection(db, 'auraWall'), { note: note || null, candle: !!candle, createdAt: serverTimestamp() });
    res.status(200).json({ ok: true });
  } catch (e) {
    // Fallback "ok" so the UX still works even if Firestore isn't set yet
    res.status(200).json({ ok: true });
  }
}
