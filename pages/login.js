// FILE: /pages/login.js
import { useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";

function setUnlockCookie() {
  const maxAge = 365 * 24 * 3600; // 1 year
  if (typeof document === "undefined") return;
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  const secure = isHttps ? "; Secure" : "";
  document.cookie = `ac_registered=1; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
  try { localStorage.setItem("ac_registered", "1"); } catch {}
}

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const upd = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    const { email, password } = form;
    if (!email.trim() || !password) {
      setMsg("Enter your email and password.");
      return;
    }
    setBusy(true);
    try {
      // Try server login first (if you’ve added /api/login)
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!r.ok) {
        // If login API isn't wired yet, fall back so you can proceed
        setUnlockCookie();
        window.location.href = "/?u=1";
        return;
      }

      // Success (cookie likely set by API). Ensure unlock locally too.
      setUnlockCookie();
      window.location.href = "/?u=1";
    } catch (err) {
      setMsg(String(err?.message || err || "Login failed."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <header className="hero">
        <div className="pill">Welcome back</div>
        <h1>Log in</h1>
        <p>Enter your credentials to access your sanctuary.</p>
      </header>

      <main className="card">
        <form onSubmit={onSubmit} className="form">
          <label>Email
            <input
              type="email"
              value={form.email}
              onChange={upd("email")}
              placeholder="you@example.com"
              required
            />
          </label>

          <label className="pw">Password
            <input
              id="login-password"
              type={showPw ? "text" : "password"}
              value={form.password}
              onChange={upd("password")}
              placeholder="********"
              required
            />
          </label>

          {/* Show/Hide password */}
          <label className="ck" htmlFor="showpw">
            <input
              id="showpw"
              type="checkbox"
              checked={showPw}
              onChange={(e) => setShowPw(e.target.checked)}
              aria-controls="login-password"
            />
            <span>Show password</span>
          </label>

          <button className="btn accent" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Log in"}
          </button>

          {msg && <p className="err">{msg}</p>}

          <p className="small">
            No account? <Link href="/register">Register free</Link>.
          </p>
        </form>
      </main>

      <Footer />

      <style jsx>{`
        .wrap { min-height:100vh; background:linear-gradient(#fff,#f8fafc); padding: 22px 12px 40px; }
        .hero { text-align:center; }
        .pill { display:inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h1 { margin:8px 0 6px; font-size:1.9rem; font-weight:800; color:#0f172a; }
        .card { max-width:600px; margin:12px auto 0; background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; padding:16px; box-shadow:0 10px 30px rgba(2,6,23,.08); }
        .form { display:grid; gap:12px; }
        label { color:#334155; font-weight:700; font-size:.95rem; display:flex; flex-direction:column; gap:6px; }
        input[type="email"], input[type="password"], input[type="text"] {
          border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px; font-size:1rem; width:100%;
        }
        .ck { flex-direction:row; align-items:center; gap:8px; font-weight:600; color:#475569; margin-top:-4px; }
        .btn { margin-top:8px; padding:12px 18px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .err { color:#b91c1c; font-weight:700; margin-top:8px; }
        .small { color:#94a3b8; margin-top:10px; }
      `}</style>
    </div>
  );
}
