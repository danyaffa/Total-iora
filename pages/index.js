// FILE: /pages/index.js
import Link from "next/link";
import { useState } from "react";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";

// Server-side gate: static before registration/login, active after.
// Unlocked if any cookie is present: ac_registered, ac_session, or ac_dev.
export async function getServerSideProps({ req }) {
  const cookie = req.headers.cookie || "";
  const ssrUnlocked = /(ac_registered=|ac_session=|ac_dev=)/.test(cookie);
  return { props: { ssrUnlocked } };
}

export default function Home({ ssrUnlocked }) {
  const [path, setPath] = useState("Universal");
  const locked = !ssrUnlocked;

  return (
    <div className="page">
      {/* Top nav — single CTA */}
      <nav className="topnav">
        <Link href="/register" className="btn cta">Register — Free Access</Link>
      </nav>

      {/* Logo + tagline */}
      <section className="hero">
        <img src="/AuraCode_Logo.png" alt="AuraCode Logo" className="logo" />
        <p className="note">
          Advanced Voice is now <strong>ChatGPT Voice</strong>. Choose your room, or start with Sacred Notes.
        </p>
      </section>

      {/* Tiles — route to /register while locked */}
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
              {locked
                ? <Link href="/register" className="btn accent">Register to Open</Link>
                : <Link href="/sacred-space" className="btn accent">Open Sacred Notes</Link>}
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
              {locked
                ? <Link href="/register" className="btn accent">Register to Get Yours</Link>
                : <Link href="/oracle-universe-dna" className="btn accent">Get Your Oracle Universe DNA</Link>}
              <div className="disc">
                Spiritual guidance only. No promises. No medical, legal, or financial advice.
              </div>
            </footer>
          </article>
        </div>
      </section>

      {/* GATED — only after registration/login */}
      {!locked ? (
        <>
          <HeritageSelector path={path} onChange={setPath} />
          <OracleVoice path={path} />
        </>
      ) : (
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
        .btn.cta, .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }

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
        .disc { color:#64748b; font-size:.92rem; }

        .gate { max-width:1100px; margin:12px auto 20px; padding:0 16px; }
        .gatecard { text-align:center; }
      `}</style>
    </div>
  );
}
