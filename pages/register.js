// FILE: /pages/register.js
// On success: set cookies and go to /homepage

import { useState } from "react";
import Head from "next/head";
import Link from "next/link";

function setCookie(name, value, maxAgeDays = 365) {
  const maxAge = maxAgeDays * 24 * 3600;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export default function Register() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    phone: "",
    password: "",
  });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const validEmail = (s) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ""));

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    const { username, email, phone, password } = form;
    if (
      !username.trim() ||
      !validEmail(email) ||
      !String(phone).trim() ||
      String(password).length < 8
    ) {
      setMsg(
        "Please enter username, valid email, mobile, and an 8+ character password."
      );
      return;
    }

    setBusy(true);
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username,
          name: username,
          email,
          phone,
          password,
        }),
        credentials: "include",
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok) {
        setMsg(data?.error || "Registration failed.");
      } else {
        setCookie("ac_registered", "1", 365);
        setCookie("ac_session", "1", 7);
        window.location.replace("/homepage");
      }
    } catch {
      setMsg("Could not register. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <Head>
        <title>Register — Total-iora</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
      </Head>

      <header className="hero">
        <img src="/TotalIora_Logo.png" alt="Total-iora" className="logo" />
        <div className="badge">14-Day Free Trial</div>
        <h1>Create your private sanctuary</h1>
        <p>Register to start your 14-day free trial. Full access to all features. Then $5/month via PayPal.</p>
      </header>

      <main className="card">
        <form onSubmit={onSubmit} className="form">
          <label>
            Username
            <input
              value={form.username}
              onChange={upd("username")}
              placeholder="Your username"
              autoComplete="username"
              required
            />
          </label>
          <label>
            Email
            <input
              type="email"
              value={form.email}
              onChange={upd("email")}
              placeholder="you@example.com"
              autoComplete="email"
              required
            />
          </label>
          <label>
            Mobile
            <input
              inputMode="tel"
              value={form.phone}
              onChange={upd("phone")}
              placeholder="+61 4XX XXX XXX"
              autoComplete="tel"
              required
            />
          </label>
          <label>
            Password (min 8)
            <div className="pw-wrap">
              <input
                id="reg-password"
                type={showPw ? "text" : "password"}
                value={form.password}
                onChange={upd("password")}
                placeholder="Create a strong password"
                minLength={8}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="pw-toggle"
                onClick={() => setShowPw((v) => !v)}
                aria-label={showPw ? "Hide password" : "Show password"}
              >
                {showPw ? (
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

          <button className="btn accent" type="submit" disabled={busy}>
            {busy ? "Creating..." : "Start 14-Day Free Trial"}
          </button>
          {msg && <p className="err">{msg}</p>}
          <p className="small">
            Already registered? <Link href="/login">Log in</Link>.
          </p>
        </form>
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          background: linear-gradient(#fff, #f8fafc);
          padding: 22px 12px 40px;
        }
        .hero {
          text-align: center;
        }
        .logo {
          width: 72px;
          height: 72px;
          border-radius: 14px;
          margin-bottom: 12px;
        }
        .badge {
          display: inline-block;
          padding: 6px 14px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #fff;
          color: #334155;
          font-weight: 700;
          font-size: 0.9rem;
        }
        h1 {
          margin: 10px 0 6px;
          font-size: 1.7rem;
          font-weight: 800;
          color: #0f172a;
        }
        .hero p {
          color: #475569;
          margin: 0;
        }
        .card {
          max-width: 520px;
          margin: 16px auto 0;
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 20px;
          padding: 20px;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
        }
        .form {
          display: grid;
          gap: 14px;
        }
        label {
          color: #334155;
          font-weight: 700;
          font-size: 0.95rem;
          display: flex;
          flex-direction: column;
          gap: 6px;
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
          margin-top: 8px;
          padding: 14px 18px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1rem;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .btn.accent {
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          border: none;
        }
        .btn.accent:hover {
          transform: translateY(-1px);
          box-shadow: 0 8px 20px rgba(124, 58, 237, 0.3);
        }
        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
        .err {
          color: #b91c1c;
          font-weight: 700;
          margin-top: 4px;
          text-align: center;
        }
        .small {
          color: #94a3b8;
          margin-top: 4px;
          text-align: center;
        }

        @media (max-width: 480px) {
          h1 {
            font-size: 1.4rem;
          }
          .card {
            padding: 16px;
          }
        }
      `}</style>
    </div>
  );
}
