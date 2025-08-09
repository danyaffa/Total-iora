import Link from "next/link";
import Footer from "../components/Footer";
import PathPicker from "../components/PathPicker";
import { useState, useMemo } from "react";

// The info cards section
function InfoGrid() {
  return (
    <section className="info-grid">
      <div className="info-card">
        <h3 className="card-title">Wise Sources</h3>
        <p className="card-text">
          Language inspired by sacred traditions—without dogma or promises.
        </p>
      </div>
      <div className="info-card">
        <h3 className="card-title">Voice-First</h3>
        <p className="card-text">
          Speak in your language. Be heard. Receive a gentle reflection.
        </p>
      </div>
      <div className="info-card">
        <h3 className="card-title">Your Pace</h3>
        <p className="card-text">
          Your first session is free. Optional support for more.
        </p>
      </div>
    </section>
  );
}

// Main Homepage Component
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
    <>
      <div className={`page-container ${heroClass}`}>
        <main className="main-content">
          <section className="hero-section">
            <div className="brand-row">
              <img src="/AuraCode_Logo.png" alt="AuraCode" className="hero-logo" />
            </div>

            <h1 className="hero-headline">
              Decode Your Energy. Trust Yourself.
            </h1>
            <p className="hero-subheadline">
              Not science. Not religion. A soft mirror of soul, symbol, and story.
            </p>

            <div className="path-picker-container">
              <p className="path-picker-prompt">Choose your spiritual heritage (optional)</p>
              <PathPicker value={path} onChange={setPath} />
            </div>

            <div className="action-buttons-container">
              <Link className="btn btn-accent" href={`/get-your-aura?path=${encodeURIComponent(path)}`}>
                Begin First Session (Free)
              </Link>
              <Link className="btn btn-ghost" href="/unlock">
                Register
              </Link>
            </div>
          </section>

          <InfoGrid />
        </main>
        <Footer />
      </div>

      {/* All necessary styles are embedded here to guarantee they load */}
      <style jsx global>{`
        /* FONT IMPORT */
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Playfair+Display:wght@700;900&display=swap');
        
        /* BASE & RESET */
        html, body {
          padding: 0;
          margin: 0;
          font-family: 'Inter', sans-serif;
          background-color: #f8fafc;
          color: #334155;
        }
        * {
          box-sizing: border-box;
        }
        a {
          color: inherit;
          text-decoration: none;
        }

        /* PAGE LAYOUT */
        .page-container {
          display: flex;
          flex-direction: column;
          min-height: 100vh;
        }
        .main-content {
          flex-grow: 1;
          display: flex;
          flex-direction: column;
          gap: 4rem;
          padding-bottom: 4rem;
        }

        /* HERO SECTION */
        .hero-section {
          text-align: center;
          padding: 2rem 1.5rem 3rem;
          transition: background .5s ease;
          background: radial-gradient(ellipse at 50% 0%, var(--accent-soft) 0%, #f8fafc 70%);
        }
        .brand-row {
          margin-bottom: 2rem;
        }
        .hero-logo {
          height: 72px; /* Adjusted logo size */
          width: auto;
          margin: 0 auto;
        }
        .hero-headline {
          font-family: 'Playfair Display', serif;
          font-weight: 700;
          font-size: clamp(2.5rem, 6vw, 4rem); /* Adjusted headline size */
          line-height: 1.15;
          color: #1e293b;
          margin: 0;
        }
        .hero-subheadline {
          font-size: 1.1rem;
          max-width: 32rem;
          margin: 1rem auto 0;
          color: #475569;
          line-height: 1.6;
        }

        /* PATH PICKER */
        .path-picker-container {
          max-width: 48rem;
          margin: 2.5rem auto 0;
        }
        .path-picker-prompt {
          font-weight: 600;
          margin-bottom: 1rem;
          color: #1e293b;
        }
        .action-buttons-container {
          display: flex;
          justify-content: center;
          flex-wrap: wrap;
          gap: 1rem;
          margin-top: 2.5rem;
        }

        /* THEME COLORS */
        .page-container { --accent: #64748b; --accent-soft: #f1f5f9; --accent-text: #ffffff; --accent-dark: #475569; }
        .theme-jewish { --accent:#1f6fff; --accent-soft:#eaf0ff; --accent-text:#ffffff; --accent-dark:#1e40af; }
        .theme-christian { --accent:#c62828; --accent-soft:#fdeaea; --accent-text:#ffffff; --accent-dark:#991b1b; }
        .theme-muslim { --accent:#D4AF37; --accent-soft:#fff9e3; --accent-text:#3a2a00; --accent-dark:#8c6f1d; }
        .theme-eastern { --accent:#ff8f00; --accent-soft:#fff2df; --accent-text:#ffffff; --accent-dark:#b45309; }

        /* BUTTONS */
        .btn {
          display: inline-block;
          padding: 0.8rem 1.6rem;
          border-radius: 0.75rem;
          font-weight: 600;
          font-size: 0.9rem;
          border: 1px solid transparent;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05), 0 2px 4px rgba(0,0,0,0.05);
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 5px 12px -2px rgba(0,0,0,0.1);
        }
        .btn:active {
          transform: translateY(0px) scale(0.98);
        }
        .btn-accent {
          background-color: var(--accent);
          color: var(--accent-text);
          box-shadow: 0 4px 14px -4px color-mix(in srgb, var(--accent) 50%, transparent);
        }
        .btn-accent:hover {
          filter: brightness(1.1);
        }
        .btn-ghost {
          background-color: #ffffff99;
          backdrop-filter: blur(4px);
          border-color: #e2e8f0;
          color: #475569;
        }
        .btn-ghost:hover {
          background-color: #ffffff;
          border-color: #cbd5e1;
        }

        /* PATH TILES */
        .path-tile {
          border-radius: 1rem;
          border: 1px solid #e2e8f0;
          background-color: #ffffffcc;
          backdrop-filter: blur(4px);
          padding: 1rem;
          text-align: left;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        .path-tile:hover {
          transform: translateY(-3px);
          box-shadow: 0 8px 25px -5px rgba(0,0,0,0.08);
        }
        .path-tile.active {
          border-color: var(--accent);
          box-shadow: 0 0 0 3px color-mix(in srgb, var(--accent) 25%, transparent);
        }
        .path-title {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: 700;
        }
        .path-title + div {
          font-size: 0.75rem;
          color: #64748b;
          margin-top: 0.25rem;
        }

        /* INFO GRID */
        .info-grid {
          display: grid;
          grid-template-columns: repeat(1, minmax(0, 1fr));
          gap: 1.5rem;
          max-width: 52rem;
          margin: 0 auto;
          padding: 0 1.5rem;
        }
        .info-card {
          padding: 1.5rem;
          border-radius: 1.125rem;
          border: 1px solid #e2e8f0;
          background-color: #ffffff;
        }
        .card-title {
          font-weight: 700;
          color: #1e293b;
          margin: 0;
        }
        .card-text {
          font-size: 0.875rem;
          color: #475569;
          margin-top: 0.5rem;
          line-height: 1.6;
        }
        @media (min-width: 768px) {
          .info-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
            max-width: 64rem;
          }
        }
      `}</style>
    </>
  );
}

