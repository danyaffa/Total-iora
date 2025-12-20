// FILE: /pages/api/register.js
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { name = "", email = "", phone = "" } = req.body || {};
  if (!name.trim() || !email.trim() || !phone.trim()) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const ref = db.collection("users").doc(email.toLowerCase());

    await ref.set(
      {
        name,
        email: email.toLowerCase(),
        phone,
        isPaid: false,
        createdAt: new Date(),
      },
      { merge: true }
    );

    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: "Registration failed" });
  }
}
