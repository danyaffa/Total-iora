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
  const [showConfirm, setShowConfirm] = useState(false);
  const [action, setAction] = useState(null); // "remove-data" | "stop-account"

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
        setStatus("Error: You must be logged in to manage your account.");
        return;
      }

      setBusy(true);
      const idToken = await user.getIdToken(true);

      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error || "Operation failed");

      await signOut(getAuth());
      setStatus("Your account and all personal data have been permanently deleted.");
      setUser(null);
      setShowConfirm(false);
    } catch (e) {
      setStatus(`Error: ${e?.message || "Operation failed. Please try again."}`);
    } finally {
      setBusy(false);
    }
  }

  function handleAction(type) {
    setAction(type);
    setShowConfirm(true);
    setStatus("");
  }

  return (
    <div className="page">
      <Head>
        <title>Manage Account | Total-iora</title>
        <meta name="robots" content="noindex,nofollow" />
        <meta
          name="description"
          content="Manage your Total-iora account. Remove your data, stop your plan, or delete your account."
        />
      </Head>

      <nav className="topnav">
        <Link href="/" className="backLink">&larr; Back to Home</Link>
      </nav>

      <main className="main">
        <section className="card">
          <h1>Manage Your Account</h1>
          <p className="sub">
            Control your data, subscription, and account from here.
            All actions are <strong>automatic</strong> &mdash; no email required.
          </p>

          {!user ? (
            <div className="warn">
              You are not logged in. Please <Link href="/login" className="link">log in</Link> to manage your account.
            </div>
          ) : (
            <>
              <div className="info">
                <div className="label">Signed in as</div>
                <div className="value">{user.email || user.uid}</div>
              </div>

              {/* Action buttons */}
              <div className="actionGroup">
                <button
                  className="actionBtn removeData"
                  onClick={() => handleAction("remove-data")}
                  disabled={busy}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 4H8l-7 8 7 8h13a2 2 0 002-2V6a2 2 0 00-2-2z"/>
                    <line x1="18" y1="9" x2="12" y2="15"/>
                    <line x1="12" y1="9" x2="18" y2="15"/>
                  </svg>
                  Remove My Data
                </button>

                <button
                  className="actionBtn stopAccount"
                  onClick={() => handleAction("stop-account")}
                  disabled={busy}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/>
                  </svg>
                  Disconnect / Stop Account
                </button>
              </div>

              {/* Confirmation panel with red warning */}
              {showConfirm && (
                <div className="confirmPanel">
                  <div className="warningBox">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div className="warningText">
                      {action === "remove-data" ? (
                        <p>
                          <strong>Warning:</strong> This will permanently remove all your personal data,
                          notes, and account information from our systems. Your account will be deleted
                          and you will lose access immediately. This action cannot be undone.
                        </p>
                      ) : (
                        <p>
                          <strong>Warning:</strong> Stopping your account will permanently delete your
                          user data, notes, and all account access. Your PayPal subscription (if active)
                          should be cancelled separately from your PayPal account. This action cannot be undone.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="confirmBtns">
                    <button
                      className="danger"
                      onClick={doDelete}
                      disabled={busy}
                    >
                      {busy
                        ? "Processing..."
                        : action === "remove-data"
                        ? "CONFIRM: DELETE ALL MY DATA"
                        : "CONFIRM: STOP & DELETE MY ACCOUNT"}
                    </button>
                    <button
                      className="cancel"
                      onClick={() => {
                        setShowConfirm(false);
                        setAction(null);
                      }}
                      disabled={busy}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </>
          )}

          {status && (
            <div className={`status ${status.startsWith("Error") ? "statusError" : "statusOk"}`}>
              {status}
            </div>
          )}

          {/* Payment info */}
          <div className="shadowBox">
            <p className="shadowTitle">Payment Information</p>
            <p className="shadowText">
              If you have an active PayPal subscription, you can manage or cancel it
              directly from your PayPal account settings. No contact is required.
            </p>
          </div>

          <hr className="hr" />

          <div className="linksRow">
            <Link href="/privacy" className="link">Privacy</Link>
            <span>&middot;</span>
            <Link href="/terms" className="link">Terms</Link>
            <span>&middot;</span>
            <Link href="/legal" className="link">Legal</Link>
          </div>

          <p className="copyright">
            &copy; {new Date().getFullYear()} Leffler International Investments
          </p>
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
          max-width: 700px;
          margin: 0 auto;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 22px;
          padding: 34px;
          box-shadow: 0 14px 40px rgba(2, 6, 23, 0.06);
        }
        h1 {
          font-size: 1.8rem;
          margin: 0 0 10px;
          font-weight: 900;
        }
        .sub {
          color: #475569;
          line-height: 1.7;
          margin-bottom: 18px;
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
          word-break: break-word;
        }

        /* Action buttons */
        .actionGroup {
          display: grid;
          gap: 12px;
          margin-bottom: 16px;
        }
        .actionBtn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 14px 18px;
          border-radius: 14px;
          border: 2px solid;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .actionBtn:hover:not(:disabled) {
          transform: translateY(-1px);
        }
        .actionBtn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .removeData {
          background: #fff7ed;
          border-color: #f97316;
          color: #c2410c;
        }
        .stopAccount {
          background: #fef2f2;
          border-color: #ef4444;
          color: #dc2626;
        }

        /* Confirmation */
        .confirmPanel {
          margin: 16px 0;
          animation: slideDown 0.3s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .warningBox {
          display: flex;
          gap: 14px;
          padding: 18px;
          background: #fef2f2;
          border: 2px solid #fca5a5;
          border-radius: 14px;
          margin-bottom: 14px;
          align-items: flex-start;
        }
        .warningText p {
          margin: 0;
          color: #991b1b;
          font-size: 0.92rem;
          line-height: 1.6;
          font-weight: 600;
        }
        .confirmBtns {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }
        .danger {
          flex: 1;
          min-width: 200px;
          padding: 14px 18px;
          border-radius: 14px;
          border: none;
          background: #dc2626;
          color: white;
          font-weight: 900;
          font-size: 0.95rem;
          cursor: pointer;
          transition: background 0.2s;
        }
        .danger:hover:not(:disabled) {
          background: #b91c1c;
        }
        .danger:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .cancel {
          padding: 14px 24px;
          border-radius: 14px;
          border: 1px solid #e2e8f0;
          background: #fff;
          color: #334155;
          font-weight: 700;
          cursor: pointer;
        }
        .cancel:hover {
          background: #f8fafc;
        }

        .status {
          margin-top: 16px;
          padding: 14px 16px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 0.92rem;
        }
        .statusOk {
          background: #f0fdf4;
          border: 1px solid #86efac;
          color: #166534;
        }
        .statusError {
          background: #fef2f2;
          border: 1px solid #fca5a5;
          color: #991b1b;
        }

        .shadowBox {
          margin-top: 24px;
          padding: 16px 18px;
          border-radius: 16px;
          background: #f8fafc;
          border: 1px dashed #cbd5f5;
        }
        .shadowTitle {
          font-weight: 900;
          color: #334155;
          margin: 0 0 6px;
        }
        .shadowText {
          font-size: 0.9rem;
          color: #64748b;
          margin: 0;
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
          flex-wrap: wrap;
        }
        .link {
          color: #7c3aed;
          font-weight: 800;
          text-decoration: underline;
        }
        .copyright {
          text-align: center;
          color: #94a3b8;
          font-size: 0.8rem;
          margin-top: 14px;
        }

        @media (max-width: 480px) {
          .card {
            padding: 24px 18px;
          }
          h1 {
            font-size: 1.4rem;
          }
        }
      `}</style>
    </div>
  );
}
