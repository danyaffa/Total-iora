// STATIC PREVIEW ONLY — no OracleVoice, no API calls, just links to Register/Login and the full board.

import Link from "next/link";
import Footer from "../components/Footer";

export default function IndexPreview() {
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
        <img src="/TotalIora_Logo.png" alt="Total-iora" className="logo" />
        <p className="note">
          Welcome to <strong>Total-Iora Voice</strong>. This is a preview only. After you register (free) you’ll use the full board on the <strong>Home</strong> page.
        </p>
      </section>

      {/* Feature tiles — visually identical, buttons disabled on the index preview */}
      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pill">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>Your quiet place. Write, cry, pray, whisper. Light a candle. We don’t read or judge. <strong>Nothing is stored or kept.</strong></p>
            </header>
            <footer className="f">
              <span className="btn accent disabled" aria-disabled="true" role="button" tabIndex={-1}>
                Open Sacred Notes
              </span>
              <div className="disc">
                This is your space. Do whatever you like on this page. We have no responsibility for anything you write, and nothing is saved on our servers.
              </div>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pill">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>Ask questions by typing or voice and get grounded answers. (Preview only here.)</p>
            </header>
            <footer className="f">
              <span className="btn accent disabled" aria-disabled="true" role="button" tabIndex={-1}>
                Get Your Oracle Universe DNA
              </span>
              <div className="disc">Spiritual guidance only. No medical, legal, or financial advice.</div>
            </footer>
          </article>
        </div>
      </section>

      {/* STATIC mock of the board (non-interactive) */}
      <section className="boardPreview">
        <div className="board">
          <div className="left">
            <div className="orb" />
            <div className="input" aria-hidden="true">
              <div className="label">You</div>
              <div className="box">Type or speak here, then press Get Answer.</div>
              <div className="row">
                <span className="btn disabled">🎙️ Start</span>
                <span className="btn disabled">Get Answer ⟶</span>
              </div>
              <div className="row">
                <span className="btn disabled">📚 Source</span>
                <span className="btn disabled">⬇️ Download</span>
                <span className="btn disabled">🖨️ Print</span>
              </div>
            </div>
          </div>
          <div className="right">
            <div className="orb blue" />
            <div className="output" aria-hidden="true">
              <div className="label">Guide</div>
              <div className="bubble">—</div>
              <div className="muted">This is a static preview. Open the full board to interact.</div>
            </div>
          </div>
        </div>

        <p className="hint">
          This is what you’ll see after sign-in <em>(interactive on the Home page)</em>.
        </p>

        <div style={{textAlign:"center", marginTop:8}}>
          <Link href="/homepage" className="btn cta">Open the Full Board</Link>
        </div>
      </section>

      <Footer />

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#ffffff,#f8fafc); }
        .topnav { display:flex; justify-content:center; padding:14px; flex-wrap:wrap; gap:8px; }
        .btn { display:inline-block; padding:10px 16px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.cta { color:#fff; border:none; background:linear-gradient(135deg,#7c3aed,#14b8a6); }
        .btn.disabled { opacity:.6; pointer-events:none; }
        .hero { text-align:center; padding-top:8px; }
        .logo { width:148px; margin:0 auto; display:block; }
        .note { max-width:900px; margin:10px auto 0; color:#475569; padding:0 12px; text-align:center; }
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
        .boardPreview { max-width:1100px; margin:6px auto 14px; padding:0 16px; }
        .board { display:grid; grid-template-columns:1fr; gap:12px; }
        @media(min-width:900px){ .board { grid-template-columns:1fr 1fr; } }
        .left,.right { background:#fff; border:1px solid #e2e8f0; border-radius:18px; padding:12px; display:flex; gap:12px; align-items:flex-start; }
        .orb { width:140px; height:140px; min-width:140px; border-radius:999px; background:radial-gradient(40% 40% at 50% 50%, rgba(124,58,237,.18), rgba(124,58,237,0)); border:1px solid rgba(124,58,237,.25); }
        .orb.blue { background:radial-gradient(40% 40% at 50% 50%, rgba(14,165,233,.18), rgba(14,165,233,0)); border-color:rgba(14,165,233,.25); }
        .label{font-size:.86rem;color:#64748b;margin-bottom:6px;}
        .box{background:#fff;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;min-height:90px;color:#334155}
        .row{display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;}
        .bubble{background:#eef6ff;border:1px solid #dbeafe;border-radius:12px;padding:10px 12px;min-height:44px;color:#0f172a}
        .muted{color:#94a3b8; font-size:.92rem; margin-top:6px;}
        .hint{ text-align:center; color:#64748b; margin:8px 0 0; }
      `}</style>
    </div>
  );
}
