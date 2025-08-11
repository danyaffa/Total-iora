// FILE: /pages/index.js  (STATIC PREVIEW — public, non-interactive)
import Link from "next/link";

export default function IndexPreview() {
  return (
    <div className="page">
      <nav className="topnav">
        <Link href="/register" className="btn cta">Register — Free Access</Link>
        <span className="gap" />
        <Link href="/login" className="btn">Log in</Link>
      </nav>

      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="TotalIora Logo" className="logo" />
        <p className="note">
          Welcome to <strong>Total-Iora Voice</strong>. This is a preview only. After you register
          (free) you’ll use the full board on the <strong>Home</strong> page.
        </p>
      </section>

      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pill">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>Your quiet place. Nothing is stored or kept. (Preview only here.)</p>
            </header>
            <footer className="f">
              <Link href="/register" className="btn accent">Register to use</Link>
              <div className="disc">Registering protects your privacy so only you can access your space.</div>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pill">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>Ask questions by typing or voice and get grounded answers. (Preview only here.)</p>
            </header>
            <footer className="f">
              <Link href="/register" className="btn accent">Register to use</Link>
              <div className="disc">Spiritual guidance only. No medical, legal, or financial advice.</div>
            </footer>
          </article>
        </div>
      </section>

      <section className="previewShot">
        <img src="/preview-board.png" alt="Preview of the Oracle board" />
        <div className="caption">This is what you’ll see after sign-in (interactive on the Home page).</div>
      </section>

      <footer className="foot">
        © {new Date().getFullYear()} Total-iora · A sanctuary of reflection.
      </footer>

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#ffffff,#f8fafc); }
        .topnav { display:flex; justify-content:center; gap:8px; padding:14px; flex-wrap:wrap; }
        .btn { display:inline-block; padding:10px 16px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.cta { color:#fff; border:none; background:linear-gradient(135deg,#7c3aed,#14b8a6); }
        .hero { text-align:center; padding-top:8px; }
        .logo { width:148px; height:auto; margin:0 auto; display:block; }
        .note { max-width:820px; margin:10px auto 0; color:#475569; padding:0 12px; }
        .tiles { max-width:1100px; margin:10px auto 6px; padding:0 16px; }
        .grid { display:grid; gap:14px; grid-template-columns:1fr; }
        @media (min-width:900px){ .grid { grid-template-columns:1fr 1fr; } }
        .card { background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; box-shadow:0 10px 30px rgba(2,6,23,.08); padding:18px; }
        .pill { display:inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h3 { margin:8px 0 4px; font-size:1.25rem; font-weight:800; color:#0f172a; }
        p { color:#475569; }
        .f { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .disc { color:#64748b; font-size:.92rem; }
        .previewShot { max-width:1100px; margin:16px auto; padding:0 16px; text-align:center; }
        .previewShot img { width:100%; max-width:980px; border-radius:16px; border:1px solid #e2e8f0; box-shadow:0 10px 30px rgba(2,6,23,.08); }
        .caption { color:#64748b; font-size:.92rem; margin-top:6px; }
        .foot { text-align:center; color:#64748b; margin:18px 0 22px; font-size:.95rem; }
      `}</style>
    </div>
  );
}
