// FILE: /components/ReviewWidget.js

"use client";

import React, { useState, useEffect } from "react";
import { addReview } from "../lib/firestore";
import { APP_NAME } from "../lib/appConfig";

// 👉 CHANGE THIS TO YOUR REAL APP-STORE REVIEW URL
const DEFAULT_APP_STORE_URL =
  "https://example.com/your-app-store-review-page";

const pillStyle = {
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

const modalStyle = {
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

const starButton = {
  background: "transparent",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
};

const inputBase = {
  width: "100%",
  borderRadius: 8,
  padding: 8,
  border: "1px solid #334155",
  background: "#0f172a",
  color: "white",
  fontSize: 14,
};

const buttonBase = {
  width: "100%",
  padding: "10px",
  borderRadius: 8,
  border: "none",
  fontWeight: 700,
  cursor: "pointer",
  fontSize: 14,
};

const ReviewWidgets = ({ appStoreUrl }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const storeUrl = appStoreUrl || DEFAULT_APP_STORE_URL;
  const isPromotable = rating >= 4; // 4–5★ only

  // 🔢 Load review stats for pill
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
            average:
              typeof data.average === "number" ? data.average : null,
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

  // ⏱ Auto-open app store after 4000ms (4–5★ only)
  useEffect(() => {
    if (!submitted || !isPromotable || !storeUrl) return;

    let timer;

    try {
      timer = window.setTimeout(() => {
        try {
          window.open(storeUrl, "_blank", "noopener,noreferrer");
        } catch (err) {
          console.error("Failed to open store URL on delay:", err);
        }
      }, 4000); // 4 seconds
    } catch (err) {
      console.error("Timer setup failed:", err);
    }

    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [submitted, isPromotable, storeUrl]);

  const handleSubmit = () => {
    if (!comment.trim()) return;

    setLoading(true);

    const currentRating = rating;
    const currentComment = comment;
    const shouldUpload = currentRating >= 4; // only 4–5★ stored + emailed

    // Fire-and-forget async work: DO NOT block the UI
    (async () => {
      try {
        if (shouldUpload) {
          // 1) Save in Firestore
          try {
            await addReview("guest", currentRating, currentComment, APP_NAME);
          } catch (err) {
            console.error("addReview failed:", err);
          }

          // 2) Email notification
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
            console.error("Review email send failed:", err);
          }

          // 3) Optimistic stats update in UI
          setStats((prev) => {
            if (!prev) {
              return {
