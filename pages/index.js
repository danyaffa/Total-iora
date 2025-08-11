// FILE: /pages/index.js
// PREVIEW-ONLY: looks like the homepage, but totally inert except Register / Log in.

import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";

export default function IndexPreview() {
  const path = "Universal"; // static preview path

  return (
    <div className="page">
      {/* Top nav — ONLY Register / Log in are live */}
      <nav className="topnav">
        <Link href="/register" className="btn cta">Register — Free Access</Link>
        <span style={{ width: 8 }} />
        <Link href="/login" className="btn">Log in</Link>
      </nav>

      {/* Logo + short line */}
      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="TotalIora Logo" className="logo" />
        <p className="note">
          Advanced Voice is now <strong>Total-Iora Voice</strong>. Choose your spiritual heritage,
          or start with Sacred Notes.
        </p>
      </section>

      {/* Feature tiles — buttons are visually identical but disabled */}
      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pill">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>
                Your quiet place. Write, cry, pray, whisper. Light a candle. We don’t read or judge.
                <strong> Nothing is stored or kept.</strong>
              </p>
            </header>
            <footer className="f">
              <span className="btn accent disabled" aria-disabled="true" role="button" tabIndex={-1}>
                Open Sacred Notes
              </span>
              <div className="disc">
                This is your space. Do whatever you like on this page. We have no responsibility
                for anything you write, and nothing is saved on our servers.
              </div>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pill">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>
                Ask for a future outlook, horoscope-style reflections, and gentle advice woven from your tradition.
                Download your write-up when it’s ready.
              </p>
            </header>
            <footer className="f">
              <span className="btn accent disabled" aria-disabled="true" role="button" tabIndex={-1}>
                Get Your Oracle Universe DNA
              </span>
              <div className="disc">Spiritual guidance only. No promises. No medical, legal, or financial advice.</div>
            </footer>
          </article>
        </div>
      </section>

      {/* Board preview — rendered but fully inert */}
      <div className="main preview-locked" inert="" aria-disabled="true">
        <HeritageSelector path={path} onChange={() => {}} />
        <OracleVoice path={path} />
      </div>

      <Footer />

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#ffffff,#f8fafc); }

        .topnav { display:flex; justify-content:center; padding:14px; flex-wrap:wrap; gap:8px; }
        .btn { display:inline-block; padding:10px 16px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.cta { color:#fff; border:none; background:linear-gradient(135deg,#7c3aed,#14b8a6); }
        .btn.disabled { opacity:.6; cursor:default; }

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

        /* Hard-disable all interactive child elements */
        .main.preview-locked a,
        .main.preview-locked button,
        .main.preview-locked [role="button"],
        .main.preview-locked input,
        .main.preview-locked select,
        .main.preview-locked textarea {
          pointer-events: none !important;
          opacity: .88;
        }
      `}</style>
    </div>
  );
}
