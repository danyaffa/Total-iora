// FILE: /components/FeatureTiles.js
import Link from "next/link";

export default function FeatureTiles() {
  return (
    <section className="tiles">
      <div className="grid">
        {/* Sacred Notes — first-class feature */}
        <article className="card">
          <header className="h">
            <div className="pill">Sacred Notes</div>
            <h3>Leave a private note • Light a candle</h3>
            <p>
              Your quiet place. Write, cry, pray, whisper. Light a candle. We don’t read or judge.
              <strong> Nothing is stored or kept.</strong>
            </p>
          </header>
          <footer className="f">
            <Link href="/sacred-space" className="btn accent">Open Sacred Notes</Link>
            <div className="disc">
              This is your space. Do whatever you like in this page. We have no responsibility for anything you write,
              and nothing is saved on our servers.
            </div>
          </footer>
        </article>

        {/* Oracle Universe DNA — same size as Sacred Notes */}
        <article className="card">
          <header className="h">
            <div className="pill">Oracle Universe DNA</div>
            <h3>Your personal map • Guidance you can download</h3>
            <p>
              Ask for your future outlook, horoscope-style reflections, and gentle advice woven from your tradition.
              Download your write-up when it’s ready.
            </p>
          </header>
          <footer className="f">
            <Link href="/oracle-universe-dna" className="btn accent">Get Your Oracle Universe DNA</Link>
            <div className="disc">
              Spiritual guidance only. No promises. No medical, legal, or financial advice.
            </div>
          </footer>
        </article>
      </div>

      <style jsx>{`
        .tiles { max-width: 1100px; margin: 10px auto 6px; padding: 0 16px; }
        .grid { display: grid; gap: 14px; grid-template-columns: 1fr; }
        @media (min-width: 900px) { .grid { grid-template-columns: 1fr 1fr; } }
        .card {
          background: #fff; border: 1px solid rgba(15,23,42,.08); border-radius: 20px;
          box-shadow: 0 10px 30px rgba(2,6,23,.08); padding: 18px 18px 14px;
        }
        .pill { display: inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h3 { margin: 8px 0 4px; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
        p { color:#475569; }
        .f { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
        .btn { display:inline-block; padding:12px 18px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); }
        .btn.accent { color:#fff; background: linear-gradient(135deg, #7c3aed, #14b8a6); border:none; }
        .disc { color:#64748b; font-size:.92rem; }
      `}</style>
    </section>
  );
}
