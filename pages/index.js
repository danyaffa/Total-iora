// FILE: /pages/index.js
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

// Simple voice chat using the Web Speech API + our /api/auracode-chat endpoint.
// - Tap Mic → speak → we transcribe → send to API → speak reply.
function ChatGPTVoice({ path }) {
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");
  const recRef = useRef(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;

    rec.onresult = (e) => {
      let final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        final += e.results[i][0].transcript;
      }
      setTranscript(final.trim());
    };

    rec.onend = async () => {
      setListening(false);
      const text = transcript.trim();
      if (!text) return;

      try {
        const r = await fetch("/api/auracode-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, path }),
        });
        const data = await r.json();
        const msg = data?.reply || "I’m here with you.";
        setReply(msg);

        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(msg);
          u.rate = 1;
          u.pitch = 1;
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      } catch {
        setReply("Connection issue. Please try again.");
      }
    };

    recRef.current = rec;
  }, [path, transcript]);

  const start = () => {
    if (!recRef.current) {
      alert("Voice not supported on this browser. Try Chrome.");
      return;
    }
    setTranscript("");
    setReply("");
    setListening(true);
    try {
      recRef.current.start();
    } catch {
      // ignore double-start errors
    }
  };

  const stop = () => {
    try {
      recRef.current?.stop();
    } catch {}
    setListening(false);
  };

  return (
    <div className="voice-box">
      <div className="voice-row">
        <button
          className={`btn ${listening ? "btn-accent" : "btn-ghost"}`}
          onClick={listening ? stop : start}
        >
          {listening ? "⏹ Stop" : "🎙️ ChatGPT Voice"}
        </button>
        <span className={`mic-dot ${listening ? "on" : ""}`} />
      </div>
      <div className="voice-log">
        {transcript && (
          <div className="log user">
            <strong>You:</strong> {transcript}
          </div>
        )}
        {reply && (
          <div className="log guide">
            <strong>Guide:</strong> {reply}
          </div>
        )}
      </div>

      <style jsx>{`
        .voice-box {
          max-width: 760px;
          margin: 18px auto 0;
        }
        .voice-row {
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
        }
        .mic-dot {
          width: 10px;
          height: 10px;
          border-radius: 999px;
          background: #cbd5e1;
          transition: background 0.2s ease, box-shadow 0.2s ease;
        }
        .mic-dot.on {
          background: #16a34a;
          box-shadow: 0 0 0 6px rgba(22, 163, 74, 0.15);
        }
        .voice-log {
          margin-top: 12px;
          text-align: left;
          background: rgba(255, 255, 255, 0.85);
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
        }
        .log {
          padding: 6px 0;
          line-height: 1.55;
        }
        .log + .log {
          border-top: 1px dashed #e5e7eb;
        }
        .log.user strong {
          color: #0f172a;
        }
        .log.guide strong {
          color: #334155;
        }
      `}</style>
    </div>
  );
}

export default function Home() {
  const [path, setPath] = useState("Universal");

  const themeClass = useMemo(
    () =>
      ({
        Jewish: "theme-jewish",
        Christian: "theme-christian",
        Muslim: "theme-muslim",
        Eastern: "theme-eastern",
        Universal: "theme-universal",
      }[path] || "theme-universal"),
    [path]
  );

  const paths = [
    {
      id: "Muslim",
      title: "Muslim",
      sub: "Quranic light • Sufi wisdom",
      style: { borderColor: "#16a34a", background: "rgba(22,163,74,0.06)" },
    },
    {
      id: "Christian",
      title: "Christian",
      sub: "Gospels • Fathers • Saints",
      style: { borderColor: "#dc2626", background: "rgba(220,38,38,0.06)" },
    },
    {
      id: "Jewish",
      title: "Jewish",
      sub: "Kabbalah • Psalms • Sages",
      style: { borderColor: "#3b82f6", background: "rgba(59,130,246,0.06)" },
    },
    {
      id: "Eastern",
      title: "Eastern",
      sub: "Buddhist • Tao • Veda",
      style: { borderColor: "#ea580c", background: "rgba(234,88,12,0.06)" },
    },
    {
      id: "Universal",
      title: "Universal",
      sub: "Humanist • Open • Gentle",
      style: { borderColor: "#6366f1", background: "rgba(99,102,241,0.06)" },
    },
  ];

  return (
    <div className={`page-container ${themeClass}`}>
      {/* Top nav (Header removed project-wide) */}
      <div className="topbar">
        <Link href="/" className="brand-mini">
          <img src="/AuraCode_Logo.png" alt="AuraCode" />
          <span>AuraCode</span>
        </Link>
        <nav className="toplinks">
          <Link href="/get-your-aura" className="link">Begin</Link>
          <Link href="/sacred-space" className="link">Sacred Notes</Link>
          <Link href="/unlock" className="btn btn-accent">Support</Link>
        </nav>
      </div>

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

          {/* Path selection */}
          <div className="paths">
            <p className="path-label">Choose your spiritual heritage (optional)</p>
            <div className="pill-grid">
              {paths.map((p) => (
                <button
                  key={p.id}
                  className={`pill ${path === p.id ? "active" : ""}`}
                  style={p.style}
                  onClick={() => setPath(p.id)}
                >
                  <div className="pill-title">{p.title}</div>
                  <div className="pill-sub">{p.sub}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Primary CTAs */}
          <div className="cta-row">
            <Link className="btn btn-accent" href={`/get-your-aura?path=${encodeURIComponent(path)}`}>
              Begin First Session (Free)
            </Link>
            <Link className="btn btn-ghost" href="/unlock">
              Register
            </Link>
          </div>

          {/* Voice */}
          <ChatGPTVoice path={path} />
        </section>

        {/* Info cards */}
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

      {/* page-local styles for nav + pills (keeps globals.css untouched) */}
      <style jsx>{`
        .topbar {
          position: sticky;
          top: 0;
          z-index: 40;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.7);
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 14px;
        }
        .brand-mini {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: #0f172a;
        }
        .brand-mini img { height: 28px; width: auto; }
        .toplinks { display: flex; align-items: center; gap: 10px; }
        .toplinks .link { font-weight: 600; color: #475569; }
        .toplinks .link:hover { color: #0f172a; }

        .paths { max-width: 980px; margin: 20px auto 0; }
        .pill-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 10px;
        }
        @media (min-width: 600px) {
          .pill-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (min-width: 900px) {
          .pill-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
        }
        .pill {
          text-align: left;
          border: 2px solid #e2e8f0;
          border-radius: 16px;
          padding: 12px 14px;
          font-weight: 600;
          background: #fff;
          transition: transform 0.08s ease, box-shadow 0.15s ease, background 0.2s ease;
        }
        .pill:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(2,6,23,.08); }
        .pill.active { box-shadow: 0 0 0 4px rgba(15,23,42,0.06) inset; }
        .pill-title { font-weight: 800; }
        .pill-sub { font-weight: 500; opacity: 0.7; margin-top: 2px; font-size: 0.9rem; }
      `}</style>
    </div>
  );
}
