// FILE: /pages/api/review-email.js
//
// Clean, stable, production-safe review email handler
// Sends email via Resend + stores in Firestore (server-side backup)

import { Resend } from "resend";
import { adminDb } from "../../utils/firebaseAdmin";
import { APP_NAME } from "../../lib/appConfig";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Normalise incoming data
    const {
      rating = null,
      text = "",
      comment = "",
      email = "",
      appName = APP_NAME,
    } = req.body || {};

    // Use whichever text exists
    const reviewText = (text || comment || "").toString().trim();

    if (!reviewText) {
      return res.status(400).json({ error: "Missing review text" });
    }

    const createdAt = new Date().toISOString();
    let firestoreId = null;

    // --- FIRESTORE WRITE ----------------------------------------------------
    try {
      if (!adminDb) {
        console.warn("⚠ Firebase admin not initialised – skipping Firestore write.");
      } else {
        const docRef = await adminDb.collection("reviews").add({
          rating: typeof rating === "number" ? rating : null,
          text: reviewText,
          email: email || "",
          appName,
          createdAt,
        });
        firestoreId = docRef.id;
      }
    } catch (err) {
      console.error("❌ Firestore write failed:", err);
    }

    // --- EMAIL SEND ---------------------------------------------------------
    const hasEnv =
      process.env.RESEND_API_KEY &&
      process.env.REVIEW_RECEIVER_EMAIL &&
      typeof process.env.REVIEW_RECEIVER_EMAIL === "string";

    if (hasEnv) {
      try {
        await resend.emails.send({
          from: "Reviews <onboarding@resend.dev>",
          to: process.env.REVIEW_RECEIVER_EMAIL,
          subject: `New ${appName} review – ${rating ?? "no"}★`,
          text: [
            `App: ${appName}`,
            `Rating: ${rating ?? "n/a"} stars`,
            `From: ${email || "anonymous"}`,
            `Created at: ${createdAt}`,
            firestoreId ? `Firestore ID: ${firestoreId}` : "",
            "",
            "Review text:",
            reviewText,
          ]
            .filter(Boolean)
            .join("\n"),
        });
      } catch (err) {
        console.error("❌ Resend email send error:", err);
      }
    } else {
      console.warn("⚠ Email skipped – RESEND_API_KEY or REVIEW_RECEIVER_EMAIL missing.");
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Review handler error:", err);
    return res.status(500).json({ error: "Failed to submit review" });
  }
}
