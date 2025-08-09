import PathPicker from "../components/PathPicker";
import Link from "next/link";
import { useState, useMemo } from "react";

// The info cards section from the original page, now as a separate component
function InfoGrid() {
  return (
    <section className="info-grid max-w-5xl mx-auto">
      <div className="card">
        <h3 className="font-bold">Wise Sources</h3>
        <p className="text-sm text-gray-700 mt-1">
          Language inspired by sacred traditions (Psalms, Gospels, Quranic wisdom, Eastern proverbs) — without dogma or promises.
        </p>
      </div>
      <div className="card">
        <h3 className="font-bold">Voice‑First</h3>
        <p className="text-sm text-gray-700 mt-1">
          Speak in your language. Be heard. Receive a gentle reflection tuned to your path.
        </p>
      </div>
      <div className="card">
        <h3 className="font-bold">Your Pace</h3>
        <p className="text-sm text-gray-700 mt-1">
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
    <div className="space-y-20">
      <section className={`hero-section ${heroClass}`}>
        <div className="brand-row">
          <img src="/AuraCode_Logo.png" alt="AuraCode" className="hero-logo" />
          <span className="brand-name">AURACODE</span>
        </div>

        <h1 className="hero-headline">
          Decode Your Energy. Trust Yourself.
        </h1>
        <p className="hero-subheadline">
          Not science. Not religion. A soft mirror of soul, symbol, and story.
          We never promise miracles — we offer presence. Leave lighter than you came.
        </p>

        <div className="path-picker-container">
          <p className="font-semibold mb-3 text-gray-800">Choose your spiritual heritage (optional)</p>
          <PathPicker value={path} onChange={setPath} />
        </div>

        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link className="btn btn-accent" href={`/get-your-aura?path=${encodeURIComponent(path)}`}>
            Speak to a Mentor
          </Link>
          <Link className="btn btn-soft" href={`/sacred-space?path=${encodeURIComponent(path)}`}>
            Leave a Sacred Note
          </Link>
          <Link className="btn ghost" href="/unlock">Support the Sanctuary</Link>
        </div>

        <p className="mt-10 text-xs text-gray-500 max-w-md mx-auto">
          Disclaimer: Symbolic reflections only. For self‑reflection & comfort; not counseling, clergy, or medical advice.
        </p>
      </section>

      <InfoGrid />
    </div>
  );
}
