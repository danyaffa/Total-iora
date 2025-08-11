// FILE: /pages/index.js
import { useEffect, useState, useCallback, useRef } from "react";
import Head from "next/head";
import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";

/* ---------- helpers ---------- */
function getCookie(name) {
  if (typeof document === "undefined") return "";
  return (document.cookie || "")
    .split("; ")
    .find((c) => c.startsWith(name + "="))
    ?.split("=")[1] || "";
}

/* ---------- INLINE VOLUME BOOST (adds, does not change your logic) ---------- */
/**
 * Finds an <audio>/<video> element (prefers #oracle-audio if present),
 * then boosts volume up to 400% using Web Audio GainNode.
 * No changes required in other components.
 */
function VolumeBoostInline() {
  const ctxRef = useRef(null);
  const gainRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [pct, setPct] = useState(() => {
    if (typeof window === "undefined") return 100;
    const saved = parseInt(localStorage.getItem("ti_gain") || "100", 10);
    return Number.isFinite(saved) ? Math.min(Math.max(saved, 0), 400) : 100;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Prefer a specifically-marked audio if you have it
    let el =
      document.getElementById("oracle-audio") ||
      document.querySelector("audio, video");

    if (!el) return; // nothing to boost on this page

    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const source = ctx.createMediaElementSource(el);
      const gain = ctx.createGain();
      gain.gain.value = pct / 100;

      source.connect(gain).connect(ctx.destination);

      // Resume context on interaction (mobile policy)
      const resume = () => {
        if (ctx.state === "suspended") ctx.resume();
      };
      el.addEventListener("play", resume, { once: true });

      ctxRef.current = ctx;
      gainRef.current = gain;
      setReady(true);

      return () => {
        try {
          el.removeEventListener("play", resume);
          if (source) source.disconnect();
          if (gain) gain.disconnect();
          if (ctx && ctx.state !== "closed") ctx.close();
        } catch {}
      };
    } catch {
      setReady(false);
    }
  }, []);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = pct / 100;
      try {
        localStorage.setItem("ti_gain", String(pct));
      } catch {}
    }
  }, [pct]);

  if (!ready) return null;

  return (
    <div className="boost">
      <label htmlFor="ti-boost">Volume Booster (0–400%)</label>
      <input
        id="ti-boost"
        type="range"
        min={0}
        max={400}
        step={5}
        value={pct}
        onChange={(e) => setPct(parseInt(e.target.value, 10))}
      />
      <div className="boost-info">Current: <strong>{pct}%</strong></div>

      <style jsx>{`
        .boost {
          margin-top: 12px;
          padding: 12px;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 14px;
          background: #fff;
        }
        .boost label {
          display: block;
          font-weight: 700;
          margin-bottom: 6px;
        }
        .boost-info {
          margin-top: 4px;
          font-size: 0.9rem;
          color: #334155;
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const [path, setPath] = useState("Universal");
  const [unlocked, setUnlocked] = useState(false);

  const checkLock = useCallback(() => {
    // REQUIRE a real login session each visit. Registration by itself is not enough.
    const hasSession = !!getCookie("ac_session"); // set by /api/login

    // (Optional) developer bypass: ?dev=on once per device
    const devBypass =
      typeof window !== "undefined" &&
      (getCookie("ac_dev") ||
        process.env.NEXT_PUBLIC_DEV_BYPASS === "1" ||
        window.location.hostname === "localhost");

    setUnlocked(Boolean(hasSession || devBypass));
  }, []);

  useEffect(() => {
    // allow ?dev=on to set a bypass cookie for local testing
    if (typeof window !== "undefined") {
      const usp = new URLSearchParams(window.location.search);
      if (usp.get("dev") === "on") {
        const maxAge = 30 * 24 * 3600;
        const secure = window.location.protocol === "https:" ? "; Secure" : "";
        document.cookie = `ac_dev=1; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure}`;
      }
    }
    checkLock();
    const i = setInterval(checkLock, 1500); // catch changes after login/logout
    return () => clearInterval(i);
  }, [checkLock]);

  const locked = !unlocked;

  async function doLogout(e) {
    e?.preventDefault?.();
    try {
      await fetch("/api/logout", { method: "POST" });
    } catch {}
    // Clear any local hints just in case
    try { localStorage.removeItem("ac_registered"); } catch {}
    window.location.href = "/"; // reload cleanly without showing JSON
  }

  return (
    <div className="page">
      <Head>
        {/* Mobile fix: proper viewport, disables weird zoom + ensures responsive sizing */}
        <meta name="viewport" content="width=device-width, initial-scale=1, user-scalable=no" />
        <title>Total‑Iora</title>
      </Head>

      {/* Top nav */}
      <nav className="topnav">
        <Link href="/register">Register — Free Access</Link>
        {locked ? (
          <Link href="/login">Log in</Link>
        ) : (
          <a href="/api/logout" onClick={doLogout}>Log out</a>
        )}
      </nav>

      {/* Logo + intro */}
      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="Total-Iora Logo" className="logo" />
        <p className="note">
          Advanced Voice is now <strong>Total-Iora Voice</strong>. Choose your spiritual heritage,
          or start with Sacred Notes.
        </p>
      </section>

      {/* Tiles */}
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
              {locked ? (
                <Link href="/login" className="btn accent" aria-disabled="true">
                  Log in to Open
                </Link>
              ) : (
                <Link href="/sacred-space" className="btn accent">Open Sacred Notes</Link>
              )}
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
              {locked ? (
                <Link href="/login" className="btn accent" aria-disabled="true">
                  Log in to Get Yours
                </Link>
              ) : (
                <Link href="/oracle-universe-dna" className="btn accent">Get Your Oracle Universe DNA</Link>
              )}
              <div className="disc">
                Spiritual guidance only. No promises. No medical, legal, or financial advice.
              </div>
            </footer>
          </article>
        </div>
      </section>

      {/* Gated: heritage + voice only after login */}
      {unlocked ? (
        <>
          <HeritageSelector path={path} onChange={setPath} />
          <OracleVoice path={path} />
          {/* Inline booster appears only when logged in and media exists */}
          <VolumeBoostInline />
        </>
      ) : (
        <section className="gate">
          <div className="card gatecard">
            <h3>Speak to the Oracle</h3>
            <p>Log in (free) to start a private, one-to-one voice conversation with a guide aligned to your tradition.</p>
            <Link href="/login" className="btn accent">Log in</Link>
          </div>
        </section>
      )}

      <Footer />

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#ffffff,#f8fafc); -webkit-tap-highlight-color: transparent; }
        .topnav { display:flex; gap:16px; justify-content:center; padding:14px; }
        .topnav a { padding:8px 10px; border-radius:12px; touch-action: manipulation; }
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
        .btn { display:inline-block; padding:12px 18px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); touch-action: manipulation; }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .disc { color:#64748b; font-size:.92rem; }
        .gate { max-width:1100px; margin:12px auto 20px; padding:0 16px; }
        .gatecard { text-align:center; }
      `}</style>
    </div>
  );
}
