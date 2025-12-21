// FILE: /pages/api/delete-account.js
import { adminAuth, adminDb } from "../../utils/firebaseAdmin";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    if (!adminAuth || !adminDb) {
      return res.status(500).json({
        error:
          "Firebase Admin is not initialised. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY.",
      });
    }

    const { idToken } = req.body || {};
    if (!idToken) return res.status(400).json({ error: "Missing idToken" });

    const decoded = await adminAuth.verifyIdToken(idToken);
    const uid = decoded.uid;
    const email = (decoded.email || "").trim().toLowerCase();

    // 1) Delete Firestore doc(s)
    // Your current schema: users/{email}
    if (email) {
      const userDocRef = adminDb.collection("users").doc(email);
      const snap = await userDocRef.get();
      if (snap.exists) await userDocRef.delete();
    }

    // If you ALSO store any UID-based mapping later, this keeps you safe:
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
