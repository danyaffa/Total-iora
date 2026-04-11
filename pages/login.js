// FILE: /pages/login.js
// Login page with promo code for family access
// On success: set cookies and go to /homepage (full access dashboard)

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

function setCookie(name, value, maxAgeDays = 7) {
  const maxAge = maxAgeDays * 24 * 3600;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

const PROMO_CODE = process.env.NEXT_PUBLIC_PROMO_CODE || "";

// Map machine error codes from /api/login (and the withApi wrapper) to
// user-friendly messages. Unknown codes fall back to a generic message.
const ERROR_MESSAGES = {
  missing_credentials: "Please enter your email and password.",
  invalid_email: "Please enter a valid email address.",
  invalid_password: "That password is not valid.",
  invalid_credentials: "Invalid email or password.",
  rate_limited: "Too many attempts. Please wait a minute and try again.",
  service_unavailable:
    "Login is temporarily unavailable. Please try again shortly.",
  method_not_allowed: "Unexpected error. Please refresh and try again.",
  server_error: "Something went wrong on our end. Please try again.",
};

function friendlyError(code) {
  if (!code) return "Invalid email or password.";
  return ERROR_MESSAGES[code] || "Invalid email or password.";
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [debugInfo, setDebugInfo] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setDebugInfo("");

    const trimmedPromo = promoCode.trim();
    const trimmedEmail = email.trim();

    // Promo-code shortcut: if the user typed any promo code, we must resolve
    // it first. A correct code logs them straight in. A wrong code is a hard
    // error (previously it was silently ignored when an email was present,
    // which confused users who thought the promo had been applied).
    if (trimmedPromo) {
      if (PROMO_CODE && trimmedPromo === PROMO_CODE) {
        setBusy(true);
        // ac_session is set HttpOnly by the server for normal email logins,
        // but the promo path has no API round-trip, so we must set it here.
        setCookie("ac_session", "1", 365);
        setCookie("ac_registered", "1", 365);
        setCookie("ac_promo", "1", 365);
        try {
          localStorage.setItem("ac_promo_start", String(Date.now()));
        } catch {
          /* storage may be unavailable (private mode) — ignore */
        }
        window.location.replace("/homepage");
        return;
      }
      setMsg("That promo code is not valid.");
      return;
    }

    // Normal email+password path — validate before hitting the API so we
    // don't waste a rate-limited request on obviously empty submissions.
    if (!trimmedEmail || !password) {
      setMsg("Please enter your email and password.");
      return;
    }

    setBusy(true);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trimmedEmail, password }),
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));

      if (!r.ok || !data?.ok) {
        setMsg(friendlyError(data?.error));
        if (data?.debug_hint) {
          setDebugInfo(`Debug: ${data.debug_hint}`);
        }
      } else {
        // Note: the API already set HttpOnly `ac_session` and `ac_email`
        // cookies via Set-Cookie — do NOT overwrite them from JS here,
        // or we end up with two cookies of the same name and unreliable
        // server-side session detection.
        setCookie("ac_registered", "1", 365);
        try {
          if (data.email) localStorage.setItem("ac_email", data.email);
          if (data.trialEnd) localStorage.setItem("ac_trial_end", data.trialEnd);
          localStorage.setItem("ac_is_paid", data.isPaid ? "1" : "0");
        } catch {
          /* storage may be unavailable — not fatal */
        }

        if (data.isPaid || data.trialActive) {
          window.location.replace("/homepage");
        } else {
          window.location.replace("/unlock");
        }
      }
    } catch (err) {
      setMsg("Network error. Please try again.");
      setDebugInfo(`Debug: ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <Head>
        <title>Log in — Total-iora</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <main className="card">
        <img src="/TotalIora_Logo.png" alt="Total-iora" className="logo" />
        <h1>Log in</h1>
        <p className="lead">
          Enter your private space. We keep your notes and questions private.
        </p>

        <form onSubmit={onSubmit} className="form">
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
            />
          </label>

          <label>
            Password
            <div className="pw-wrap">
              <input
                type={show ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
                minLength={8}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShow((v) => !v)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </label>

          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Signing in..." : "Log in"}
          </button>

          {/* Promo code section */}
          <div className="promo-section">
            <button
              type="button"
              className="promo-toggle"
              onClick={() => setShowPromo((v) => !v)}
            >
              {showPromo ? "Hide promo code" : "Have a promo code?"}
            </button>

            {showPromo && (
              <div className="promo-field">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Enter promo code"
                  className="promo-input"
                  autoComplete="off"
                />
                {promoCode.trim() && (
                  <button
                    type="submit"
                    className="promo-apply"
                    disabled={busy}
                  >
                    {busy ? "..." : "Apply"}
                  </button>
                )}
              </div>
            )}
          </div>

          {msg && <p className="err">{msg}</p>}
          {debugInfo && <p className="debug">{debugInfo}</p>}
          <p className="note">
            No account?{" "}
            <Link href="/register">Register free</Link>.
          </p>
        </form>
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          display: grid;
          place-items: center;
          background: linear-gradient(#fff, #f8fafc);
          padding: 24px 12px;
        }
        .card {
          width: 100%;
          max-width: 480px;
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 20px;
          padding: 24px 20px;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
          text-align: center;
        }
        .logo {
          width: 72px;
          height: 72px;
          border-radius: 14px;
          margin-bottom: 12px;
        }
        h1 {
          margin: 0 0 6px;
          font-size: 1.8rem;
          font-weight: 800;
          color: #0f172a;
        }
        .lead {
          color: #475569;
          margin: 0 0 16px;
          font-size: 0.95rem;
        }
        .form {
          display: grid;
          gap: 14px;
          text-align: left;
        }
        label {
          display: flex;
          flex-direction: column;
          gap: 6px;
          font-weight: 700;
          color: #334155;
          font-size: 0.95rem;
        }
        input {
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          font-size: 1rem;
          width: 100%;
          outline: none;
          transition: border-color 0.2s;
        }
        input:focus {
          border-color: #7c3aed;
          box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1);
        }
        .pw-wrap {
          position: relative;
          display: flex;
          align-items: center;
        }
        .pw-wrap input {
          padding-right: 44px;
        }
        .pw-toggle {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
        }
        .pw-toggle:hover {
          color: #334155;
        }
        .btn {
          margin-top: 4px;
          padding: 14px 18px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1rem;
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          border: none;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .promo-section {
          text-align: center;
        }
        .promo-toggle {
          background: none;
          border: none;
          color: #7c3aed;
          font-weight: 600;
          font-size: 0.9rem;
          cursor: pointer;
          text-decoration: underline;
          padding: 4px;
        }
        .promo-toggle:hover {
          color: #5b21b6;
        }
        .promo-field {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .promo-input {
          flex: 1;
        }
        .promo-apply {
          padding: 10px 18px;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #0ea5e9, #22c55e);
          cursor: pointer;
          white-space: nowrap;
          font-size: 0.95rem;
        }
        .promo-apply:disabled {
          opacity: 0.7;
        }
        .err {
          color: #b91c1c;
          font-weight: 700;
          text-align: center;
        }
        .debug {
          color: #9333ea;
          font-size: 0.8rem;
          text-align: center;
          background: #faf5ff;
          padding: 8px 12px;
          border-radius: 8px;
          border: 1px solid #e9d5ff;
          word-break: break-all;
        }
        .note {
          color: #64748b;
          text-align: center;
          font-size: 0.9rem;
        }
        @media (max-width: 480px) {
          .card {
            padding: 20px 16px;
          }
          h1 {
            font-size: 1.5rem;
          }
        }
      `}</style>
    </div>
  );
}
