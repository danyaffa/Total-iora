// FILE: /pages/index.js
import { useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";

export default function Home() {
  const [path, setPath] = useState("Universal");

  return (
    <div className="page">
      {/* Top nav */}
      <nav className="topnav">
        <Link href="/get-your-aura">Begin</Link>
        <Link href="/sacred-space">Sacred Notes</Link>
        <Link className="btn" href="/unlock">Support</Link>
      </nav>

      {/* Hero with logo only */}
      <section className="hero">
        <img src="/AuraCode_Logo.png" alt="AuraCode Logo" className="logo" />
        <p className="note">
          Advanced Voice is now <strong>ChatGPT Voice</strong>. Have a one-to-one
          conversation with a guide aligned to your tradition—or simply a gentle Sage.
        </p>
      </section>

      {/* Path selector + Oracle centerpiece */}
      <HeritageSelector path={path} onChange={setPath} />
      <OracleVoice path={path} />

      <Footer />

      <style jsx>{`
        .page { min-height: 100vh; background: linear-gradient(#ffffff, #f8fafc); }
        .topnav { display:flex; gap:14px; justify-content:center; padding:14px; }
        .btn { padding:8px 12px; border-radius:10px; color:#fff; background:#111827; }
        .hero { text-align:center; padding-top:8px; }
        .logo { width:148px; height:auto; margin:0 auto; display:block; }
        .note { max-width:820px; margin:10px auto 0; color:#475569; padding:0 12px; }
      `}</style>
    </div>
  );
}
