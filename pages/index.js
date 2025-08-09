// FILE: /pages/index.js
import Link from "next/link";
import { useMemo, useState, useEffect, useRef } from "react";

/* ------------ Minimal Voice (kept) ------------ */
function ChatGPTVoice({ path }) {
  const [on, setOn] = useState(false);
  const [you, setYou] = useState("");
  const [reply, setReply] = useState("");
  const recRef = useRef(null);

  useEffect(() => {
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      let t = "";
      for (let i = e.resultIndex; i < e.results.length; i++) t += e.results[i][0].transcript;
      setYou(t.trim());
    };
    rec.onend = async () => {
      setOn(false);
      const text = you.trim();
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
        if ("speechSynthesis" in window) {
          const u = new SpeechSynthesisUtterance(msg);
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        }
      } catch {
        setReply("Connection issue. Please try again.");
      }
    };
    recRef.current = rec;
  }, [path, you]);

  const toggle = () => {
    if (!recRef.current) return alert("Voice not supported on this browser.");
    setYou(""); setReply("");
    setOn((v) => {
      if (v) recRef.current.stop();
      else try { recRef.current.start(); } catch {}
      return !v;
    });
  };

  return (
    <div className="voice">
      <button className={`btn ${on ? "btn-accent" : "btn-ghost"}`} onClick={toggle}>
        {on ? "⏹ Stop" : "🎙️ ChatGPT Voice"}
      </button>
      {(you || reply) && (
        <div className="voice-log">
          {you && <div><b>You:</b> {you}</div>}
          {reply && <div><b>Guide:</b> {reply}</div>}
        </div>
      )}
    </div>
  );
}

/* ------------ Page ------------ */
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
    { id: "Muslim", title: "Muslim", sub: "Quranic light • Sufi wisdom", c: "#16a34a" },
    { id: "Christian", title: "Christian", sub: "Gospels • Fathers • Saints", c: "#dc2626" },
    { id: "Jewish", title: "Jewish", sub: "Kabbalah • Psalms • Sages", c: "#3b82f6" },
    { id: "Eastern", title: "Eastern", sub: "Buddhist • Tao • Veda", c: "#ea580c" },
    { id: "Universal", title: "Universal", sub: "Humanist • Open • Gentle", c: "#6366f1" },
  ];

  return (
    <div id="auracode-app" className={`page ${themeClass}`}>
      {/* HIDE ANY ROGUE SIBLINGS ABOVE OUR PAGE */}
      <style jsx global>{`
        #__next > :not(#auracode-app) { display: none !important; }
      `}</style>

      {/* Top inline nav */}
      <div className="topbar">
        <div className="brand-mini">AuraCode</div>
        <nav className="links">
          <Link href="/get-your-aura">Begin</Link>
          <Link href="/sacred-space">Sacred Notes</Link>
          <Link href="/unlock" className="btn btn-accent">Support</Link>
        </nav>
      </div>

      {/* ONE normal-sized hero */}
      <section className="hero">
        <div className="mark">
          <img src="/AuraCode_Logo.png" alt="AuraCode Logo Mark" />
          <h1>AuraCode</h1>
        </div>
        <h2>Decode Your Energy. Trust Yourself.</h2>
        <p className="sub">
          Not science. Not religion. A soft mirror of soul, symbol, and story. We never promise
          miracles — we offer presence.
        </p>

        {/* Paths */}
        <div className="paths">
          <p className="pick">Choose your spiritual heritage (optional)</p>
          <div className="grid">
            {paths.map((p) => (
              <button
                key={p.id}
                onClick={() => setPath(p.id)}
                className={`pill ${path === p.id ? "on" : ""}`}
                style={{ borderColor: p.c, background: `${p.c}1a` /* ~6% */ }}
              >
                <div className="t">{p.title}</div>
                <div className="s">{p.sub}</div>
              </button>
            ))}
          </div>
        </div>

        {/* CTAs */}
        <div className="cta">
          <Link className="btn btn-accent" href={`/get-your-aura?path=${encodeURIComponent(path)}`}>
            Begin First Session (Free)
          </Link>
          <Link className="btn btn-ghost" href="/unlock">Register</Link>
        </div>

        {/* Voice */}
        <ChatGPTVoice path={path} />
      </section>

      {/* Local styles */}
      <style jsx>{`
        .topbar { position: sticky; top: 0; z-index: 10; display:flex; justify-content:space-between; align-items:center;
          padding:10px 14px; background:rgba(255,255,255,.7); backdrop-filter: blur(8px); border-bottom:1px solid #e2e8f0; }
        .brand-mini { font-weight:800; letter-spacing:-.02em; }
        .links a { margin-left:12px; font-weight:600; color:#475569; }
        .links a:hover { color:#0f172a; text-decoration:none; }

        .hero { max-width:1000px; margin:18px auto; padding:0 16px; text-align:center; }
        .mark { display:flex; align-items:center; justify-content:center; gap:10px; }
        .mark img { height:64px; width:auto; }
        .mark h1 { font-size:2.5rem; margin:0; font-weight:800; letter-spacing:-.02em; }
        h2 { margin:10px 0 0; font-size:1.6rem; font-weight:700; }
        .sub { max-width:700px; margin:8px auto 0; color:#475569; line-height:1.6; }

        .paths { max-width:980px; margin:18px auto 0; }
        .pick { font-weight:600; color:#334155; margin-bottom:8px; }
        .grid { display:grid; grid-template-columns:1fr; gap:10px; }
        @media(min-width:700px){ .grid{ grid-template-columns:repeat(5,1fr);} }
        .pill { text-align:left; border:2px solid #e2e8f0; border-radius:16px; padding:12px 14px; background:#fff;
          transition:transform .08s ease, box-shadow .15s ease; }
        .pill:hover { transform:translateY(-1px); box-shadow:0 6px 20px rgba(2,6,23,.08); }
        .pill.on { box-shadow:0 0 0 4px rgba(15,23,42,.06) inset; }
        .pill .t { font-weight:800; }
        .pill .s { font-weight:500; opacity:.75; margin-top:2px; font-size:.93rem; }
        .cta { display:flex; justify-content:center; gap:10px; flex-wrap:wrap; margin-top:16px; }

        .btn { display:inline-block; padding:12px 18px; border-radius:14px; font-weight:700; border:1px solid rgba(15,23,42,.12); }
        .btn-ghost { background:#fff; }
        .btn-accent { color:#fff; background:#111827; }
        .voice { max-width:760px; margin:16px auto 0; }
        .voice-log { margin-top:10px; text-align:left; background:#fff; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px; }
      `}</style>
    </div>
  );
}
