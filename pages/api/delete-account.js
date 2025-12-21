// FILE: /pages/api/delete-account.js
import { adminAuth, adminDb } from "../../lib/firebaseAdmin";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: "Missing idToken" });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;

    // 1) Delete Firestore user docs
    // IMPORTANT: your current repo uses users keyed by EMAIL (doc id = email).
    // We delete both: users/{email} and users_by_uid/{uid} if present.
    const email = (decoded.email || "").toLowerCase().trim();

    // A) users/{email}
    if (email) {
      const byEmailRef = adminDb.collection("users").doc(email);
      const byEmailSnap = await byEmailRef.get();
      if (byEmailSnap.exists) await byEmailRef.delete();
    }

    // B) users_by_uid/{uid} (optional if you add it later)
    const byUidRef = adminDb.collection("users_by_uid").doc(uid);
    const byUidSnap = await byUidRef.get();
    if (byUidSnap.exists) await byUidRef.delete();

    // 2) Delete Firebase Auth user
    await adminAuth.deleteUser(uid);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("delete-account error:", e);
    return res.status(400).json({ error: e?.message || "Delete failed" });
  }
}
