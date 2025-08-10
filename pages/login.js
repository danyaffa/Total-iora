// FILE: /pages/login.js
import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: pw }),
      });
      const j = await r.json();
      if (!r.ok || !j?.ok) throw new Error(j?.error || "Login failed");
      window.location.href = "/";
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="wrap">
      <h1>Log in</h1>
      <form onSubmit={onSubmit} className="form">
        <label>Email
          <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type={show ? "text" : "password"} value={pw} onChange={e=>setPw(e.target.value)} required />
        </label>
        <label className="row">
          <input type="checkbox" checked={show} onChange={e=>setShow(e.target.checked)} />
          <span>Show password</span>
        </label>
        <button className="btn" disabled={busy}>{busy?"Signing in…":"Log in"}</button>
        {err && <p className="err">{err}</p>}
        <p className="small">No account? <Link href="/register">Register free</Link>.</p>
      </form>

      <style jsx>{`
        .wrap { max-width:520px; margin:40px auto; padding:16px; }
        .form { display:grid; gap:12px; }
        label { font-weight:700; color:#334155; display:flex; flex-direction:column; gap:6px; }
        .row { flex-direction:row; align-items:center; gap:8px; font-weight:600; }
        input { border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px; }
        .btn { padding:12px 18px; border-radius:14px; font-weight:800; color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .err { color:#b91c1c; font-weight:700; }
        .small { color:#94a3b8; }
      `}</style>
    </main>
  );
}
