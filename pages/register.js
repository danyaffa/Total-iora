// FILE: /pages/register.js
import { useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    marketing: false,   // optional: email/SMS updates
    usage: false,       // optional: allow storing questions to improve service
    agree: false,       // required: Terms & Privacy
  });
  const [status, setStatus] = useState({ kind: "", msg: "" });
  const [busy, setBusy] = useState(false);

  const upd = (k) => (e) =>
    setForm((f) => ({
      ...f,
      [k]: e?.target?.type === "checkbox" ? e.target.checked : e.target.value,
    }));

  async function onSubmit(e) {
    e.preventDefault();
    setStatus({ kind: "", msg: "" });

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
      return setStatus({ kind: "err", msg: "Please fill name, email and mobile." });
    }
    if (!form.agree) {
      return setStatus({ kind: "err", msg: "You must agree to the Terms and Privacy." });
    }
    setBusy(true);
    try {
      const r = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        throw new Error(data?.error || "Could not register right now.");
      }
      setStatus({ kind: "ok", msg: data?.message || "Registered. Welcome!" });
      // clear only non-consent fields so toggles persist
      setForm((f) => ({ ...f, name: "", email: "", phone: "" }));
    } catch (err) {
      setStatus({ kind: "err", msg: String(err.message || err) });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="wrap">
      <header className="hero">
        <div className="pill">Free Access</div>
        <h1>Register to open the door</h1>
        <p>It’s free today. Add your details to start.</p>
      </header>

      <main className="card">
        <form onSubmit={onSubmit} className="form">
          <label> Full name
            <input value={form.name} onChange={upd("name")} placeholder="Your name" />
          </label>
          <label> Email
            <input type="email" value={form.email} onChange={upd("email")} placeholder="you@example.com" />
          </label>
          <label> Mobile
            <input inputMode="tel" value={form.phone} onChange={upd("phone")} placeholder="+61 4XX XXX XXX" />
          </label>

          <div className="checks">
            <label className="ck">
              <input type="checkbox" checked={form.marketing} onChange={upd("marketing")} />
              <span>Send me occasional updates and news.</span>
            </label>
            <label className="ck">
              <input type="checkbox" checked={form.usage} onChange={upd("usage")} />
              <span>I’m OK with my questions being stored to improve the service.</span>
            </label>
            <label className="ck req">
              <input type="checkbox" checked={form.agree} onChange={upd("agree")} />
              <span>I agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>. Free now; fees may be introduced later.</span>
            </label>
          </div>

          <button className="btn accent" type="submit" disabled={busy}>
            {busy ? "Registering…" : "Register — Free Access"}
          </button>

          {status.msg ? (
            <p className={status.kind === "ok" ? "ok" : "err"}>{status.msg}</p>
          ) : null}
        </form>

        <p className="small">
          We don’t sell personal info. You can request deletion any time via the Privacy page.
        </p>
      </main>

      <Footer />

      <style jsx>{`
        .wrap { min-height:100vh; background:linear-gradient(#fff,#f8fafc); padding: 22px 12px 40px; }
        .hero { text-align:center; }
        .pill { display:inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h1 { margin:8px 0 6px; font-size:1.9rem; font-weight:800; color:#0f172a; }
        .card { max-width:800px; margin:12px auto 0; background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; padding:16px; box-shadow:0 10px 30px rgba(2,6,23,.08); }
        .form { display:grid; gap:12px; }
        label { color:#334155; font-weight:700; font-size:.95rem; display:flex; flex-direction:column; gap:6px; }
        input { border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px; font-size:1rem; }
        .checks { display:grid; gap:8px; margin-top:6px; }
        .ck { display:flex; gap:8px; align-items:flex-start; font-weight:600; color:#475569; }
        .ck input { margin-top:2px; }
        .ck.req span { color:#0f172a; }
        .btn { margin-top:8px; padding:12px 18px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .ok { color:#15803d; font-weight:700; margin-top:8px; }
        .err { color:#b91c1c; font-weight:700; margin-top:8px; }
        .small { color:#94a3b8; text-align:center; margin-top:10px; font-size:.9rem; }
      `}</style>
    </div>
  );
}
