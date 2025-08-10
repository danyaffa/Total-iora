// FILE: /pages/login.js
import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setMsg("");
    setBusy(true);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok || !data?.ok) {
        setMsg(data?.error || "Invalid credentials");
      } else {
        window.location.href = "/";
      }
    } catch {
      setMsg("Network error. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <main className="card">
        <h1>Log in</h1>
        <form onSubmit={onSubmit} className="form">
          <label>Email
            <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
          </label>

          <label>Password
            <input
              type={show ? "text" : "password"}
              value={password}
              onChange={(e)=>setPassword(e.target.value)}
              required
              minLength={8}
            />
          </label>

          <label className="row">
            <input type="checkbox" checked={show} onChange={(e)=>setShow(e.target.checked)} />
            <span>Show password</span>
          </label>

          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Log in"}
          </button>

          {msg && <p className="err">{msg}</p>}

          <p className="note">
            No account? <Link href="/register">Register free</Link>.
          </p>
        </form>
      </main>

      <style jsx>{`
        .wrap { min-height:100vh; display:grid; place-items:center; background:linear-gradient(#fff,#f8fafc); padding:24px 12px; }
        .card { width:100%; max-width:560px; background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; padding:20px; box-shadow:0 10px 30px rgba(2,6,23,.08); }
        h1 { margin:0 0 10px; font-size:2rem; }
        .form { display:grid; gap:12px; }
        label { display:flex; flex-direction:column; gap:6px; font-weight:700; color:#334155; }
        .row { flex-direction:row; align-items:center; gap:8px; font-weight:600; }
        input { border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px; font-size:1rem; }
        .btn { margin-top:6px; padding:12px 18px; border-radius:14px; font-weight:800; color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .err { color:#b91c1c; font-weight:700; }
        .note { color:#64748b; }
      `}</style>
    </div>
  );
}
