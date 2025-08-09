// FILE: /pages/index.js
import Link from "next/link";
import { useState } from "react";
import PathPicker from "../components/PathPicker";

export default function Home() {
  const [path, setPath] = useState("Universal");

  return (
    <div className="relative">
      {/* Hero */}
      <section className="w-full">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-10 pb-8 sm:pt-16 sm:pb-12">
          {/* Brand (right-sized) */}
          <div className="flex items-center justify-center gap-4 mb-6">
            <img
              src="/AuraCode_Logo.png"
              alt="AuraCode"
              className="h-14 sm:h-20 w-auto select-none"
              draggable="false"
            />
            <h1 className="font-extrabold tracking-tight text-slate-900 text-3xl sm:text-5xl">
              AuraCode
            </h1>
          </div>

          {/* Headline */}
          <h2 className="text-center text-slate-800 font-semibold text-xl sm:text-2xl">
            Decode Your Energy. Trust Yourself.
          </h2>
          <p className="text-center text-slate-600 max-w-2xl mx-auto mt-3 leading-relaxed">
            Not science. Not religion. A soft mirror of soul, symbol, and story.
            We never promise miracles — we offer presence.
          </p>

          {/* Path picker */}
          <div className="max-w-4xl mx-auto mt-8">
            <p className="text-center text-sm text-slate-500 mb-3">
              Choose your spiritual heritage (optional)
            </p>
            <PathPicker value={path} onChange={setPath} />
          </div>

          {/* CTAs */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <Link
              href="/get-your-aura"
              className="btn btn-accent"
            >
              Begin First Session (Free)
            </Link>
            <Link
              href="/unlock"
              className="btn btn-ghost"
            >
              Register
            </Link>
          </div>
        </div>
      </section>

      {/* Info cards */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-12">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6">
            <h3 className="font-bold text-slate-800">Wise Sources</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Language inspired by sacred traditions—without dogma or promises.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6">
            <h3 className="font-bold text-slate-800">Voice-First</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Speak in your language. Be heard. Receive a gentle reflection tuned to your path.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white/80 backdrop-blur-sm p-6">
            <h3 className="font-bold text-slate-800">Your Pace</h3>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed">
              Your first session is free. Optional support for more.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
