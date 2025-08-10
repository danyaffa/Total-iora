// FILE: /pages/login.js
import { useState } from "react";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [msg, setMsg] = useState("");

  async function onSubmit(e){
    e.preventDefault();
    setMsg("");
    const r = await fetch("/api/login", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ email, password: pw }),
    });
    const j = await r.json().catch(()=>({}));
    if (r.ok && j?.ok){
      window.location.replace("/");
    } else {
      setMsg(j?.error || "Invalid credentials");
    }
  }

  return (
    <div className="wrap">
      <h1>Log in</h1>
      <form onSubmit={onSubmit} className="form">
        <label>Email
          <input type="email" value={email} onChange={(e)=>setEmail(e.target.value)} required />
        </label>
        <label>Password
          <input type={show ? "text":"password"} value={pw} onChange={(e)=>setPw(e.target.value)} required />
        </label>
        <label className="row">
          <input type="checkbox" checked={show} onChange={(e)=>setShow(e.target.checked)} /> Show password
        </label>
        <button className="btn accent" type="submit">Log in</button>
        {msg && <p className="err">{msg}</p>}
        <p className="small">No account? <Link href="/register">Register free</Link>.</p>
      </form>
      <style jsx>{`
        .wrap { max-width:720px; margin:32px auto; padding:0 16px; }
        h1 { font-size:2.2rem; font-weight:800; color:#0f172a; }
        .form { display:grid; gap:12px; margin-top:12px; }
        label { font-weight:700; color:#334155; display:flex; flex-direction:column; gap:6px; }
        input[type="email"], input[type="password"], input[type="text"]{ border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px; }
        .row { flex-direction:row; align-items:center; gap:8px; font-weight:600; color:#475569; }
        .btn { padding:12px 18px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .err { color:#b91c1c; font-weight:700; }
        .small{ color:#94a3b8; }
      `}</style>
    </div>
  );
}
