// FILE: /lib/firestore.js

import {
  collection,
  addDoc,
  Timestamp,
  getDocs,
  orderBy,
  limit,
  query,
} from "firebase/firestore";
import { db } from "./firebaseClient";
import { APP_NAME } from "./appConfig";

export async function addReview(userId, rating, comment, appName) {
  if (!db) {
    console.warn("⚠ Firestore db is not initialised (client). Skipping addReview.");
    return null;
  }

  const reviewsRef = collection(db, "reviews");
  const docRef = await addDoc(reviewsRef, {
    userId: userId || "guest",
    rating: typeof rating === "number" ? rating : null,
    comment: comment || "",
    appName: appName || APP_NAME,
    createdAt: Timestamp.now(),
  });

  return docRef;
}

// Optional helper if you ever want to list reviews client-side.
export async function getRecentReviews(limitCount = 50) {
  if (!db) {
    console.warn("⚠ Firestore db is not initialised (client). Returning empty list.");
    return [];
  }

  const reviewsRef = collection(db, "reviews");
  const q = query(reviewsRef, orderBy("createdAt", "desc"), limit(limitCount));
  const snap = await getDocs(q);

  return snap.docs.map((d) => ({ id: d.id, ...(d.data() || {}) }));
}
