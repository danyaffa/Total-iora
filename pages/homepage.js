// FILE: /pages/homepage.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";

function setCookie(name, value, maxAgeDays = 365) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 3600;
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${isHttps ? "; Secure" : ""}`;
}

export async function getServerSideProps({ req, res }) {
  const faith =
    req.headers["x-faith"] ||
    req.cookies?.faith ||
    process.env.FAITH_OVERRIDE ||
    "Universal";
  return { props: { faith } };
}

export default function HomePage({ faith }) {
  const [path, setPath] = useState(faith);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const usp = new URLSearchParams(window.location.search);
      if (usp.get("dev") === "on") setCookie("ac_dev", "1", 30);
    }
    const update = () => {
      const has = (n) => (typeof document !== "undefined" && document.cookie.includes(`${n}=`));
      const isDevBypass = (typeof window !== "undefined" &&
        (process.env.NEXT_PUBLIC_DEV_BYPASS === "1" || has("ac_dev") || window.location.hostname === "localhost"));
      const isRegistered = has("ac_registered") || has("ac_session") ||
        (typeof localStorage !== "undefined" && localStorage.getItem("ac_registered") === "1");
      setUnlocked(Boolean(isRegistered || isDevBypass));
    };
    update();
    const t = setTimeout(update, 80);
    window.addEventListener?.("storage", update);
    return () => { clearTimeout(t); window.removeEventListener?.("storage", update); };
  }, []);

  const locked = !unlocked;

  return (
    <div className="page">
      <nav className="topnav">
        <Link href="/register" className="btn cta">Register — Free Access</Link>
      </nav>

      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="TotalIora Logo" className="logo" />
        <p className="note">
          Advanced Voice is now <strong>Total-Iora Voice</strong>. Choose your spiritual heritage,
          or start with Sacred Notes.
        </p>
      </section>

      {locked && (
        <div className="previewBanner" role="status">
          You’re viewing a read-only preview. <Link href="/login">Log in</Link> or{" "}
          <Link href="/register">Register</Link> to use the interactive features.
        </div>
      )}

      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pill">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>Your quiet place. Write, cry, pray, whisper. Light a candle. We don’t read or judge.<strong> Nothing is stored or kept.</strong></p>
            </header>
            <footer className="f">
              {locked ? (
                <Link href="/login" className="btn accent" aria-disabled="true">Log in to Open</Link>
              ) : (
                <Link href="/sacred-space" className="btn accent">Open Sacred Notes</Link>
              )}
              <div className="disc">This is your space. Do whatever you like on this page. We have no responsibility for anything you write, and nothing is saved on our servers.</div>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pill">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>Ask questions by typing or voice and get grounded answers. Download your write-up when it’s ready.</p>
            </header>
            <footer className="f">
              {locked ? (
                <Link href="/login" className="btn accent" aria-disabled="true">Log in to Get Yours</Link>
              ) : (
                <Link href="/oracle-universe-dna" className="btn accent">Get Your Oracle Universe DNA</Link>
              )}
              <div className="disc">Spiritual guidance only. No medical, legal, or financial advice.</div>
            </footer>
          </article>
        </div>
      </section>

      {unlocked ? (
        <>
          {faith === "Universal" ? (
            <HeritageSelector path={path} onChange={setPath} />
          ) : null}
          <OracleVoice path={path} />
        </>
      ) : (
        <section className="gate">
          <div className="card gatecard">
            <h3>Speak to the Oracle</h3>
            <p>Log in (or register free) to start a private, one-to-one voice conversation with a guide aligned to your tradition.</p>
            <Link href="/login" className="btn accent">Log in</Link>
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
        .logo { width:148px; margin:0 auto; display:block; }
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
