// FILE: /pages/register.js
// Flow: Register → Stripe Payment → set isPaid → redirect to /homepage

import { useState } from "react";
import Link from "next/link";

const STRIPE_PAYMENT_LINK = "https://buy.stripe.com/fZufZh9oObuo2YPbFO4F20f";

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
  const validEmail = (s) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s || ""));

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");

    const { username, email, phone, password } = form;
    if (!username.trim() || !validEmail(email) || !phone.trim() || password.length < 8) {
      setMsg("Please complete all fields (password min 8 characters).");
      return;
    }

    setBusy(true);
    try {
      // 1. Create User Record (isPaid: false)
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Send 'name' so the backend stores it correctly
        body: JSON.stringify({
          name: username,
          username,
          email,
          phone,
          password,
        }),
      });

      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok) {
        setMsg(data?.error || "Registration failed.");
        setBusy(false);
        return;
      }

      // 2. Redirect to Stripe for Payment
      window.location.href = STRIPE_PAYMENT_LINK;
    } catch (err) {
      console.error(err);
      setMsg("Registration error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <header className="hero">
        <h1>Create your private sanctuary</h1>
        <p>Register to enter. Only you can access your notes and questions.</p>
      </header>

      <main className="card">
        <form onSubmit={onSubmit} className="form">
          <label>
            Username
            <input
              value={form.username}
              onChange={upd("username")}
              placeholder="Your username"
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
              required
            />
          </label>

          <label>
            Mobile
            <input
              inputMode="tel"
              value={form.phone}
              onChange={upd("phone")}
              placeholder="+1 XXX XXX XXXX"
              required
            />
          </label>

          <label>
            Password (min 8)
            <input
              id="reg-password"
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={upd("password")}
              placeholder="********"
              minLength={8}
              required
            />
          </label>

          <label className="ck">
            <input
              type="checkbox"
              checked={showPw}
              onChange={(e) => setShowPw(e.target.checked)}
            />
            Show password
          </label>

          <button className="btn accent" type="submit" disabled={busy}>
            {busy ? "Processing…" : "Register & Continue to Payment ⟶"}
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
        h1 {
          margin: 8px 0 6px;
          font-size: 1.9rem;
          font-weight: 800;
          color: #0f172a;
        }
        .card {
          max-width: 800px;
          margin: 12px auto 0;
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 20px;
          padding: 16px;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
        }
        .form {
          display: grid;
          gap: 12px;
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
          padding: 10px 12px;
          font-size: 1rem;
          width: 100%;
        }
        .ck {
          flex-direction: row;
          align-items: center;
          gap: 8px;
          font-weight: 600;
          color: #475569;
        }
        .btn {
          margin-top: 8px;
          padding: 12px 18px;
          border-radius: 14px;
          font-weight: 800;
          border: none;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          color: #fff;
          cursor: pointer;
          font-size: 1rem;
        }
        .btn:disabled {
          opacity: 0.7;
        }
        .err {
          color: #b91c1c;
          font-weight: 700;
          text-align: center;
        }
        .small {
          color: #94a3b8;
          margin-top: 10px;
          text-align: center;
        }
        .small a {
          color: #7c3aed;
          text-decoration: none;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
}
