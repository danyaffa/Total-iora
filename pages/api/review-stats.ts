// FILE: /pages/api/review-stats.ts

import type { NextApiRequest, NextApiResponse } from "next";
import { getAdminDb } from "../../utils/firebaseAdmin";
import { APP_NAME } from "../../lib/appConfig";
import { withApi } from "../../lib/apiSecurity";
import { logger } from "../../lib/logger";

const log = logger.child({ fn: "api.review-stats" });

type Data = {
  success: boolean;
  count?: number;
  average?: number | null;
  error?: string;
};

async function handler(req: NextApiRequest, res: NextApiResponse<Data>) {
  const adminDb = getAdminDb();

  if (!adminDb) {
    log.warn("db_unavailable");
    return res.status(200).json({ success: true, count: 0, average: null });
  }

  try {
    const snap = await adminDb
      .collection("reviews")
      .where("appName", "==", APP_NAME)
      .where("rating", ">=", 4)
      .get();

    const count = snap.size;
    if (count === 0) {
      return res.status(200).json({ success: true, count: 0, average: null });
    }

    let sum = 0;
    snap.forEach((doc: any) => {
      const data = doc.data() as any;
      const r = typeof data.rating === "number" ? data.rating : 0;
      sum += r;
    });

    const average = sum / count;
    return res.status(200).json({ success: true, count, average });
  } catch (err: any) {
    log.error("stats_query_failed", { error: String(err?.message || err) });
    return res.status(200).json({ success: true, count: 0, average: null });
  }
}

export default withApi(handler as any, {
  name: "api.review-stats",
  methods: ["GET"],
  rate: { max: 120, windowMs: 60_000 },
});
