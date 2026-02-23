// FILE: /components/ReviewWidget.js
// Floating, draggable review pill + modal

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { addReview } from "../lib/firestore";
import { APP_NAME } from "../lib/appConfig";

const DEFAULT_APP_STORE_URL =
  "https://example.com/your-app-store-review-page";

const ReviewWidgets = ({ appStoreUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Draggable state
  const pillRef = useRef(null);
  const modalRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [initialized, setInitialized] = useState(false);
  const dragState = useRef({
    isDragging: false,
    hasMoved: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
  });

  const storeUrl = appStoreUrl || DEFAULT_APP_STORE_URL;
  const isPromotable = rating >= 4;

  // Initialize position (bottom-right)
  useEffect(() => {
    if (typeof window === "undefined") return;
    setPos({
      x: window.innerWidth - 220,
      y: window.innerHeight - 70,
    });
    setInitialized(true);
  }, []);

  // Load review stats
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStatsLoading(true);
        const res = await fetch("/api/review-stats");
        if (!res.ok) throw new Error("Failed to load review stats");
        const data = await res.json();
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

  // Auto-open app store after 4s (4-5 star only)
  useEffect(() => {
    if (!submitted || !isPromotable || !storeUrl) return;
    const timer = setTimeout(() => {
      try {
        window.open(storeUrl, "_blank", "noopener,noreferrer");
      } catch (err) {
        console.error("Failed to open store URL:", err);
      }
    }, 4000);
    return () => clearTimeout(timer);
  }, [submitted, isPromotable, storeUrl]);

  // --- Drag handlers ---
  const clamp = useCallback((val, min, max) => Math.min(Math.max(val, min), max), []);

  const onPointerDown = useCallback((e) => {
    if (isOpen) return;
    const el = pillRef.current;
    if (!el) return;
    e.preventDefault();
    el.setPointerCapture(e.pointerId);
    const rect = el.getBoundingClientRect();
    dragState.current = {
      isDragging: true,
      hasMoved: false,
      startX: e.clientX,
      startY: e.clientY,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
    };
  }, [isOpen]);

  const onPointerMove = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    const dx = e.clientX - dragState.current.startX;
    const dy = e.clientY - dragState.current.startY;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      dragState.current.hasMoved = true;
    }
    const newX = e.clientX - dragState.current.offsetX;
    const newY = e.clientY - dragState.current.offsetY;
    setPos({
      x: clamp(newX, 0, window.innerWidth - 180),
      y: clamp(newY, 0, window.innerHeight - 50),
    });
  }, [clamp]);

  const onPointerUp = useCallback((e) => {
    if (!dragState.current.isDragging) return;
    dragState.current.isDragging = false;
    if (pillRef.current) {
      pillRef.current.releasePointerCapture(e.pointerId);
    }
    if (!dragState.current.hasMoved) {
      setIsOpen(true);
    }
  }, []);

  const handleSubmit = () => {
    if (!comment.trim()) return;
    setLoading(true);

    const currentRating = rating;
    const currentComment = comment;
    const shouldUpload = currentRating >= 4;

    (async () => {
      try {
        if (shouldUpload) {
          try {
            await addReview("guest", currentRating, currentComment, APP_NAME);
          } catch (err) {
            console.error("addReview failed:", err);
          }
          try {
            await fetch("/api/review-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                rating: currentRating,
                comment: currentComment,
                text: currentComment,
                appName: APP_NAME,
              }),
            });
          } catch (err) {
            console.error("Review email failed:", err);
          }
          setStats((prev) => {
            if (!prev) return { count: 1, average: currentRating };
            const oldAvg = prev.average == null ? currentRating : prev.average;
            const newCount = prev.count + 1;
            const newAvg = (oldAvg * prev.count + currentRating) / newCount;
            return { count: newCount, average: newAvg };
          });
        } else {
          try {
            await fetch("/api/review-email", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                rating: currentRating,
                comment: currentComment,
                text: currentComment,
                appName: APP_NAME,
              }),
            });
          } catch (err) {
            console.error("Low-rating email failed:", err);
          }
        }
      } catch (err) {
        console.error("Review submit error:", err);
      }
    })();

    setSubmitted(true);
    setLoading(false);
  };

  const handleOpenStore = () => {
    if (!storeUrl || !isPromotable) return;
    try {
      window.open(storeUrl, "_blank", "noopener,noreferrer");
    } catch (err) {
      console.error("Failed to open store URL:", err);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
    setSubmitted(false);
    setComment("");
  };

  const renderPillText = () => {
    if (statsLoading) {
      return (
        <>
          <span className="rw-stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;</span>
          <span>Loading...</span>
        </>
      );
    }
    if (stats && stats.count > 0) {
      const avg = stats.average == null ? 4.9 : stats.average;
      return (
        <>
          <span className="rw-stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;</span>
          <span>
            {avg.toFixed(1)}/5 · {stats.count} review
            {stats.count === 1 ? "" : "s"}
          </span>
        </>
      );
    }
    return (
      <>
        <span className="rw-stars">&#x2605;&#x2605;&#x2605;&#x2605;&#x2605;</span>
        <span>4.9/5 Reviews</span>
      </>
    );
  };

  if (!initialized) return null;

  return (
    <>
      {/* Floating draggable pill */}
      {!isOpen && (
        <div
          ref={pillRef}
          className="rw-pill"
          style={{
            left: pos.x,
            top: pos.y,
          }}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          role="button"
          aria-label="Open review form"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") setIsOpen(true);
          }}
        >
          {renderPillText()}
        </div>
      )}

      {/* Review modal */}
      {isOpen && (
        <div
          ref={modalRef}
          className="rw-modal"
          style={{
            left: Math.min(pos.x, (typeof window !== "undefined" ? window.innerWidth : 400) - 320),
            top: Math.min(pos.y - 200, (typeof window !== "undefined" ? window.innerHeight : 600) - 350),
          }}
        >
          <div className="rw-modal-header">
            <h3>Rate {APP_NAME}</h3>
            <button onClick={closeModal} className="rw-close" aria-label="Close">
              &#x2715;
            </button>
          </div>

          {submitted ? (
            <div className="rw-thanks">
              <p className="rw-success-text">Thank you for your feedback!</p>
              {isPromotable ? (
                <>
                  <p className="rw-sub-text">
                    If the store page didn't open yet, tap below to leave a
                    review. It helps more people discover {APP_NAME}.
                  </p>
                  <button onClick={handleOpenStore} className="rw-store-btn">
                    Leave a review in the app store
                  </button>
                </>
              ) : (
                <p className="rw-sub-text">
                  We really appreciate your honest feedback — it helps us
                  improve {APP_NAME} for you.
                </p>
              )}
              <button onClick={closeModal} className="rw-close-btn">
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="rw-star-row">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className={`rw-star ${star <= rating ? "active" : ""}`}
                    aria-label={`${star} star`}
                  >
                    &#x2605;
                  </button>
                ))}
              </div>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder={`Tell us what you think about ${APP_NAME}...`}
                className="rw-textarea"
              />
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="rw-submit"
              >
                {loading ? "Sending..." : "Submit Review"}
              </button>
            </>
          )}
        </div>
      )}

      <style jsx>{`
        .rw-pill {
          position: fixed;
          z-index: 9990;
          background: #ffffff;
          color: #0f172a;
          padding: 8px 16px;
          border-radius: 999px;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          font-weight: 600;
          font-size: 13px;
          display: flex;
          align-items: center;
          gap: 6px;
          cursor: grab;
          border: 1px solid #e2e8f0;
          user-select: none;
          touch-action: none;
          transition: box-shadow 0.2s;
          white-space: nowrap;
        }
        .rw-pill:active {
          cursor: grabbing;
          box-shadow: 0 14px 35px rgba(0, 0, 0, 0.4);
        }
        .rw-stars {
          color: #eab308;
          letter-spacing: 1px;
        }

        .rw-modal {
          position: fixed;
          z-index: 9991;
          background: #1e293b;
          color: white;
          padding: 20px;
          border-radius: 16px;
          box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
          width: 300px;
          max-width: calc(100vw - 24px);
          border: 1px solid #334155;
        }
        .rw-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .rw-modal-header h3 {
          margin: 0;
          font-size: 16px;
          font-weight: 700;
        }
        .rw-close {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 16px;
          padding: 4px;
        }

        .rw-star-row {
          display: flex;
          gap: 8px;
          justify-content: center;
          margin-bottom: 12px;
        }
        .rw-star {
          background: transparent;
          border: none;
          font-size: 28px;
          cursor: pointer;
          color: #475569;
          padding: 2px;
          transition: color 0.15s;
        }
        .rw-star.active {
          color: #eab308;
        }

        .rw-textarea {
          width: 100%;
          border-radius: 8px;
          padding: 10px;
          border: 1px solid #334155;
          background: #0f172a;
          color: white;
          font-size: 14px;
          height: 80px;
          resize: none;
          margin-bottom: 12px;
          font-family: inherit;
        }

        .rw-submit {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
          background: #38bdf8;
          color: #0f172a;
          transition: opacity 0.2s;
        }
        .rw-submit:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .rw-thanks {
          text-align: center;
          padding: 8px 0;
        }
        .rw-success-text {
          color: #4ade80;
          font-weight: 600;
          margin: 0 0 10px;
        }
        .rw-sub-text {
          font-size: 13px;
          color: #cbd5e1;
          margin: 0 0 12px;
        }
        .rw-store-btn {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: none;
          font-weight: 700;
          cursor: pointer;
          font-size: 14px;
          background: #facc15;
          color: #0f172a;
          margin-bottom: 8px;
        }
        .rw-close-btn {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: none;
          font-weight: 500;
          cursor: pointer;
          font-size: 13px;
          background: #0f172a;
          color: #e5e7eb;
        }

        @media (max-width: 480px) {
          .rw-modal {
            width: calc(100vw - 24px);
            left: 12px !important;
          }
        }
      `}</style>
    </>
  );
};

export default ReviewWidgets;
export const ReviewWidget = ReviewWidgets;
