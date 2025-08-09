// FILE: /pages/index.js
import Link from "next/link";
import { useState, useMemo } from "react";
import PathPicker from "../components/PathPicker";

export default function Home() {
  const [path, setPath] = useState("Universal");

  const heroClass = useMemo(() => ({
    Jewish: "theme-jewish",
    Christian: "theme-christian",
    Muslim: "theme-muslim",
    Eastern: "theme-eastern",
    Universal: "theme-universal"
  }[path] || "theme-universal"), [path]);

  return (
    <div className={`page-container ${heroClass}`}>
      <main className="page-main">
        {/* Hero */}
        <section className="hero-section">
          <div className="brand">
            <img src="/AuraCode_Logo.png" alt="AuraCode" className="brand-logo" />
            <h1 className="brand-name">AuraCode</h1>
          </div>

          <h2 className="headline">Decode Your Energy. Trust Yourself.</h2>
          <p className="subhead">
            Not science. Not religion. A soft mirror of soul, symbol, and story.
            We never promise miracles — we offer presence.
          </p>

          <div className="path-picker">
            <p className="path-label">Choose your spiritual heritage (optional)</p>
            <PathPicker value={path} onChange={setPath} />
          </div>

          <div className="cta-row">
            <Link className="btn btn-accent" href={`/get-your-aura?path=${encodeURIComponent(path)}`}>
              Begin First Session (Free)
            </Link>
            <Link className="btn btn-ghost" href="/unlock">
              Register
            </Link>
          </div>
        </section>

        {/* Info grid */}
        <section className="info-grid">
          <div className="card">
            <h3 className="card-title">Wise Sources</h3>
            <p className="card-text">
              Language inspired by sacred traditions—without dogma or promises.
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">Voice-First</h3>
            <p className="card-text">
              Speak in your language. Be heard. Receive a gentle reflection tuned to your path.
            </p>
          </div>
          <div className="card">
            <h3 className="card-title">Your Pace</h3>
            <p className="card-text">
              Your first session is free. Optional support for more.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}
