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

// Family promo code from Vercel env vars
const FAMILY_PROMO = process.env.NEXT_PUBLIC_FAMILY_PROMO || "";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [promoCode, setPromoCode] = useState("");
  const [showPromo, setShowPromo] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);

    // Check promo code first — grants full access without credentials
    if (promoCode.trim() && FAMILY_PROMO && promoCode.trim() === FAMILY_PROMO) {
      setCookie("ac_session", "1", 365);
      setCookie("ac_registered", "1", 365);
      setCookie("ac_family", "1", 365);
      window.location.replace("/homepage");
      return;
    }

    // If promo code was entered but doesn't match, and no email/password
    if (promoCode.trim() && promoCode.trim() !== FAMILY_PROMO) {
      if (!email.trim()) {
        setMsg("Invalid promo code. Please enter your email and password to log in.");
        setBusy(false);
        return;
      }
    }

    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok) {
        setMsg(data?.error || "Invalid email or password.");
      } else {
        setCookie("ac_session", "1", 7);
        setCookie("ac_registered", "1", 365);
        window.location.replace("/homepage");
      }
    } catch {
      setMsg("Network error. Please try again.");
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

        /* Password field with eye toggle */
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

        /* Promo code */
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
