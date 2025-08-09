// ✅ FILE: /pages/index.js

import Link from "next/link";
import Image from "next/image";
import { Candle, StarOfDavid, Cross, Crescent, Om } from "../components/Icons";
import PathPicker from "../components/PathPicker";
import { useState } from "react";

function SacredHint({ path }) {
  const map = {
    Jewish:    { place: "Western Wall", icon: <StarOfDavid className="text-gray-700" /> },
    Christian: { place: "Cathedral",    icon: <Cross className="text-gray-700" /> },
    Muslim:    { place: "Mecca",        icon: <Crescent className="text-gray-700" /> },
    Eastern:   { place: "Temple",       icon: <Om className="text-gray-700" /> },
    Universal: { place: "Sanctuary",    icon: <Candle className="text-gray-700" /> },
  };
  const m = map[path || "Universal"];
  return (
    <p className="text-sm text-gray-600 flex items-center gap-2">
      {m.icon} Your session will feel like sitting quietly in a {m.place}.
    </p>
  );
}

export default function Home() {
  const [path, setPath] = useState("Universal");

  return (
    <div className="grid gap-8">
      <section className="hero rounded-3xl p-8 shadow-sm border">
        {/* ✅ Logo */}
        <div className="mb-6">
          <Image 
            src="/AuraCode_Logo.png" 
            alt="AuraCode Logo" 
            width={180} 
            height={60} 
            priority
          />
        </div>

        <h1 className="text-4xl font-extrabold leading-tight max-w-3xl">
          AuraCode · Decode Your Energy. <span className="block">Trust Yourself.</span>
        </h1>
        <p className="mt-3 text-gray-700 max-w-2xl">
          Not science. Not religion. A gentle mirror of soul, symbol, and story.
          We don’t promise miracles. We offer presence. Leave lighter than you came.
        </p>

        <div className="mt-6">
          <div className="text-sm font-semibold mb-2">Choose your spiritual heritage (optional)</div>
          <PathPicker value={path} onChange={setPath} />
          <div className="mt-3"><SacredHint path={path} /></div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="btn" href={`/get-your-aura?path=${encodeURIComponent(path)}`}>Speak to a Mentor</Link>
          <Link className="btn" href={`/sacred-space?path=${encodeURIComponent(path)}`}>Leave a Sacred Note</Link>
          <Link className="btn" href="/unlock">Support the Sanctuary</Link>
        </div>

        <p className="mt-6 text-xs text-gray-500">
          Disclaimer: Symbolic reflections only. For self-reflection & comfort; not counseling, clergy, or medical advice.
        </p>
      </section>

      <section className="grid md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border bg-white/70">
          <h3 className="font-bold">Wise Sources</h3>
          <p className="text-sm text-gray-600 mt-1">
            Reflections weave language from sacred traditions (Psalms, Gospels, Quranic wisdom, Eastern proverbs) — without declaring dogma.
          </p>
        </div>
        <div className="p-5 rounded-2xl border bg-white/70">
          <h3 className="font-bold">Voice-First</h3>
          <p className="text-sm text-gray-600 mt-1">Speak. Be heard. Receive a gentle, faith-aware response in your language.</p>
        </div>
        <div className="p-5 rounded-2xl border bg-white/70">
          <h3 className="font-bold">Your Pace</h3>
          <p className="text-sm text-gray-600 mt-1">Free to begin. Optional support: $1/month candles & notes · $9.99 lifetime voice reflections.</p>
        </div>
      </section>
    </div>
  );
}
