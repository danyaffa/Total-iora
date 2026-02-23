// FILE: /pages/index.js
// Static preview — Users can choose faith, see features, install the app, then register.

import Head from "next/head";
import Link from "next/link";
import Footer from "../components/Footer";
import InstallAppButton from "../components/InstallAppButton";
import { useEffect, useRef, useState } from "react";

const FAITH_OPTIONS = [
  { id: "universal", label: "Universal / Open", symbol: "✨" },
  { id: "christian", label: "Christian", symbol: "✝️" },
  { id: "muslim", label: "Muslim", symbol: "☪️" },
  { id: "buddhist", label: "Buddhist", symbol: "☸️" },
  { id: "hindu", label: "Hindu", symbol: "🕉️" },
  { id: "jewish", label: "Jewish", symbol: "✡️" },
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
      <Head>
        <title>Total-iora — Spiritual Guidance & Sacred Notes</title>
        <meta name="description" content="Faith-aware voice and text guidance with beautiful atmospheres. Your private sanctuary of reflection." />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta property="og:title" content="Total-iora — Spiritual Guidance" />
        <meta property="og:description" content="Voice guidance, sacred notes, and downloadable reports aligned to your tradition." />
        <meta property="og:type" content="website" />
      </Head>

      {/* Top nav */}
      <nav className="topnav">
        <Link
          href="/register"
          className="navPill primary"
        >
          Register Free
        </Link>

        <Link
          href="/login"
          className="navPill secondary"
        >
          Log in
        </Link>

        <InstallAppButton variant="compact" />
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
              <span className="pillCaret">&#x25BE;</span>
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
          Welcome to <strong>Total-Iora Voice</strong>. Choose your spiritual
          heritage, explore the preview below, then{" "}
          <strong>Register</strong> to unlock all features.
        </p>

        <div className="selectionHint">
          Selected: <strong>{faith.symbol}</strong> {faith.label}
        </div>

        {/* Prominent Install App CTA */}
        <div className="installRow">
          <InstallAppButton />
        </div>
      </section>

      {/* Feature tiles */}
      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pillBadge">Sacred Notes</div>
              <h3>Leave a private note · Light a candle</h3>
              <p>
                Your quiet place. Write, cry, pray, whisper. Light a candle. We
                don't read or judge.{" "}
                <strong>Nothing is stored or kept.</strong>
              </p>
            </header>
            <footer className="f">
              <span className="btn accent disabled">Open Sacred Notes</span>
              <div className="disc">
                This is your space. We have no responsibility for anything you
                write, and nothing is saved on our servers.
              </div>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pillBadge">Oracle Universe DNA</div>
              <h3>Your personal map · Downloadable guidance</h3>
              <p>
                Ask questions by typing or voice and get grounded answers.
                (Preview only here.)
              </p>
            </header>
            <footer className="f">
              <span className="btn accent disabled">
                Get Your Oracle Universe DNA
              </span>
              <div className="disc">
                Spiritual guidance only. No medical, legal, or financial advice.
              </div>
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
              <div className="box">
                Type or speak here, then press Get Answer.
              </div>
              <div className="row">
                <span className="btn disabled">Start</span>
                <span className="btn disabled">Get Answer</span>
              </div>
              <div className="row">
                <span className="btn disabled">Source</span>
                <span className="btn disabled">Download</span>
                <span className="btn disabled">Print</span>
              </div>
            </div>
          </div>

          <div className="right">
            <div className="orb orbBlue" />
            <div className="output">
              <div className="label">Guide</div>
              <div className="bubble">—</div>
              <div className="muted">
                This is a static preview. Register to use the full board.
              </div>
            </div>
          </div>
        </div>

        <p className="hint">
          Preview only. <strong>Register</strong> to unlock the full experience.
        </p>
      </section>

      {/* Disclaimer */}
      <section className="legalDisclaimer">
        <p>
          <strong>Disclaimer:</strong> Total-Iora is strictly for{" "}
          <strong>entertainment and spiritual reflection purposes only</strong>.
          We are <strong>not</strong> providing medical, psychological,
          financial, or legal treatments or recommendations. You are solely
          responsible for your own decisions and well-being.
        </p>
        <p className="legalLinkRow">
          By using this site, you agree to our{" "}
          <Link href="/legal" className="legalLink">
            Full Legal Disclaimer & Liability Waiver
          </Link>
          .
        </p>
      </section>

      <Footer />

      <style jsx>{`
        .page {
          min-height: 100vh;
          background: linear-gradient(#ffffff, #f8fafc);
        }

        /* ---- Top nav ---- */
        .topnav {
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          padding: 16px 12px;
          flex-wrap: wrap;
        }
        .navPill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 20px;
          border-radius: 999px;
          font-weight: 800;
          font-size: 14px;
          text-decoration: none;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s;
          color: white;
          border: 1px solid rgba(255, 255, 255, 0.25);
        }
        .navPill:hover {
          transform: translateY(-2px);
        }
        .navPill.primary {
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
        }
        .navPill.secondary {
          background: linear-gradient(135deg, #0ea5e9, #22c55e);
        }

        /* ---- Hero ---- */
        .hero {
          text-align: center;
          padding-top: 8px;
        }
        .logo {
          width: 120px;
          margin: 0 auto;
          display: block;
          border-radius: 14px;
        }

        .pillRow {
          display: flex;
          justify-content: center;
          margin-top: 10px;
          padding: 0 12px;
        }
        .faithPicker {
          position: relative;
          display: inline-block;
        }
        .pillButton {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          color: #fff;
          font-weight: 900;
          cursor: pointer;
          box-shadow: 0 10px 24px rgba(2, 6, 23, 0.12);
          max-width: 92vw;
          font-size: 14px;
        }
        .pillIcon {
          font-size: 18px;
          line-height: 1;
        }
        .pillValue {
          background: rgba(255, 255, 255, 0.16);
          border: 1px solid rgba(255, 255, 255, 0.22);
          padding: 4px 10px;
          border-radius: 999px;
          font-weight: 800;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 44vw;
        }
        .pillCaret {
          margin-left: 2px;
          font-weight: 900;
          opacity: 0.9;
        }
        .faithMenu {
          position: absolute;
          top: 52px;
          left: 0;
          right: 0;
          z-index: 50;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.14);
          overflow: hidden;
          min-width: 260px;
        }
        .faithItem {
          width: 100%;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;
          background: #fff;
          border: none;
          cursor: pointer;
          text-align: left;
          font-weight: 800;
          color: #0f172a;
          font-size: 14px;
        }
        .faithItem:hover {
          background: #f8fafc;
        }
        .faithItem.active {
          background: #eef2ff;
        }
        .faithSymbol {
          width: 22px;
          display: inline-flex;
          justify-content: center;
        }
        .faithLabel {
          flex: 1;
        }
        .note {
          max-width: 900px;
          margin: 10px auto 0;
          color: #475569;
          padding: 0 16px;
          text-align: center;
          line-height: 1.6;
        }
        .selectionHint {
          margin-top: 8px;
          font-size: 0.92rem;
          color: #64748b;
        }
        .installRow {
          display: flex;
          justify-content: center;
          margin-top: 16px;
        }

        /* ---- Tiles ---- */
        .tiles {
          max-width: 1100px;
          margin: 16px auto 6px;
          padding: 0 16px;
        }
        .grid {
          display: grid;
          gap: 14px;
          grid-template-columns: 1fr;
        }
        @media (min-width: 700px) {
          .grid {
            grid-template-columns: 1fr 1fr;
          }
        }
        .card {
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
          padding: 18px;
        }
        .pillBadge {
          display: inline-block;
          padding: 6px 10px;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #fff;
          color: #334155;
          font-weight: 700;
          font-size: 0.85rem;
        }
        h3 {
          margin: 8px 0 4px;
          font-size: 1.15rem;
          font-weight: 800;
          color: #0f172a;
        }
        p {
          color: #475569;
        }
        .f {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-top: 8px;
        }
        .btn {
          display: inline-block;
          padding: 10px 16px;
          border-radius: 14px;
          font-weight: 800;
          border: 1px solid rgba(15, 23, 42, 0.12);
          background: #fff;
          color: #0f172a;
          text-decoration: none;
          font-size: 14px;
        }
        .btn.accent {
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          border: none;
        }
        .btn.disabled {
          opacity: 0.6;
          pointer-events: none;
        }
        .disc {
          color: #64748b;
          font-size: 0.88rem;
        }

        /* ---- Board preview ---- */
        .boardPreview {
          max-width: 1100px;
          margin: 6px auto 14px;
          padding: 0 16px;
        }
        .board {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        @media (min-width: 700px) {
          .board {
            grid-template-columns: 1fr 1fr;
          }
        }
        .left,
        .right {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 12px;
          display: flex;
          gap: 12px;
          align-items: flex-start;
        }
        .orb {
          width: 80px;
          height: 80px;
          min-width: 80px;
          border-radius: 999px;
          background: radial-gradient(
            40% 40% at 50% 50%,
            rgba(124, 58, 237, 0.18),
            rgba(124, 58, 237, 0)
          );
          border: 1px solid rgba(124, 58, 237, 0.25);
        }
        .orbBlue {
          background: radial-gradient(
            40% 40% at 50% 50%,
            rgba(14, 165, 233, 0.18),
            rgba(14, 165, 233, 0)
          );
          border-color: rgba(14, 165, 233, 0.25);
        }
        .label {
          font-size: 0.86rem;
          color: #64748b;
          margin-bottom: 6px;
        }
        .box {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 10px 12px;
          min-height: 60px;
          color: #334155;
          font-size: 0.9rem;
        }
        .row {
          display: flex;
          gap: 8px;
          margin-top: 8px;
          flex-wrap: wrap;
        }
        .bubble {
          background: #eef6ff;
          border: 1px solid #dbeafe;
          border-radius: 12px;
          padding: 10px 12px;
          min-height: 44px;
          color: #0f172a;
        }
        .muted {
          color: #94a3b8;
          font-size: 0.88rem;
          margin-top: 6px;
        }
        .hint {
          text-align: center;
          color: #64748b;
          margin: 8px 0 0;
        }

        /* ---- Legal ---- */
        .legalDisclaimer {
          max-width: 900px;
          margin: 30px auto 20px;
          padding: 16px;
          text-align: center;
          background: #fff;
          border-top: 1px solid #e2e8f0;
          color: #64748b;
          font-size: 0.85rem;
          line-height: 1.5;
        }
        .legalLinkRow {
          margin-top: 8px;
        }
        .legalLink {
          color: #7c3aed;
          text-decoration: underline;
          font-weight: 700;
        }
        .legalLink:hover {
          color: #5b21b6;
        }

        /* ---- Mobile responsive ---- */
        @media (max-width: 480px) {
          .topnav {
            gap: 8px;
            padding: 12px 8px;
          }
          .navPill {
            padding: 8px 14px;
            font-size: 13px;
          }
          .logo {
            width: 100px;
          }
          .pillButton {
            gap: 6px;
            padding: 8px 10px;
            font-size: 13px;
          }
          .orb {
            width: 50px;
            height: 50px;
            min-width: 50px;
          }
          h3 {
            font-size: 1.05rem;
          }
          .faithMenu {
            min-width: unset;
          }
        }
      `}</style>
    </div>
  );
}
