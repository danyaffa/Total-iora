import Link from "next/link";

export default function Home() {
  return (
    <div className="hero rounded-3xl p-8 shadow-sm border">
      <h1 className="text-3xl font-extrabold">AuraCode · Decode Your Energy. Trust Yourself.</h1>
      <p className="mt-3 text-gray-700 max-w-2xl">
        Not science. Not religion. A mirror — of soul, symbol, and story.
        We don’t promise miracles. We offer presence. Leave lighter than you came.
      </p>
      <div className="mt-6 flex gap-3">
        <Link className="btn" href="/get-your-aura">Get Your Aura</Link>
        <Link className="btn" href="/wall">Visit the Aura Wall</Link>
      </div>
      <p className="mt-6 text-xs text-gray-500">
        Disclaimer: Symbolic reflections only. Entertainment & self-reflection; not counseling.
      </p>
    </div>
  );
}
