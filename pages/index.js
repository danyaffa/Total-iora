import PathPicker from "../components/PathPicker";
import Link from "next/link";
import { useState, useMemo } from "react";

// The info cards section, to be placed on the homepage
function InfoGrid() {
  return (
    <section className="info-grid">
      <div className="info-card">
        <h3 className="font-bold">Wise Sources</h3>
        <p className="card-text">
          Language inspired by sacred traditions (Psalms, Gospels, Quranic wisdom, Eastern proverbs) — without dogma or promises.
        </p>
      </div>
      <div className="info-card">
        <h3 className="font-bold">Voice-First</h3>
        <p className="card-text">
          Speak in your language. Be heard. Receive a gentle reflection tuned to your path.
        </p>
      </div>
      <div className="info-card">
        <h3 className="font-bold">Your Pace</h3>
        <p className="card-text">
          Free to begin. Optional support: $1/month candles & notes · $9.99 lifetime voice reflections.
        </p>
      </div>
    </section>
  );
}

export default function Home() {
  const [path, setPath] = useState("Universal");

  // This logic applies the background color theme based on the selected path
  const heroClass = useMemo(() => ({
    Jewish: "jewish",
    Christian: "christian",
    Muslim: "muslim",
    Eastern: "eastern",
    Universal: "universal"
  }[path] || "universal"), [path]);

  return (
    <div className="home-container">
      <section className={`hero-section ${heroClass}`}>
        <div className="brand-row">
          <img src="/AuraCode_Logo.png" alt="AuraCode" className="hero-logo" />
          <h1 className="brand-name">AuraCode</h1>
        </div>

        <h2 className="hero-headline">
          Decode Your Energy. Trust Yourself.
        </h2>
        <p className="hero-subheadline">
          Not science. Not religion. A soft mirror of soul, symbol, and story.
          We never promise miracles — we offer presence. Leave lighter than you came.
        </p>

        <div className="path-picker-container">
          <p className="path-picker-prompt">Choose your spiritual heritage (optional)</p>
          <PathPicker value={path} onChange={setPath} />
        </div>

        <div className="action-buttons-container">
          <Link className="btn btn-accent" href={`/get-your-aura?path=${encodeURIComponent(path)}`}>
            Speak to a Mentor
          </Link>
          <Link className="btn btn-soft" href={`/sacred-space?path=${encodeURIComponent(path)}`}>
            Leave a Sacred Note
          </Link>
          <Link className="btn btn-ghost" href="/unlock">Support the Sanctuary</Link>
        </div>

        <p className="disclaimer-text">
          Disclaimer: Symbolic reflections only. For self‑reflection & comfort; not counseling, clergy, or medical advice.
        </p>
      </section>

      <InfoGrid />
    </div>
  );
}
