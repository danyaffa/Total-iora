// FILE: /pages/guide/[id].js
import Footer from "../../components/Footer";
import OracleVoice from "../../components/OracleVoice";
import * as PersonasModule from "../../data/personas";

// Normalize PERSONAS whether it's an array or an object map
function getPersonasList() {
  const raw =
    PersonasModule.PERSONAS ??
    PersonasModule.default ??
    PersonasModule.personas ??
    PersonasModule.PERSONAS_LIST ??
    PersonasModule.PATHS;

  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === "object") return Object.values(raw);

  // Safe fallback (prevents build crashes)
  return [
    {
      id: "Universal",
      slug: "universal",
      title: "Sage",
      blurb: "Humanist, open, and gentle—presence over promises.",
    },
  ];
}

export async function getStaticPaths() {
  const list = getPersonasList();
  const slugs = Array.from(new Set((list || []).map((p) => p?.slug).filter(Boolean)));
  const paths = (slugs.length ? slugs : ["universal"]).map((slug) => ({ params: { id: slug } }));
  return { paths, fallback: false }; // required for static export builds
}

export async function getStaticProps({ params }) {
  const slug = params?.id || "universal";
  const list = getPersonasList();
  const persona =
    (list || []).find((p) => p?.slug === slug) ||
    (list || []).find((p) => p?.slug === "universal") ||
    list[0];

  // Guard against undefined
  const safe = persona || {
    id: "Universal",
    slug: "universal",
    title: "Sage",
    blurb: "Humanist, open, and gentle—presence over promises.",
  };

  return { props: { persona: safe } };
}

export default function GuideRoom({ persona }) {
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
