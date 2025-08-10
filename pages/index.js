// FILE: /pages/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";

// --- tiny helpers (client-only) ---
function hasCookie(name) {
  if (typeof document === "undefined") return false;
  return document.cookie.split("; ").some((c) => c.startsWith(name + "="));
}
function setCookie(name, value, maxAgeDays = 365) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 3600;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

export default function Home() {
  const [path, setPath] = useState("Universal");
  const [unlocked, setUnlocked] = useState(false); // registration/dev gate

  // Gate logic: default = locked (static). Unlock if cookie or dev bypass.
  useEffect(() => {
    // allow developer bypass by query: ?dev=on  (persists a cookie)
    if (typeof window !== "undefined") {
      const usp = new URLSearchParams(window.location.search);
      if (usp.get("dev") === "on") setCookie("ac_dev", "1", 30);
    }
    const isDevBypass =
      typeof window !== "undefined" &&
      (process.env.NEXT_PUBLIC_DEV_BYPASS === "1" ||
        hasCookie("ac_dev") ||
        window.location.hostname === "localhost");

    const isRegistered =
      hasCookie("ac_registered") ||
      (typeof localStorage !== "undefined" && localStorage.getItem("ac_registered") === "1");

    setUnlocked(!!(isRegistered || isDevBypass));
  }, []);

  return (
    <div className="page">
      {/* Top nav — Register always visible */}
      <nav className="topnav">
        <Link href="/register" className="btn cta">Register — Free Access</Link>
      </nav>

      {/* Logo + short line */}
      <section className="hero">
        <img src="/AuraCode_Logo.png" alt="AuraCode Logo" className="logo" />
        <p className="note">
          Advanced Voice is now <strong>ChatGPT Voice</strong>. Choose your room,
          or start with Sacred Notes.
        </p>
      </section>

      {/* Feature tiles (static marketing; available to everyone) */}
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
              <Link href="/sacred-space" className="btn accent">Open Sacred Notes</Link>
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
              <Link href="/oracle-universe-dna" className="btn accent">Get Your Oracle Universe DNA</Link>
              <div className="disc">
                Spiritual guidance only. No promises. No medical, legal, or financial advice.
              </div>
            </footer>
          </article>
        </div>
      </section>

      {/* GATED AREA — only after registration or dev bypass */}
      {unlocked ? (
        <>
          <HeritageSelector path={path} onChange={setPath} />
          <OracleVoice path={path} />
        </>
      ) : (
        // Teaser card shown before unlock
        <section className="gate">
          <div className="card gatecard">
            <h3>Speak to the Oracle</h3>
            <p>Register (free) to start a private, one-to-one voice conversation with a guide aligned to your tradition.</p>
            <Link href="/register" className="btn accent">Register — Free Access</Link>
          </div>
        </section>
      )}

      <Footer />

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#ffffff,#f8fafc); }

        .topnav { display:flex; justify-content:center; padding:14px; }
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

        .gate { max-width:1100px; margin:12px auto 20px; padding:0 16px; }
        .gatecard { text-align:center; }
      `}</style>
    </div>
  );
}
