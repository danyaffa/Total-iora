// FILE: /pages/index.js
import { useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";

const OracleVoice = dynamic(() => import("../components/OracleVoice"), { ssr: false });

export default function IndexPage() {
  const [path, setPath] = useState("Universal");
  return (
    <main className="page">
      <nav className="topnav">
        <Link href="/register" className="btn cta">Register — Free Access</Link>
        <span className="sep" />
        <Link href="/login" className="btn">Log in</Link>
      </nav>

      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="Total-Iora" className="logo" />
        <p className="intro">
          Welcome to <strong>Total‑Iora Voice</strong>. This is a preview only. After you register (free) you’ll use the full board on the Home page.
        </p>
      </section>

      {/* (your two tiles remain as in homepage) */}
      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pill">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>Your quiet place. Write, cry, pray, whisper. <strong>Nothing is stored or kept.</strong></p>
            </header>
            <footer className="f">
              <Link href="/sacred-space" className="btn accent">Open Sacred Notes</Link>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pill">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>Ask questions by typing or voice and get grounded answers.</p>
            </header>
            <footer className="f">
              <Link href="/oracle-universe-dna" className="btn accent">Get Your Oracle Universe DNA</Link>
            </footer>
          </article>
        </div>
      </section>

      {/* Full Oracle shown as read‑only preview */}
      <section className="previewWrap">
        <HeritageSelector path={path} onChange={setPath} />
        <div className="mask">
          <div className="maskBox">
            <div>This is a static preview. Open the full board to interact.</div>
            <Link href="/homepage?dev=on" className="btn accent">Open the Full Board</Link>
          </div>
        </div>
        <div className="blocked">
          <OracleVoice path={path} />
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#ffffff,#f8fafc); }
        .topnav { display:flex; justify-content:center; gap:10px; padding:14px; flex-wrap:wrap; }
        .sep { width:10px; }
        .btn { display:inline-block; padding:10px 16px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.cta, .btn.accent { color:#fff; border:none; background:linear-gradient(135deg,#7c3aed,#14b8a6); }
        .hero { text-align:center; padding-top:8px; }
        .logo { width:148px; height:auto; margin:0 auto 6px; display:block; }
        .intro { max-width:820px; margin:0 auto; color:#475569; padding:0 12px; }
        .tiles { max-width:1100px; margin:12px auto 8px; padding:0 16px; }
        .grid { display:grid; gap:14px; grid-template-columns:1fr; }
        @media (min-width:900px){ .grid { grid-template-columns:1fr 1fr; } }
        .card { background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; box-shadow:0 10px 30px rgba(2,6,23,.08); padding:18px; }
        .pill { display:inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h3 { margin:8px 0 4px; font-size:1.25rem; font-weight:800; color:#0f172a; }
        p { color:#475569; }
        .f { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
        .previewWrap { position:relative; max-width:1100px; margin:12px auto 20px; padding:0 16px; }
        .blocked :global(.oracle) { pointer-events:none; user-select:none; }
        .mask { position:absolute; inset:0; display:flex; align-items:center; justify-content:center; pointer-events:none; }
        .maskBox { pointer-events:auto; backdrop-filter:blur(4px); background:rgba(255,255,255,.75);
          border:1px solid #e2e8f0; border-radius:12px; padding:12px 16px; display:flex; gap:10px; align-items:center; color:#334155; font-weight:700; }
      `}</style>
    </main>
  );
}
