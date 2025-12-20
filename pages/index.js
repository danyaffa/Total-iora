// FILE: /pages/index.js
// Static preview ONLY — no OracleVoice, no API calls.
// Users can choose faith (stored locally) but cannot use the board until registered + paid.

import Link from "next/link";
import Footer from "../components/Footer";
import { useEffect, useRef, useState } from "react";

const FAITH_OPTIONS = [
  { id: "universal", label: "Universal / Open", symbol: "✨" },
  { id: "christian", label: "Christian", symbol: "✝️" },
  { id: "jewish", label: "Jewish", symbol: "✡️" },
  { id: "muslim", label: "Muslim", symbol: "☪️" },
  { id: "buddhist", label: "Buddhist", symbol: "☸️" },
  { id: "hindu", label: "Hindu", symbol: "🕉️" },
  { id: "tao", label: "Taoist", symbol: "☯️" },
  { id: "spiritual", label: "Spiritual (Non-religious)", symbol: "🌿" },
];

function safeLocalStorageGet(key) {
  try {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function safeLocalStorageSet(key, val) {
  try {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(key, val);
  } catch {
    // ignore
  }
}

export default function IndexPreview() {
  const [faith, setFaith] = useState(FAITH_OPTIONS[0]);
  const [openFaithMenu, setOpenFaithMenu] = useState(false);
  const faithMenuRef = useRef(null);

  useEffect(() => {
    const saved = safeLocalStorageGet("totaliora_faith");
    if (!saved) return;
    const found = FAITH_OPTIONS.find((x) => x.id === saved);
    if (found) setFaith(found);
  }, []);

  useEffect(() => {
    safeLocalStorageSet("totaliora_faith", faith.id);
  }, [faith]);

  useEffect(() => {
    function onDocMouseDown(e) {
      if (!openFaithMenu) return;
      if (faithMenuRef.current && !faithMenuRef.current.contains(e.target)) {
        setOpenFaithMenu(false);
      }
    }
    document.addEventListener("mousedown", onDocMouseDown);
    return () => document.removeEventListener("mousedown", onDocMouseDown);
  }, [openFaithMenu]);

  return (
    <div className="page">
      {/* Top nav — Register (WITH PRICE) + Log in as COLORFUL pill buttons */}
      <nav className="topnav">
        <Link href="/register" className="pill pill-register">
          Register (US$9/mo)
        </Link>

        <Link href="/login" className="pill pill-login">
          Log in
        </Link>
      </nav>

      {/* Logo + Faith picker */}
      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="Total-iora" className="logo" />

        <div className="pillRow">
          <div className="faithPicker" ref={faithMenuRef}>
            <button
              type="button"
              className="pillButton"
              onClick={() => setOpenFaithMenu((v) => !v)}
            >
              <span className="pillIcon">{faith.symbol}</span>
              <span>Choose your faith</span>
              <span className="pillValue">{faith.label}</span>
              <span className="pillCaret">▾</span>
            </button>

            {openFaithMenu && (
              <div className="faithMenu">
                {FAITH_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    className={`faithItem ${opt.id === faith.id ? "active" : ""}`}
                    onClick={() => {
                      setFaith(opt);
                      setOpenFaithMenu(false);
                    }}
                  >
                    <span className="faithSymbol">{opt.symbol}</span>
                    <span className="faithLabel">{opt.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <p className="note">
          Welcome to <strong>Total-Iora Voice</strong>. This is a{" "}
          <strong>static preview</strong>. You can choose your spiritual heritage here,
          but the board remains inactive until you <strong>Register</strong> and{" "}
          <strong>Subscribe</strong>.
        </p>

        <div className="selectionHint">
          Selected: <strong>{faith.symbol}</strong> {faith.label}
        </div>
      </section>

      {/* Feature tiles */}
      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pillBadge">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>
                Your quiet place. Write, cry, pray, whisper. Light a candle. We don’t
                read or judge. <strong>Nothing is stored or kept.</strong>
              </p>
            </header>
            <footer className="f">
              <span className="btn accent disabled">Open Sacred Notes</span>
              <div className="disc">
                This is your space. Do whatever you like on this page. We have no
                responsibility for anything you write, and nothing is saved on our
                servers.
              </div>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pillBadge">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>
                Ask questions by typing or voice and get grounded answers. (Preview only
                here.)
              </p>
            </header>
            <footer className="f">
              <span className="btn accent disabled">Get Your Oracle Universe DNA</span>
              <div className="disc">Spiritual guidance only. No medical, legal, or financial advice.</div>
            </footer>
          </article>
        </div>
      </section>

      {/* STATIC mock board */}
      <section className="boardPreview">
        <div className="board">
          <div className="left">
            <div className="orb" />
            <div className="input">
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
            <div className="output">
              <div className="label">Guide</div>
              <div className="bubble">—</div>
              <div className="muted">
                This is a static preview. Register and Subscribe to use the full board.
              </div>
            </div>
          </div>
        </div>

        <p className="hint">
          Preview only. To unlock the board: <strong>Register</strong> then{" "}
          <strong>Subscribe</strong>.
        </p>
        
        {/* DUPLICATE BUTTONS REMOVED */}
      </section>

      <Footer />

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#ffffff,#f8fafc); }

        /* ✅ Top nav pill buttons - VIBRANT GRADIENTS (NO BLACK) */
        .topnav {
          display: flex;
          justify-content: center;
          gap: 12px;
          padding: 16px;
        }

        .pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 20px;
          border-radius: 999px;
          font-weight: 800;
          text-decoration: none;
          color: #fff;
          box-shadow: 0 4px 12px rgba(0,0,0,0.1);
          transition: transform 0.2s;
        }
        .pill:hover { transform: translateY(-1px); }

        .pill-register {
          background: linear-gradient(135deg, #7c3aed, #14b8a6); /* Purple/Teal */
          border: 1px solid rgba(255,255,255,0.2);
        }

        .pill-login {
          background: linear-gradient(135deg, #0ea5e9, #22c55e); /* Blue/Green */
          border: 1px solid rgba(255,255,255,0.2);
        }

        .hero { text-align:center; padding-top:8px; }
        .logo { width:148px; margin:0 auto; display:block; }

        .pillRow { display:flex; justify-content:center; margin-top:10px; padding:0 12px; }
        .faithPicker { position:relative; display:inline-block; }

        .pillButton{
          display:flex;
          align-items:center;
          gap:10px;
          padding:10px 14px;
          border-radius:999px;
          border:1px solid rgba(15,23,42,.12);
          background:linear-gradient(135deg,#7c3aed,#14b8a6);
          color:#fff;
          font-weight:900;
          cursor:pointer;
          box-shadow:0 10px 24px rgba(2,6,23,.12);
          max-width:92vw;
        }

        .pillIcon { font-size:18px; line-height:1; }
        .pillValue{
          background:rgba(255,255,255,.16);
          border:1px solid rgba(255,255,255,.22);
          padding:4px 10px;
          border-radius:999px;
          font-weight:800;
          white-space:nowrap;
          overflow:hidden;
          text-overflow:ellipsis;
          max-width:44vw;
        }
        .pillCaret{ margin-left:2px; font-weight:900; opacity:.9; }

        .faithMenu{
          position:absolute; top:52px; left:0; right:0; z-index:50;
          background:#fff; border:1px solid #e2e8f0; border-radius:16px;
          box-shadow:0 20px 40px rgba(0,0,0,.14); overflow:hidden; min-width:260px;
        }
        @media (max-width:420px){ .faithMenu{ min-width:unset; } }

        .faithItem{
          width:100%; display:flex; align-items:center; gap:12px;
          padding:12px 14px; background:#fff; border:none; cursor:pointer;
          text-align:left; font-weight:800; color:#0f172a;
        }
        .faithItem:hover{ background:#f8fafc; }
        .faithItem.active{ background:#eef2ff; }
        .faithSymbol{ width:22px; display:inline-flex; justify-content:center; }
        .faithLabel{ flex:1; }

        .note { max-width:900px; margin:10px auto 0; color:#475569; padding:0 12px; text-align:center; }
        .selectionHint{ margin-top:8px; font-size:.92rem; color:#64748b; }

        .tiles { max-width:1100px; margin:10px auto 6px; padding:0 16px; }
        .grid { display:grid; gap:14px; grid-template-columns:1fr; }
        @media (min-width:900px){ .grid { grid-template-columns:1fr 1fr; } }

        .card {
          background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px;
          box-shadow:0 10px 30px rgba(2,6,23,.08); padding:18px;
        }
        .pillBadge {
          display:inline-block; padding:6px 10px; border:1px solid #e2e8f0;
          border-radius:999px; background:#fff; color:#334155; font-weight:700;
        }
        h3 { margin:8px 0 4px; font-size:1.25rem; font-weight:800; color:#0f172a; }
        p { color:#475569; }
        .f { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
        .btn {
          display:inline-block; padding:10px 16px; border-radius:14px; font-weight:800;
          border:1px solid rgba(15,23,42,.12); background:#fff; color:#0f172a; text-decoration:none;
        }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .btn.disabled { opacity:.6; pointer-events:none; }
        .disc { color:#64748b; font-size:.92rem; }

        .boardPreview { max-width:1100px; margin:6px auto 14px; padding:0 16px; }
        .board { display:grid; grid-template-columns:1fr; gap:12px; }
        @media(min-width:900px){ .board { grid-template-columns:1fr 1fr; } }

        .left,.right {
          background:#fff; border:1px solid #e2e8f0; border-radius:18px;
          padding:12px; display:flex; gap:12px; align-items:flex-start;
        }
        .orb {
          width:140px; height:140px; min-width:140px; border-radius:999px;
          background:radial-gradient(40% 40% at 50% 50%, rgba(124,58,237,.18), rgba(124,58,237,0));
          border:1px solid rgba(124,58,237,.25);
        }
        .orb.blue {
          background:radial-gradient(40% 40% at 50% 50%, rgba(14,165,233,.18), rgba(14,165,233,0));
          border-color:rgba(14,165,233,.25);
        }
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
