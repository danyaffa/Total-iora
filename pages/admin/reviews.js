// FILE: /pages/admin/reviews.js

import Head from "next/head";
import { getAdminDb } from "../../utils/firebaseAdmin";
import { APP_NAME } from "../../lib/appConfig";

function ReviewsAdminPage({ reviews }) {
  return (
    <>
      <Head>
        <title>{APP_NAME} – Reviews Admin</title>
      </Head>

      <div
        style={{
          minHeight: "100vh",
          backgroundColor: "#020617",
          color: "#e5e7eb",
          padding: "24px",
        }}
      >
        <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 16 }}>
          {APP_NAME} – Reviews
        </h1>

        <p style={{ marginBottom: 24, color: "#9ca3af" }}>
          Showing the latest {reviews.length} reviews from Firestore.
        </p>

        {reviews.length === 0 ? (
          <p>No reviews found.</p>
        ) : (
          <div
            style={{
              overflowX: "auto",
              borderRadius: 12,
              border: "1px solid #1f2937",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 14,
              }}
            >
              <thead style={{ backgroundColor: "#111827" }}>
                <tr>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Rating</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>App</th>
                  <th style={thStyle}>Text</th>
                  <th style={thStyle}>ID</th>
                </tr>
              </thead>
              <tbody>
                {reviews.map((r) => (
                  <tr key={r.id} style={{ borderTop: "1px solid #1f2937" }}>
                    <td style={tdStyle}>{r.createdAt || ""}</td>
                    <td style={tdStyle}>{r.rating ?? ""}</td>
                    <td style={tdStyle}>{r.email || ""}</td>
                    <td style={tdStyle}>{r.appName || ""}</td>
                    <td style={{ ...tdStyle, maxWidth: 400 }}>{r.text || ""}</td>
                    <td
                      style={{
                        ...tdStyle,
                        fontSize: 11,
                        color: "#6b7280",
                        wordBreak: "break-all",
                      }}
                    >
                      {r.id}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

const thStyle = {
  textAlign: "left",
  padding: "10px 12px",
  fontWeight: 600,
  fontSize: 13,
  color: "#9ca3af",
};

const tdStyle = {
  padding: "8px 12px",
  verticalAlign: "top",
};

export async function getServerSideProps() {
  const adminDb = getAdminDb();
  if (!adminDb) {
    console.warn("adminDb not initialised – returning empty reviews list.");
    return { props: { reviews: [] } };
  }

  const snap = await adminDb
    .collection("reviews")
    .orderBy("createdAt", "desc")
    .limit(200)
    .get();

  const reviews = snap.docs.map((doc) => {
    const data = doc.data() || {};
    return {
      id: doc.id,
      rating: data.rating ?? null,
      text: data.text || "",
      email: data.email || "",
      appName: data.appName || "",
      createdAt: data.createdAt || null,
    };
  });

  return { props: { reviews } };
}

export default ReviewsAdminPage;
