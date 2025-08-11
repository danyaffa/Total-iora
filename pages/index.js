// FILE: /pages/index.js
// Index MUST be STATIC until login. No dev bypass.

import { useEffect, useState, useCallback } from "react";
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

export default function Home() {
  const [path, setPath] = useState("Universal");
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  const checkLock = useCallback(async () => {
    setChecking(true);
    let ok = false;
    try {
      // Prefer server truth if available
      const r = await fetch("/api/auth/whoami", { credentials: "include" });
      if (r.ok) ok = true;
      // If endpoint not present, fall back to session cookie
      if (r.status === 404) ok = !!getCookie("ac_session");
    } catch {
      ok = !!getCookie("ac_session");
    }
    setUnlocked(Boolean(ok));
    setChecking(false);
  }, []);

  useEffect(() => {
    checkLock();
    const i = setInterval(checkLock, 1500); // react to login/logout quickly
    return () => clearInterval(i);
  }, [checkLock]);

  const locked = !unlocked;

  async function doLogout(e) {
    e?.preventDefault?.();
    try { await fetch("/api/logout", { method: "POST", credentials: "include" }); } catch {}
    try { localStorage.removeItem("ac_registered"); } catch {}
    window.location.href = "/";
  }

  return (
    <div className="page">
      {/* Top nav */}
      <nav className="topnav">
        <Link href="/register">Register — Free Access</Link>
        {locked ? <Link href="/login">Log in</Link> : <a href="/api/logout" onClick={doLogout}>Log out</a>}
      </nav>

      {/* Logo + intro */}
      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="Total-Iora Logo" className="logo" />
        <p className="note">
          Advanced Voice is now <strong>Total-Iora Voice</strong>. Choose your spiritual heritage,
          or start with Sacred Notes.
        </p>
        {!unlocked && (
          <div className="gateNote">{checking ? "Checking session…" : "Please log in to activate the page."}</div>
        )}
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
                <Link href="/login" className="btn accent" aria-disabled>Log in to Open</Link>
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
                <Link href="/login" className="btn accent" aria-disabled>Log in to Get Yours</Link>
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
        .page { min-height:100vh; background:linear-gradient(#ffffff,#f8fafc); }
        .topnav { display:flex; gap:16px; justify-content:center; padding:14px; }
        .hero { text-align:center; padding-top:8px; }
        .logo { width:148px; height:auto; margin:0 auto; display:block; }
        .note { max-width:820px; margin:10px auto 0; color:#475569; padding:0 12px; }
        .gateNote { margin-top:6px; color:#334155; font-size:.9rem; }

        .tiles { max-width:1100px; margin:10px auto 6px; padding:0 16px; }
        .grid { display:grid; gap:14px; grid-template-columns:1fr; }
        @media (min-width:900px){ .grid { grid-template-columns:1fr 1fr; } }
        .card { background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; box-shadow:0 10px 30px rgba(2,6,23,.08); padding:18px; }
        .pill { display:inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h3 { margin:8px 0 4px; font-size:1.25rem; font-weight:800; color:#0f172a; }
        p { color:#475569; }
        .f { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
        .btn { display:inline-block; padding:12px 18px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .disc { color:#64748b; font-size:.92rem;
