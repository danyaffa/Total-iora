// FILE: /pages/sacred-space.js
import { useState, useEffect } from "react";

/* --- Inline animated candle (no external deps) --- */
function LitCandle() {
  return (
    <div className="candle">
      <svg viewBox="0 0 120 180" className="svg" aria-label="Lit candle">
        <defs>
          <radialGradient id="g" cx="50%" cy="30%" r="60%">
            <stop offset="0%" stopColor="rgba(255,199,73,.7)" />
            <stop offset="100%" stopColor="rgba(255,199,73,0)" />
          </radialGradient>
        </defs>
        <circle cx="60" cy="54" r="44" fill="url(#g)" className="glow" />
        <path
          d="M60 18 C64 28,72 36,70 48 C69 58,61 64,60 64 C59 64,51 58,50 48 C48 36,56 28,60 18 Z"
          className="flame"
        />
        <rect x="58" y="64" width="4" height="10" rx="2" fill="#2b2b2b" />
        <rect x="36" y="72" width="48" height="78" rx="8" className="wax" />
        <ellipse cx="60" cy="154" rx="42" ry="8" className="plate" />
      </svg>
      <style jsx>{`
        .candle { width: 140px; height: 180px; position: relative; }
        .svg { width: 100%; height: 100%; overflow: visible; }
        .glow { animation: pulse 2.2s ease-in-out infinite; }
        .flame {
          fill: #ffc749;
          filter: drop-shadow(0 0 10px rgba(255,199,73,0.8))
                  drop-shadow(0 0 25px rgba(255,199,73,0.6));
          transform-origin: 60px 54px;
          animation: flicker .12s infinite alternate ease-in-out;
        }
        .wax { fill: #fff6ed; stroke: #f1e4d6; stroke-width: 1; }
        .plate { fill: #cfd8e3; }
        @keyframes flicker { from { transform: skewX(-1deg) translateX(-.5px); } to { transform: skewX(1deg) translateX(.5px); } }
        @keyframes pulse { 0%,100% { opacity:.65; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}

const templates = [
  { key: "children", text: "May my children grow in wisdom and light." },
  { key: "healing", text: "Please bring healing to my body and calm to my spirit." },
  { key: "love", text: "Help me find a love that sees my soul." },
  { key: "purpose", text: "Guide my steps toward the work that is truly mine." },
  { key: "peace", text: "Grant peace to my home and those I love." },
];

export default function SacredSpace() {
  const [locked, setLocked] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState("");
  const [candleLit, setCandleLit] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/whoami", { credentials: "include" });
        setLocked(!r.ok);
      } catch { 
        setLocked(true); 
      }
    })();
  }, []);

  // fade status
  useEffect(() => {
    if (!status) return;
    const t = setTimeout(() => setStatus(""), 6000);
    return () => clearTimeout(t);
  }, [status]);

  // LOCAL-ONLY save (no network, nothing stored)
  function save(type) {
    const isCandle = type === "candle";
    setSaving(true);

    if (isCandle) setCandleLit(true); // instant visual feedback

    // small UX delay so buttons show their loading state briefly
    setTimeout(() => {
      if (isCandle) {
        setStatus("A candle has been lit for your intention.");
        // keep candle visible for 12s
        setTimeout(() => setCandleLit(false), 12000);
      } else {
        if (note.trim()) {
          setStatus("Your intention rests here in silence.");
          setNote("");
        } else {
          setStatus("Please write your note first.");
        }
      }
      setSaving(false);
    }, 350);
  }

  return (
    <div className="wrap">
      <header className="hero">
        <h1>The Sanctuary</h1>
        <p>Leave a private note. Light a candle. We don’t read or judge; we hold space.</p>
      </header>

      <main className="card" inert={locked ? "" : undefined} aria-disabled={locked ? "true" : "false"}>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          rows={5}
          placeholder="Write your note here…"
          className="ta"
          disabled={locked}
        />
        <div className="templates">
          <span>Templates:</span>
          {templates.map((t) => (
            <button
              key={t.key}
              className="chip"
              onClick={() => setNote(t.text)}
              type="button"
              disabled={locked}
            >
              {t.key}
            </button>
          ))}
        </div>

        <div className="actions">
          <button
            className="btn soft"
            onClick={() => save("note")}
            disabled={locked || saving}
            type="button"
          >
            {saving ? "Saving…" : "Place Note"}
          </button>
          <button
            className="btn accent"
            onClick={() => save("candle")}
            disabled={locked || saving}
            type="button"
          >
            {saving ? "Lighting…" : "Light a Candle"}
          </button>
        </div>

        {locked && <div className="lockhint">Log in to use this page.</div>}

        {status && <div className="status">{status}</div>}

        {candleLit && (
          <div className="candleArea">
            <LitCandle />
            <p>A candle has been lit for your intention.</p>
          </div>
        )}

        <p className="privacy">
          This is your space. You can do whatever you like to do here. We have no responsibility for anything you write,
          and <strong>nothing is kept or saved</strong>; everything stays on your device and clears when you refresh.
        </p>
      </main>

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          padding: 40px 16px 60px;
          background:
            radial-gradient(1200px 600px at 10% -10%, #eef2ff 0%, transparent 60%),
            radial-gradient(900px 500px at 90% 0%, #ecfeff 0%, transparent 60%),
            linear-gradient(180deg, #ffffff, #f8fafc);
        }
        .hero { text-align: center; margin-bottom: 16px; }
        .hero h1 { font-size: 2.2rem; margin: 0; color: #0f172a; letter-spacing: .3px; }
        .hero p { margin-top: 8px; color: #475569; }
        .card {
          max-width: 860px;
          margin: 0 auto;
          background: rgba(255,255,255,.86);
          border: 1px solid rgba(15,23,42,.08);
          box-shadow: 0 10px 30px rgba(2,6,23,.08);
          border-radius: 20px;
          padding: 22px 20px;
          backdrop-filter: blur(6px);
        }
        .ta {
          width: 100%;
          resize: vertical;
          border-radius: 14px;
          padding: 14px 16px;
          border: 1px solid #e2e8f0;
          font-size: 1rem;
          line-height: 1.5;
          outline: none;
          transition: box-shadow .15s, border-color .15s;
        }
        .ta:focus {
          border-color: #a5b4fc;
          box-shadow: 0 0 0 4px rgba(99,102,241,.15);
        }
        .templates {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
          margin: 10px 2px 0;
          color: #64748b;
          font-size: .92rem;
        }
        .templates span { margin-right: 6px; }
        .chip {
          border: 1px solid #e2e8f0;
          background: #fff;
          padding: 8px 12px;
          border-radius: 999px;
          cursor: pointer;
          transition: transform .08s, box-shadow .15s;
          text-transform: capitalize;
        }
        .chip:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(2,6,23,.08); }
        .actions {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
          justify-content: center;
          margin: 16px 0 4px;
        }
        .btn {
          padding: 12px 18px;
          border-radius: 14px;
          font-weight: 700;
          border: 1px solid rgba(15,23,42,.08);
          cursor: pointer;
          transition: transform .06s ease, box-shadow .15s ease, background .2s;
        }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .btn.soft { background: #ffffff; }
        .btn.soft:hover { box-shadow: 0 6px 20px rgba(2,6,23,.08); transform: translateY(-1px); }
        .btn.accent {
          color: #fff;
          background: linear-gradient(135deg, #6366f1, #14b8a6);
          border: none;
        }
        .btn.accent:hover { filter: brightness(1.06); transform: translateY(-1px); }
        .status {
          text-align: center;
          margin-top: 10px;
          color: #334155;
          font-size: .98rem;
        }
        .candleArea {
          display: grid;
          place-items: center;
          text-align: center;
          margin-top: 8px;
          padding: 10px 0 0;
          animation: fadeIn .3s ease;
        }
        .candleArea p { margin: 8px 0 0; color: #334155; font-weight: 600; }
        .privacy {
          margin-top: 18px;
          text-align: center;
          font-size: .88rem;
          color: #94a3b8;
        }
        .lockhint { margin-top:10px; text-align:center; color:#713f12; background:#fffbe6; border:1px solid #facc15; border-radius:10px; padding:8px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity:1; transform:none; } }
      `}</style>
    </div>
  );
}
