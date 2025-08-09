// FILE: /pages/guide/[id].js
import { useRouter } from "next/router";
import Footer from "../../components/Footer";
import OracleVoice from "../../components/OracleVoice";
import { PERSONAS } from "../../data/personas";

export default function GuideRoom() {
  const { query } = useRouter();
  const slug = Array.isArray(query.id) ? query.id[0] : query.id || "universal";
  const persona = PERSONAS.find((p) => p.slug === slug) || PERSONAS.find((p) => p.slug === "universal");

  return (
    <div className="room">
      <nav className="topnav">
        <a href="/">← Back</a>
      </nav>

      <header className="head">
        <div className="badge"><span className="t">{persona.title}</span></div>
        <h1>{persona.id} Room</h1>
        <p className="blurb">{persona.blurb}</p>
      </header>

      {/* Centerpiece voice UI */}
      <OracleVoice path={persona.id} />

      <Footer />

      <style jsx>{`
        .room { min-height:100vh; background:linear-gradient(#fff,#f8fafc); }
        .topnav { padding:14px 16px; }
        .head { text-align:center; padding:8px 12px 0; }
        .badge { display:inline-flex; align-items:center; gap:8px; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h1 { margin:8px 0 6px; font-size:1.8rem; font-weight:800; color:#0f172a; }
        .blurb { color:#475569; max-width:760px; margin:0 auto; }
      `}</style>
    </div>
  );
}
