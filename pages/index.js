import Link from "next/link";
import Image from "next/image";
import { Candle, StarOfDavid, Cross, Crescent, Om } from "../components/Icons";
import PathPicker from "../components/PathPicker";
import { useState, useMemo } from "react";

function SacredHint({ path }){
  const map = {
    Muslim:    { place:"Mecca",            icon:<Crescent className="text-gray-700 icon" /> },
    Christian: { place:"a Cathedral",      icon:<Cross className="text-gray-700 icon" /> },
    Eastern:   { place:"a Temple",         icon:<Om className="text-gray-700 icon" /> },
    Jewish:    { place:"the Western Wall", icon:<StarOfDavid className="text-gray-700 icon" /> },
    Universal: { place:"a Sanctuary",      icon:<Candle className="text-gray-700 icon" /> },
  };
  const m = map[path||"Universal"];
  return (
    <p className="text-sm text-gray-700 flex items-center gap-2 mt-2">
      {m.icon} Your session will feel like sitting quietly in {m.place}.
    </p>
  );
}

export default function Home(){
  const [path, setPath] = useState("Universal");
  const heroClass = useMemo(()=>({
    Jewish:"jewish",
    Christian:"christian",
    Muslim:"muslim",
    Eastern:"eastern",
    Universal:"universal"
  }[path] || "universal"), [path]);

  return (
    <div className="grid gap-10">
      <section className={`hero ${heroClass}`}>
        {/* Brand row with correctly-proportioned logo */}
        <div className="brand-row">
          <img src="/AuraCode_Logo.png" alt="AuraCode" className="brand-logo" />
          <span className="brand-name">Auracode</span>
          <span className="accent-chip">Gentle • Faith‑aware • Voice‑first</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold leading-tight max-w-3xl">
          Decode Your Energy. <span className="block">Trust Yourself.</span>
        </h1>
        <p className="mt-3 text-gray-700 max-w-2xl">
          Not science. Not religion. A soft mirror of soul, symbol, and story.
          We never promise miracles — we offer presence. Leave lighter than you came.
        </p>

        <div className="mt-6">
          <div className="text-sm font-semibold mb-2">Choose your spiritual heritage (optional)</div>
          <PathPicker value={path} onChange={setPath}/>
          <SacredHint path={path}/>
        </div>

        <div className="mt-8 flex flex-wrap gap-10">
          <Link className="btn btn-accent" href={`/get-your-aura?path=${encodeURIComponent(path)}`}>Speak to a Mentor</Link>
          <Link className="btn btn-soft" href={`/sacred-space?path=${encodeURIComponent(path)}`}>Leave a Sacred Note</Link>
          <Link className="btn ghost" href="/unlock">Support the Sanctuary</Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Disclaimer: Symbolic reflections only. For self‑reflection & comfort; not counseling, clergy, or medical advice.
        </p>
      </section>

      <section className="info-grid">
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
    </div>
  );
}
