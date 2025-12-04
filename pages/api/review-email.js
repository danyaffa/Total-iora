// FILE: /pages/api/review-email.js

// Uses Firebase Admin + Resend to store / email 4★–5★ reviews.

import { Resend } from "resend";
import { adminDb } from "../../utils/firebaseAdmin";
import { APP_NAME } from "../../lib/appConfig";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { rating, text, comment, email, appName } = req.body || {};

    const bodyText = ((text ?? comment) || "").toString();
    if (!bodyText.trim()) {
      return res.status(400).json({ error: "Missing review text" });
    }

    const appLabel = appName || APP_NAME;
    const createdAt = new Date().toISOString();
    let docId = null;

    // Save to Firestore (server) – note: we already store via client for >=4★,
    // but this is a safe backup; if adminDb not ready we skip.
    if (!adminDb) {
      console.warn("⚠ Firebase admin not initialised – skipping Firestore write.");
    } else {
      const docRef = await adminDb.collection("reviews").add({
        rating: typeof rating === "number" ? rating : null,
        text: bodyText,
        email: email || "",
        appName: appLabel,
        createdAt,
      });
      docId = docRef.id;
    }

    // Email via Resend
    if (process.env.RESEND_API_KEY && process.env.REVIEW_RECEIVER_EMAIL) {
      try {
        const result = await resend.emails.send({
          from: "Reviews <onboarding@resend.dev>",
          to: process.env.REVIEW_RECEIVER_EMAIL,
          subject: `New ${appLabel} review – ${rating ?? "no"}★`,
          text: [
            `App: ${appLabel}`,
            `Rating: ${rating ?? "n/a"} stars`,
            `From email: ${email || "anonymous"}`,
            `Created at: ${createdAt}`,
            docId ? `Firestore ID: ${docId}` : "",
            "",
            "Review text:",
            bodyText,
          ]
            .filter(Boolean)
            .join("\n"),
        });
        console.log("Resend email result:", result);
      } catch (err) {
        console.error("Resend email send error:", err);
      }
    } else {
      console.warn(
        "⚠ RESEND_API_KEY or REVIEW_RECEIVER_EMAIL not set – skipping email send."
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Review error:", err);
    return res.status(500).json({ error: "Failed to submit review" });
  }
}
