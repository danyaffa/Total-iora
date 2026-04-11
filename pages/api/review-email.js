// FILE: /pages/api/review-email.js
// Saves a review to Firestore and optionally emails it via Resend.

import { Resend } from "resend";
import { getAdminDb } from "../../utils/firebaseAdmin";
import { APP_NAME } from "../../lib/appConfig";
import { withApi } from "../../lib/apiSecurity";
import { logger } from "../../lib/logger";

const log = logger.child({ fn: "api.review-email" });

async function handler(req, res) {
  const adminDb = getAdminDb();
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
  const { rating, text, comment, email, appName } = req.body || {};

  const bodyText = (text ?? comment ?? "").toString();
  const numericRating = typeof rating === "number" ? rating : Number(rating);
  const safeRating = Number.isFinite(numericRating) ? Math.round(numericRating) : null;

  if (!safeRating && !bodyText.trim()) {
    return res.status(400).json({ success: false, error: "missing_rating_or_text" });
  }
  if (safeRating != null && (safeRating < 1 || safeRating > 5)) {
    return res.status(400).json({ success: false, error: "invalid_rating" });
  }
  if (bodyText.length > 4000) {
    return res.status(413).json({ success: false, error: "text_too_long" });
  }
  const safeEmail = String(email || "").trim().slice(0, 254);
  if (safeEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(safeEmail)) {
    return res.status(400).json({ success: false, error: "invalid_email" });
  }

  const appLabel = String(appName || APP_NAME).slice(0, 120);
  const createdAt = new Date().toISOString();
  let docId = null;

  if (!adminDb) {
    log.warn("db_unavailable");
  } else {
    try {
      const docRef = await adminDb.collection("reviews").add({
        rating: safeRating,
        text: bodyText,
        email: safeEmail,
        appName: appLabel,
        createdAt,
      });
      docId = docRef.id;
    } catch (err) {
      log.error("firestore_write_failed", { error: String(err?.message || err) });
    }
  }

  if (resend && process.env.REVIEW_RECEIVER_EMAIL) {
    try {
      await resend.emails.send({
        from: "Reviews <onboarding@resend.dev>",
        to: process.env.REVIEW_RECEIVER_EMAIL,
        subject: `New ${appLabel} review – ${safeRating ?? "no"}★`,
        text: [
          `App: ${appLabel}`,
          `Rating: ${safeRating ?? "n/a"} stars`,
          `From email: ${safeEmail || "anonymous"}`,
          `Created at: ${createdAt}`,
          docId ? `Firestore ID: ${docId}` : "",
          "",
          "Review text:",
          bodyText,
        ]
          .filter(Boolean)
          .join("\n"),
      });
    } catch (err) {
      log.error("resend_email_failed", { error: String(err?.message || err) });
    }
  } else {
    log.info("resend_skipped");
  }

  return res.status(200).json({ success: true });
}

export default withApi(handler, {
  name: "api.review-email",
  methods: ["POST"],
  rate: { max: 10, windowMs: 60_000 },
});
