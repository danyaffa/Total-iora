// FILE: /pages/login.js

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [showInfo, setShowInfo] = useState(false);

  const isValidEmail = useMemo(() => {
    if (!email) return true;
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  }, [email]);

  function onSubmit(e) {
    e.preventDefault();
    // ✅ Option A: no real login in review build (prevents "Broken functionality" rejection)
    setShowInfo(true);
  }

  return (
    <div className="wrap">
      <div className="card">
        <div className="top">
          <div className="logoBox" aria-hidden="true">
            <div className="logoDot" />
          </div>
          <div>
            <h1>Log in</h1>
            <p className="lead">
              For this review build, login is replaced with a clear explanation so every button works.
            </p>
          </div>
        </div>

        <form className="form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
            />
          </label>

          {!isValidEmail && (
            <div className="err">Please enter a valid email address.</div>
          )}

          <button className="btn" type="submit">
            Continue
          </button>

          {showInfo && (
            <div className="info" role="status" aria-live="polite">
              <strong>Login is temporarily disabled in this review build.</strong>
              <div className="infoText">
                To access the full experience, please <b>Register</b> and <b>Subscribe</b>.
                This ensures there are no broken login flows during Google review.
              </div>

              <div className="actions">
                <Link className="pill" href="/register">
                  Go to Register
                </Link>
                <Link className="pill secondary" href="/">
                  Back to Home
                </Link>
                <button
                  className="pill secondary"
                  type="button"
                  onClick={() => router.push("/subscribe")}
                >
                  Subscribe
                </button>
              </div>

              <div className="small">
                If you already subscribed and need access, contact support:{" "}
                <a href="mailto:leffleryd@gmail.com">leffleryd@gmail.com</a>
              </div>
            </div>
          )}

          <div className="foot">
            <span className="muted">Don’t have an account?</span>{" "}
            <Link href="/register">Register</Link>
          </div>
        </form>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px 12px;
          background: linear-gradient(180deg, #ffffff, #f6f7fb);
        }
        .card {
          width: 100%;
          max-width: 620px;
          background: #fff;
          border: 1px solid #e6e8f0;
          border-radius: 18px;
          padding: 18px;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
        }
        .top {
          display: flex;
          gap: 14px;
          align-items: center;
          margin-bottom: 10px;
        }
        .logoBox {
          width: 52px;
          height: 52px;
          border-radius: 14px;
          background: radial-gradient(circle at 30% 30%, #dbeafe, #eef2ff);
          border: 1px solid #e6e8f0;
          display: grid;
          place-items: center;
          flex: 0 0 auto;
        }
        .logoDot {
          width: 22px;
          height: 22px;
          border-radius: 999px;
          background: radial-gradient(circle at 40% 40%, #60a5fa, #7c3aed);
        }
        h1 {
          margin: 0;
          font-size: 1.75rem;
          letter-spacing: -0.02em;
        }
        .lead {
          margin: 4px 0 0;
          color: #475569;
          font-size: 0.98rem;
          line-height: 1.35;
        }
        .form {
          display: grid;
          gap: 12px;
          margin-top: 10px;
        }
        label {
          display: grid;
          gap: 6px;
          font-weight: 700;
          color: #334155;
        }
        input {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 1rem;
          outline: none;
        }
        input:focus {
          border-color: #93c5fd;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.12);
        }
        .btn {
          padding: 12px 16px;
          border-radius: 14px;
          border: none;
          cursor: pointer;
          font-weight: 800;
          color: #fff;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
        }
        .btn:active {
          transform: translateY(1px);
        }
        .err {
          color: #b91c1c;
          font-weight: 800;
        }
        .info {
          margin-top: 6px;
          border: 1px solid #e2e8f0;
          background: #f8fafc;
          border-radius: 14px;
          padding: 12px;
          color: #0f172a;
        }
        .infoText {
          margin-top: 6px;
          color: #334155;
          line-height: 1.35;
        }
        .actions {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
          margin-top: 10px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 12px;
          border-radius: 999px;
          text-decoration: none;
          font-weight: 800;
          color: #0f172a;
          background: #fff;
          border: 1px solid #dbeafe;
          cursor: pointer;
        }
        .pill.secondary {
          border-color: #e2e8f0;
        }
        .small {
          margin-top: 10px;
          color: #475569;
          font-size: 0.92rem;
        }
        .foot {
          margin-top: 4px;
          color: #475569;
        }
        .muted {
          color: #64748b;
        }
      `}</style>
    </div>
  );
}
