// FILE: /components/ReviewWidgets.tsx

"use client";

import React, { useState, useEffect, type CSSProperties } from "react";
import { addReview } from "../lib/firestore";
import { APP_NAME } from "../lib/appConfig";

export type ReviewWidgetProps = {
  appName?: string;
  appStoreUrl?: string; // optional override for the app-store review page
  feedbackEndpoint?: string; // kept for compatibility, not used
};

// 👉 CHANGE THIS TO YOUR REAL APP-STORE REVIEW URL
const DEFAULT_APP_STORE_URL =
  "https://example.com/your-app-store-review-page";

const pillStyle: CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: 50,
  background: "#ffffff",
  color: "#0f172a",
  padding: "8px 16px",
  borderRadius: 999,
  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.3)",
  fontWeight: 600,
  fontSize: 14,
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
  border: "1px solid #e2e8f0",
};

const modalStyle: CSSProperties = {
  position: "fixed",
  bottom: 24,
  right: 24,
  zIndex: 51,
  background: "#1e293b",
  color: "white",
  padding: 20,
  borderRadius: 16,
  boxShadow: "0 20px 50px rgba(0, 0, 0, 0.5)",
  width: 300,
  border: "1px solid #334155",
};

const starButton: CSSProperties = {
  background: "transparent",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
};

const inputBase: CSSProperties = {
  width: "100%",
  borderRadius: 8,
  padding: 8,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white",
  fontSize: 14,
};

const buttonBase: CSSProperties = {
  width: "100%",
  padding: "10px",
  borderRadius: 8,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14,
};

type ReviewStats = {
  count: number;
  average: number | null;
};

const ReviewWidgets: React.FC<ReviewWidgetProps> = ({ appStoreUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const storeUrl = appStoreUrl || DEFAULT_APP_STORE_URL;
  const isPromotable = rating >= 4; // only 4★–5★ get store CTA + auto-open

  // 🔢 Load dynamic review stats for the pill (count + average)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const res = await fetch("/api/review-stats");
        if (!res.ok) {
          throw new Error("Failed to load review stats");
        }
        const data = (await res.json()) as {
          success: boolean;
          count?: number;
          average?: number | null;
        };
        if (data.success && typeof data.count === "number") {
          setStats({
            count: data.count,
            average: typeof data.average === "number" ? data.average : null,
          });
        }
      } catch (err) {
        console.error("Review stats error:", err);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchStats();
  }, []);

  // ⏱ After submit (4–5★), wait a few seconds, then open store page
  useEffect(() => {
    if (!submitted || !isPromotable || !storeUrl) return;

    let timer: number | undefined;

    try {
      timer = window.setTimeout(() => {
        try {
          window.open(storeUrl, "_blank", "noopener,noreferrer");
        } catch (err) {
          console.error("Failed to open store URL on delayed auto-open:", err);
        }
      }, 4000); // ~4 seconds to read the thank-you
    } catch (err) {
      console.error("Timer setup failed:", err);
    }

    return () => {
      if (timer) {
        window.clearTimeout(timer);
      }
    };
  }, [submitted, isPromotable, storeUrl]);

  const handleSubmit = async () => {
    if (!comment.trim()) return;

    setLoading(true);
    try {
      const shouldUpload = rating >= 4; // only good reviews stored + emailed

      if (shouldUpload) {
        // 1) Save to Firestore
        try {
          await addReview("guest", rating, comment, APP_NAME);
        } catch (err) {
          console.error("addReview failed:", err);
        }

        // 2) Email notification (via API)
        try {
          await fetch("/api/review-email", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              rating,
              comment,
              text: comment,
              appName: APP_NAME,
            }),
          });
        } catch (err) {
          console.error("Review email send failed:", err);
        }

        // 3) Optimistic stats update in UI
        setStats((prev) => {
          if (!prev) {
            return {
              count: 1,
              average: rating,
            };
          }
          const newCount = prev.count + 1;
          const oldAvg = prev.average ?? rating;
          const newAvg = (oldAvg * prev.count + rating) / newCount;
          return {
            count: newCount,
            average: newAvg,
          };
        });
      }

      // 4) Show thank-you confirmation (auto-open handled by useEffect)
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStore = () => {
    if (!storeUrl || !isPromotable) return;
    try {
      window.open(storeUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open store URL:", err);
    }
  };

  const renderPillText = () => {
    if (statsLoading) {
      return (
        <>
          <span style={{ color: "#eab308" }}>★★★★★</span>
          <span>Loading reviews…</span>
        </>
      );
    }

    if (stats && stats.count > 0) {
      const avg = stats.average ?? 4.9;
      return (
        <>
          <span style={{ color: "#eab308" }}>★★★★★</span>
          <span>
            {avg.toFixed(1)}/5 • {stats.count} review
            {stats.count === 1 ? "" : "s"}
          </span>
        </>
      );
    }

    // Fallback if no stats yet
    return (
      <>
        <span style={{ color: "#eab308" }}>★★★★★</span>
        <span>4.9/5 Reviews</span>
      </>
    );
  };

  // Closed pill
  if (!isOpen) {
    return (
      <div onClick={() => setIsOpen(true)} style={pillStyle}>
        {renderPillText()}
      </div>
    );
  }

  // Open modal
  return (
    <div style={modalStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <h3 style={{ margin: 0, fontSize: 16 }}>Rate {APP_NAME}</h3>
        <button
          onClick={() => {
            setIsOpen(false);
            setSubmitted(false);
            setComment("");
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: 16,
          }}
        >
          ✕
        </button>
      </div>

      {submitted ? (
        <div
          style={{
            textAlign: "center",
            padding: "12px 0 4px",
          }}
        >
          <p
            style={{
              margin: 0,
              marginBottom: 10,
              color: "#4ade80",
              fontWeight: 600,
            }}
          >
            Thank you for your feedback!
          </p>

          {isPromotable ? (
            <>
              <p
                style={{
                  margin: 0,
                  marginBottom: 12,
                  fontSize: 13,
                  color: "#cbd5f5",
                }}
              >
                If the store page didn’t open, tap below to leave a quick
                review in the app store. It helps more people discover{" "}
                {APP_NAME}.
              </p>

              <button
                onClick={handleOpenStore}
                style={{
                  ...buttonBase,
                  background: "#facc15",
                  color: "#0f172a",
                  marginBottom: 8,
                }}
              >
                💛 Leave a review in the app store
              </button>
            </>
          ) : (
            <p
              style={{
                margin: 0,
                marginBottom: 12,
                fontSize: 13,
                color: "#cbd5f5",
              }}
            >
              We really appreciate your honest feedback – it helps us improve{" "}
              {APP_NAME} for you.
            </p>
          )}

          <button
            onClick={() => {
              setIsOpen(false);
              setSubmitted(false);
              setComment("");
            }}
            style={{
              ...buttonBase,
              background: "#0f172a",
              color: "#e5e7eb",
              fontWeight: 500,
              fontSize: 13,
            }}
          >
            Close
          </button>
        </div>
      ) : (
        <>
          <div
            style={{
              display: "flex",
              gap: 8,
              marginBottom: 12,
              justifyContent: "center",
            }}
          >
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                style={{
                  ...starButton,
                  color: star <= rating ? "#eab308" : "#475569",
                }}
              >
                ★
              </button>
            ))}
          </div>

          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={`Tell us what you think about ${APP_NAME}...`}
            style={{
              ...inputBase,
              height: 80,
              marginBottom: 12,
              resize: "none",
            }}
          />

          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              ...buttonBase,
              background: "#38bdf8",
              color: "#0f172a",
              opacity: loading ? 0.7 : 1,
              cursor: loading ? "default" : "pointer",
            }}
          >
            {loading ? "Sending..." : "Submit Review"}
          </button>
        </>
      )}
    </div>
  );
};

export default ReviewWidgets;

// Keep named export so `import { ReviewWidget } from "../components/ReviewWidgets"`
// still works.
export const ReviewWidget = ReviewWidgets;
