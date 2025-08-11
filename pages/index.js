// FILE: /pages/index.js
// Static preview with a single photo + clear Register / Log in CTAs. No other interactivity.

import Link from "next/link";

export default function Index() {
  return (
    <div className="page">
      <nav className="topnav">
        <Link href="/register" className="btn cta">Register — Free Access</Link>
        <span className="gap" />
        <Link href="/login" className="btn">Log in</Link>
      </nav>

      <section className="copy">
        <p className="lead">
          Register (free) to protect your privacy — only you can access your notes and questions.
        </p>
      </section>

      {/* PHOTO ONLY — replace with your actual screenshot path */}
      <img
        src="/index-preview.jpg"
        alt="Preview of the Total-Iora board you’ll access after sign-in"
        className="preview"
      />

      <style jsx>{`
        .page { min-height: 100vh; background: #fff; display:flex; flex-direction:column; }
        .topnav { display:flex; justify-content:center; align-items:center; gap:10px; padding:14px; }
        .btn { display:inline-block; padding:10px 16px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.cta { color:#fff; border:none; background:linear-gradient(135deg,#7c3aed,#14b8a6); }
        .copy { text-align:center; padding:6px 12px 0; }
        .lead { color:#475569; font-weight:600; }
        .preview { display:block; width:100%; height:calc(100vh - 100px); object-fit:contain; background:#ffffff; }
        .gap { width:8px; }
      `}</style>
    </div>
  );
}

