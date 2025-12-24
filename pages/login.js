// FILE: /pages/login.js
// Option A: Keep UI responsive for Play review by showing a clear message.
// (No network calls, no broken button.)

import { useState } from "react";
import Link from "next/link";

function setCookie(name, value, maxAgeDays = 7) {
  const maxAge = maxAgeDays * 24 * 3600;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(
    value
  )}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    // ✅ Option A: During Play review, avoid any non-functional auth calls.
    // Provide a clear, responsive message instead of calling the server.
    setBusy(false);
    setMsg(
      "Login will be enabled after registration is approved and the app is live on Google Play."
    );
  }

  return (
    <div className="wrap">
      <div className="card">
        <div className="top">
          <h1>Log in</h1>
          <p className="lead">
            Enter your details. If login is not enabled yet, you’ll see an
            explanation.
          </p>
        </div>

        {msg ? <div className="err" role="alert">{msg}</div> : null}

        <form className="form" onSubmit={onSubmit}>
          <label>
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              type="email"
              autoComplete="email"
              required
            />
          </label>

          <label>
            Password
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              type={show ? "text" : "password"}
              autoComplete="current-password"
              required
            />
          </label>

          <label className="row">
            <input
              type="checkbox"
              checked={show}
              onChange={(e) => setShow(e.target.checked)}
            />
            Show password
          </label>

          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Please wait..." : "Log in"}
          </button>

          <p className="note">
            Don’t have an account? <Link href="/register">Register</Link>
          </p>

          <p className="note">
            By continuing you agree to our <Link href="/privacy">Privacy Policy</Link>.
          </p>
        </form>
      </div>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          padding: 24px;
          background: #f6f7fb;
        }
        .card {
          width: 100%;
          max-width: 560px;
          background: #fff;
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
        }
        h1 {
          margin: 0 0 6px;
          font-size: 2rem;
        }
        .lead {
          color: #475569;
          margin: 0 0 10px;
        }
        .form {
          display: grid;
          gap: 12px;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-weight: 700;
          color: #334155;
        }
        .row {
          flex-direction: row;
          align-items: center;
          gap: 8px;
          font-weight: 600;
        }
        input {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 10px 12px;
          font-size: 1rem;
        }
        .btn {
          margin-top: 6px;
          padding: 12px 18px;
          border-radius: 14px;
          font-weight: 800;
          color: #fff;
          cursor: pointer;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          border: none;
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .err {
          color: #b91c1c;
          font-weight: 700;
          margin-bottom: 10px;
        }
        .note {
          color: #64748b;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
