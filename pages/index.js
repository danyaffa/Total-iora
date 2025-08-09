import PathPicker from "../components/PathPicker";
import Link from "next/link";
import Footer from "../components/Footer";
import { useState, useMemo } from "react";

// The info cards section, built with Tailwind classes
function InfoGrid() {
  const cardClasses = "p-6 rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm";
  const titleClasses = "font-bold text-slate-800";
  const textClasses = "text-sm text-slate-600 mt-2 leading-relaxed";

  return (
    <section className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto px-4">
      <div className={cardClasses}>
        <h3 className={titleClasses}>Wise Sources</h3>
        <p className={textClasses}>
          Language inspired by sacred traditions—without dogma or promises.
        </p>
      </div>
      <div className={cardClasses}>
        <h3 className={titleClasses}>Voice-First</h3>
        <p className={textClasses}>
          Speak in your language. Be heard. Receive a gentle reflection tuned to your path.
        </p>
      </div>
      <div className={cardClasses}>
        <h3 className={titleClasses}>Your Pace</h3>
        <p className={textClasses}>
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

  const btnBase = "inline-block px-5 py-3 rounded-xl font-semibold text-sm shadow-md transition-all duration-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2";
  const btnAccent = `${btnBase} bg-accent text-accent-text hover:brightness-110 focus:ring-accent`;
  const btnSoft = `${btnBase} bg-accent-soft text-accent-dark font-bold hover:bg-opacity-80`;
  const btnGhost = `${btnBase} bg-white/60 backdrop-blur border border-slate-300 text-slate-700 hover:bg-white hover:border-slate-400 shadow-sm`;

  return (
    <div className={`page-container ${heroClass}`}>
      <main className="space-y-16 sm:space-y-20 pb-16">
        <section className="hero-section text-center pt-12 pb-16 px-4">
          <div className="flex flex-col items-center gap-4 mb-8">
            {/* The single logo, now larger but not oversized */}
            <img src="/AuraCode_Logo.png" alt="AuraCode" className="h-20 w-auto" />
          </div>

          {/* Headline with adjusted, smaller size */}
          <h1 className="font-playfair font-bold text-4xl sm:text-5xl text-slate-900">
            Decode Your Energy. Trust Yourself.
          </h1>
          <p className="max-w-xl mx-auto mt-4 text-base sm:text-lg text-slate-600 leading-relaxed">
            Not science. Not religion. A soft mirror of soul, symbol, and story.
            We never promise miracles — we offer presence.
          </p>

          <div className="max-w-3xl mx-auto mt-10">
            <p className="font-semibold mb-4 text-slate-700">Choose your spiritual heritage (optional)</p>
            <PathPicker value={path} onChange={setPath} />
          </div>

          <div className="flex justify-center flex-wrap gap-3 sm:gap-4 mt-8">
            <Link className={btnAccent} href={`/get-your-aura?path=${encodeURIComponent(path)}`}>
              Begin First Session (Free)
            </Link>
            <Link className={btnGhost} href="/unlock">
              Register
            </Link>
          </div>
        </section>

        <InfoGrid />
      </main>
      <Footer />
    </div>
  );
}
