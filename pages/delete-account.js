// FILE: /pages/delete-account.js
import Head from "next/head";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuth, onAuthStateChanged, signOut } from "firebase/auth";
import { initFirebase } from "../utils/firebaseClient";
import Footer from "../components/Footer";

export default function DeleteAccountPage() {
  const [user, setUser] = useState(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => {
    initFirebase();
    const auth = getAuth();
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsub();
  }, []);

  async function doDelete() {
    setStatus("");
    try {
      if (!user) {
        setStatus("You must be logged in to delete your account.");
        return;
      }

      const ok = confirm(
        "FINAL CONFIRMATION:\n\nThis will permanently delete your account and personal data.\nThis cannot be undone.\n\nProceed?"
      );
      if (!ok) return;

      setBusy(true);

      const idToken = await user.getIdToken(true);

      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Deletion failed");

      // Sign out locally after server deletion
      await signOut(getAuth());

      setStatus("✅ Your account and personal data have been deleted.");
      setUser(null);
    } catch (e) {
      setStatus(`❌ ${e?.message || "Deletion failed"}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page">
      <Head>
        <title>Delete Account | Total-iora</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="description"
          content="Delete your Total-iora account and personal data automatically."
        />
      </Head>

      <nav className="topnav">
        <Link href="/" className="backLink">
          ← Back to Home
        </Link>
      </nav>

      <main className="main">
        <section className="card">
          <h1>Delete Account &amp; Personal Data</h1>
          <p className="sub">
            This action is <strong>automatic</strong> and <strong>permanent</strong>.
            It deletes your account <strong> Record</strong> user.
          </p>

          {!user ? (
            <div className="warn">
              <p>
                You are not logged in. Please{" "}
                <Link href="/login" className="link">
                  log in
                </Link>{" "}
                to delete your account.
              </p>
            </div>
          ) : (
            <>
              <div className="info">
                <div className="label">Signed in as</div>
                <div className="value">{user.email || user.uid}</div>
              </div>

              <button className="danger" onClick={doDelete} disabled={busy}>
                {busy ? "Deleting..." : "DELETE MY ACCOUNT NOW"}
              </button>

              <p className="tiny">
                If you only want to stop payments, use the payment provider’s cancellation tools.
              </p>
            </>
          )}

          {status && <div className="status">{status}</div>}

          <hr className="hr" />

          <div className="linksRow">
            <Link href="/privacy" className="link">
              Privacy
            </Link>
            <span>·</span>
            <Link href="/terms" className="link">
              Terms
            </Link>
            <span>·</span>
            <Link href="/legal" className="link">
              Legal
            </Link>
          </div>
        </section>
      </main>

      <Footer />

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(#ffffff, #f8fafc);
          color: #0f172a;
        }
        .topnav {
          padding: 18px 16px;
          text-align: center;
        }
        .backLink {
          color: #7c3aed;
          font-weight: 800;
          text-decoration: underline;
        }
        .main {
          padding: 10px 16px 50px;
        }
        .card {
          max-width: 880px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 34px;
          box-shadow: 0 14px 40px rgba(2, 6, 23, 0.06);
        }
        h1 {
          font-size: 2rem;
          margin: 0 0 10px;
          font-weight: 900;
        }
        .sub {
          color: #475569;
          line-height: 1.7;
          margin: 0 0 18px;
        }
        .warn {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          color: #7c2d12;
          padding: 14px 16px;
          border-radius: 14px;
        }
        .info {
          margin: 14px 0 16px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
        }
        .label {
          font-size: 0.85rem;
          color: #64748b;
          font-weight: 800;
        }
        .value {
          margin-top: 4px;
          font-weight: 900;
          color: #0f172a;
          word-break: break-word;
        }
        .danger {
          width: 100%;
          margin-top: 6px;
          padding: 12px 14px;
          border-radius: 14px;
          border: none;
          background: #ef4444;
          color: white;
          font-weight: 900;
          letter-spacing: 0.3px;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(239, 68, 68, 0.28);
        }
        .danger:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          box-shadow: none;
        }
        .tiny {
          margin-top: 10px;
          font-size: 0.9rem;
          color: #64748b;
        }
        .status {
          margin-top: 16px;
          padding: 12px 14px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #f1f5f9;
          color: #0f172a;
          font-weight: 800;
        }
        .hr {
          margin: 18px 0 14px;
          border: none;
          border-top: 1px solid #e2e8f0;
        }
        .linksRow {
          display: flex;
          gap: 10px;
          justify-content: center;
          align-items: center;
          color: #94a3b8;
          flex-wrap: wrap;
        }
        .link {
          color: #7c3aed;
          font-weight: 800;
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
}
