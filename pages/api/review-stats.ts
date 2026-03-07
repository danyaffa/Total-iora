// FILE: /pages/api/review-stats.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminDb } from "../../utils/firebaseAdmin";
import { APP_NAME } from "../../lib/appConfig";

type Data = {
  success: boolean;
  count?: number;
  average?: number | null;
  error?: string;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Data>
) {
  const adminDb = getAdminDb();

  if (req.method !== "GET") {
    return res
      .status(405)
      .json({ success: false, error: "Method not allowed" });
  }

  if (!adminDb) {
    console.warn("adminDb not initialised – returning zero stats.");
    return res.json({
      success: true,
      count: 0,
      average: null,
    });
  }

  try {
    // Only count good reviews (4★ and 5★)
    const snap = await adminDb
      .collection("reviews")
      .where("appName", "==", APP_NAME)
      .where("rating", ">=", 4)
      .get();

    const count = snap.size;

    if (count === 0) {
      return res.json({
        success: true,
        count: 0,
        average: null,
      });
    }

    let sum = 0;
    snap.forEach((doc) => {
      const data = doc.data() as any;
      const r = typeof data.rating === "number" ? data.rating : 0;
      sum += r;
    });

    const average = sum / count;

    return res.json({
      success: true,
      count,
      average,
    });
  } catch (err) {
    console.error("review-stats error:", err);
    return res
      .status(500)
      .json({ success: false, error: "Failed to load review stats" });
  }
}
