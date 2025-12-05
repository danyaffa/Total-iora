// FILE: /pages/api/review-email.js
// Uses Resend + Firestore via firebase-admin.
// Only called by the ReviewWidget component.

import { Resend } from "resend";
import { adminDb } from "../../utils/firebaseAdmin";
import { APP_NAME } from "../../lib/appConfig";

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  console.log("🔔 /api/review-email called");
  console.log("🔑 RESEND_API_KEY set?", !!process.env.RESEND_API_KEY);
  console.log("📧 REVIEW_RECEIVER_EMAIL:", process.env.REVIEW_RECEIVER_EMAIL);

  if (req.method !== "POST") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  try {
    const { rating, text, comment, email, appName } = req.body || {};

    // Accept both "text" and "comment"
    const bodyText = (text ?? comment ?? "").toString();

    if (!bodyText.trim()) {
      console.log("⚠ Missing review text");
      return res
        .status(400)
        .json({ success: false, error: "Missing review text" });
    }

    const appLabel = appName || APP_NAME;
    const createdAt = new Date().toISOString();
    let docId = null;

    // ---- Save to Firestore (if adminDb is ready) --------------------------
    try {
      if (!adminDb) {
        console.warn(
          "⚠ Firebase admin not initialised – skipping Firestore write."
        );
      } else {
        const docRef = await adminDb.collection("reviews").add({
          rating: rating ?? null,
          text: bodyText,
          email: email || "",
          appName: appLabel,
          createdAt,
        });
        docId = docRef.id;
        console.log("✅ Firestore write OK, id =", docId);
      }
    } catch (err) {
      console.error("❌ Firestore write error:", err);
    }

    // ---- Send email via Resend (optional) ---------------------------------
    if (process.env.RESEND_API_KEY && process.env.REVIEW_RECEIVER_EMAIL) {
      try {
        console.log("🚀 Sending email via Resend…");
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

        console.log("✅ Resend email result:", result);
      } catch (err) {
        console.error("❌ Resend email send error:", err);
        // Still return success so the user sees "Thanks for your feedback"
      }
    } else {
      console.warn(
        "⚠ RESEND_API_KEY or REVIEW_RECEIVER_EMAIL not set – skipping email send."
      );
    }

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("❌ Review error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to submit review" });
  }
}
