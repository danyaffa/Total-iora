// FILE: /pages/index.js
import Link from "next/link";
import Footer from "@/components/Footer";
import HeritageCards from "@/components/HeritageCards";   // your existing chips
import FeatureTiles from "@/components/FeatureTiles";     // NEW

export default function Home() {
  return (
    <div className="page">
      {/* Top nav — Support removed */}
      <nav className="topnav">
        <Link href="/get-your-aura">Begin</Link>
        <Link href="/sacred-space">Sacred Notes</Link>
      </nav>

      {/* Logo + short line (unchanged look) */}
      <section className="hero">
        <img src="/AuraCode_Logo.png" alt="AuraCode Logo" className="logo" />
        <p className="note">
          Advanced Voice is now <strong>ChatGPT Voice</strong>. Choose your room, or start with Sacred Notes.
        </p>
      </section>

      {/* NEW: two large feature tiles (Sacred Notes + Oracle Universe DNA) */}
      <FeatureTiles />

      {/* Heritage chips route into /guide/<slug> rooms */}
      <HeritageCards />

      {/* Your Oracle section stays below, rendered by /guide pages or here if you like */}

      <Footer />

      <style jsx>{`
        .page { min-height: 100vh; background: linear-gradient(#ffffff, #f8fafc); }
        .topnav { display:flex; gap:14px; justify-content:center; padding:14px; }
        .hero { text-align:center; padding-top:8px; }
        .logo { width:148px; height:auto; margin:0 auto; display:block; }
        .note { max-width:820px; margin:10px auto 0; color:#475569; padding:0 12px; }
      `}</style>
    </div>
  );
}
