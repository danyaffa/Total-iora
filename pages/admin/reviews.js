// FILE: /pages/admin/reviews.js
// Admin-only list of recent reviews. Enforced at SSR using the same
// owner-session / admin-token check the API wrapper uses.

import Head from "next/head";
import { getAdminDb } from "../../utils/firebaseAdmin";
import { APP_NAME } from "../../lib/appConfig";
import { isAdminRequest } from "../../lib/adminAuth";
import { writeAudit } from "../../lib/audit";
import { logger } from "../../lib/logger";

const log = logger.child({ page: "admin/reviews" });

function ReviewsAdminPage({ reviews }) {
  return (
    <>
      <Head>
        <title>{APP_NAME} – Reviews Admin</title>
        <meta name="robots" content="noindex, nofollow" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className="wrap">
        <h1>{APP_NAME} – Reviews</h1>
        <p className="sub">Showing the latest {reviews.length} reviews from Firestore.</p>

        {reviews.length === 0 ? (
          <p>No reviews found.</p>
        ) : (
          <div className="tableWrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Rating</th>
                  <th>Email</th>
                  <th>App</th>
                  <th>Text</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id}>
                    <td>{r.createdAt || ""}</td>
                    <td>{r.rating ?? ""}</td>
                    <td className="email">{r.email || ""}</td>
                    <td>{r.appName || ""}</td>
                    <td className="text">{r.text || ""}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          background: #020617;
          color: #e5e7eb;
          padding: 16px;
        }
        h1 {
          font-size: 22px;
          font-weight: 700;
          margin: 0 0 8px;
        }
        .sub {
          color: #9ca3af;
          margin: 0 0 16px;
          font-size: 14px;
        }
        .tableWrap {
          overflow-x: auto;
          border-radius: 12px;
          border: 1px solid #1f2937;
          -webkit-overflow-scrolling: touch;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 640px;
        }
        thead {
          background: #111827;
        }
        th {
          text-align: left;
          padding: 10px 12px;
          font-weight: 600;
          color: #9ca3af;
        }
        td {
          padding: 8px 12px;
          vertical-align: top;
          border-top: 1px solid #1f2937;
        }
        .text {
          max-width: 400px;
        }
        .email {
          word-break: break-all;
        }
        @media (min-width: 720px) {
          .wrap {
            padding: 24px;
          }
          h1 {
            font-size: 28px;
          }
        }
      `}</style>
    </>
  );
}

export async function getServerSideProps(ctx) {
  const adminCheck = isAdminRequest(ctx.req);
  if (!adminCheck.ok) {
    log.warn("admin_page_denied", {
      ip: ctx.req?.headers?.["x-forwarded-for"] || "",
    });
    return { notFound: true };
  }

  writeAudit({
    action: "admin.view_reviews",
    actor: adminCheck.actor,
    route: "admin/reviews",
  }).catch(() => {});

  const adminDb = getAdminDb();
  if (!adminDb) {
    log.warn("db_unavailable");
    return { props: { reviews: [] } };
  }

  try {
    // wrapClientDb / REST fallback don't implement orderBy; use a safe
    // path that works with the Admin SDK and gracefully falls back.
    let snap;
    try {
      snap = await adminDb
        .collection("reviews")
        .orderBy("createdAt", "desc")
        .limit(200)
        .get();
    } catch {
      snap = await adminDb.collection("reviews").limit(200).get();
    }

    const reviews = snap.docs.map((doc) => {
      const data = doc.data() || {};
      const createdAt = data.createdAt;
      return {
        id: doc.id,
        rating: data.rating ?? null,
        text: data.text || "",
        email: data.email || "",
        appName: data.appName || "",
        createdAt:
          createdAt?.toDate?.()?.toISOString?.() ||
          (typeof createdAt === "string" ? createdAt : null),
      };
    });

    // Sort fallback in memory (newest first)
    reviews.sort((a, b) => (b.createdAt || "").localeCompare(a.createdAt || ""));
    return { props: { reviews } };
  } catch (err) {
    log.error("query_failed", { error: String(err?.message || err) });
    return { props: { reviews: [] } };
  }
}

export default ReviewsAdminPage;
