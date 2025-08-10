// FILE: /pages/index.js
import { useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";

export default function Home({ unlockedInitial }) {
  const [path, setPath] = useState("Universal");
  const unlocked = !!unlockedInitial;

  return (
    <div className="page">
      {!unlocked && (
        <nav className="topnav">
          <Link href="/register" className="btn cta">Register — Free Access</Link>
        </nav>
      )}

      <section className="hero">
        <img src="/AuraCode_Logo.png" alt="Logo" className="logo" />
        <p className="note">
          Advanced Voice is now <strong>ChatGPT Voice</strong>. Choose your room,
          or start with Sacred Notes.
        </p>
      </section>

      {/* marketing tiles always visible */}
      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pill">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>Your quiet place. We don’t read or judge. <strong>Nothing is stored or kept.</strong></p>
            </header>
            <footer className="f">
              <Link href="/sacred-space" className="btn accent">Open Sacred Notes</Link>
              <div className="disc">This is your space.</div>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pill">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>Ask for a future outlook and gentle advice.</p>
            </header>
            <footer className="f">
              <Link href="/oracle-universe-dna" className="btn accent">Get Your Oracle Universe DNA</Link>
              <div className="disc">Spiritual guidance only.</div>
            </footer>
          </article>
        </div>
      </section>

      {unlocked ? (
        <>
          <HeritageSelector path={path} onChange={setPath} />
          <OracleVoice path={path} />
        </>
      ) : (
        <section className="gate">
          <div className="card gatecard">
            <h3>Speak to the Oracle</h3>
            <p>Register (free) to start a private, one-to-one voice conversation.</p>
            <Link href="/register" className="btn accent">Register — Free Access</Link>
          </div>
        </section>
      )}

      <Footer />

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#ffffff,#f8fafc); }
        .topnav { display:flex; justify-content:center; padding:14px; }
        .btn { padding:10px 16px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.cta, .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
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
        .disc { color:#64748b; font-size:.92rem; }
        .gate { max-width:1100px; margin:12px auto 20px; padding:0 16px; }
        .gatecard { text-align:center; }
      `}</style>
    </div>
  );
}

// Server-side gate: if no ac_registered cookie, render locked view.
export async function getServerSideProps({ req, res, query }) {
  const devOn = query?.dev === "on";
  const hasReg = req.cookies?.ac_registered === "1";
  const devBypass = process.env.NEXT_PUBLIC_DEV_BYPASS === "1";

  if (devOn) {
    res.setHeader("Set-Cookie", `ac_dev=1; Max-Age=${30*24*3600}; Path=/; SameSite=Lax; Secure`);
  }

  const unlockedInitial = hasReg || devBypass || (req.cookies?.ac_dev === "1");
  return { props: { unlockedInitial } };
}
