// FILE: /components/OracleVoice.js
// Oracle Voice — centerpiece voice UI with continuous SR, mic/reply visuals,
// language/accent control, and modes (general / skills / study).

import { useEffect, useMemo, useRef, useState } from "react";

const LANG_OPTIONS = [
  { value: "auto",   label: "Auto (by room)" },
  { value: "en-US",  label: "English (US)" },
  { value: "en-GB",  label: "English (UK)" },
  { value: "en-IN",  label: "English (India)" },
  { value: "ar",     label: "Arabic" },
  { value: "he",     label: "Hebrew" },
];

const MODE_OPTIONS = [
  { value: "general", label: "General Guidance" },
  { value: "skills",  label: "Life Skills" },
  { value: "study",   label: "Study (with sources tone)" },
];

function autoLangFromPath(path) {
  switch (path) {
    case "Muslim":   return "ar";
    case "Jewish":   return "he";
    case "Eastern":  return "en-IN";
    case "Christian":return "en-GB"; // tweak if you prefer US
    default:         return "en-US";
  }
}

function pickVoice(lang) {
  try {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    if (!voices.length) return null;
    // Prefer exact match, then same base language
    let v = voices.find((x) => x.lang === lang);
    if (v) return v;
    const base = lang.split("-")[0];
    v = voices.find((x) => (x.lang || "").startsWith(base));
    return v || voices[0];
  } catch {
    return null;
  }
}

export default function OracleVoice({ path, defaultMode = "general" }) {
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [mode, setMode] = useState(defaultMode);
  const [lang, setLang] = useState("auto");

  const recRef = useRef(null);
  const finalBufRef = useRef(""); // ✅ holds finalized transcript (prevents duplication)
  const interimRef = useRef("");  // last interim chunk

  const audioRef = useRef({
    ctx: null,
    analyser: null,
    src: null,
    animId: null,
    stream: null,
  });
  const canvasRef = useRef(null);
  const voiceRef = useRef(null);

  const persona = useMemo(
    () =>
      path === "Jewish"
        ? "Rabbi"
        : path === "Christian"
        ? "Priest"
        : path === "Muslim"
        ? "Kadhi" // change to "Imam" if you prefer
        : path === "Eastern"
        ? "Monk"
        : "Sage",
    [path]
  );

  const chosenLang = lang === "auto" ? autoLangFromPath(path) : lang;

  // Keep a suitable TTS voice around for the chosen language
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const setV = () => (voiceRef.current = pickVoice(chosenLang));
    window.speechSynthesis.onvoiceschanged = setV;
    // some browsers need a "kick" to populate voices
    setTimeout(setV, 100);
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [chosenLang]);

  // --- mic visualization ---
  async function startMicViz() {
    if (typeof window === "undefined" || !navigator.mediaDevices) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const cnv = canvasRef.current;
    const c = cnv.getContext("2d");

    const draw = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      const radius = 36 + (avg / 255) * 44;
      const w = cnv.width,
        h = cnv.height;
      c.clearRect(0, 0, w, h);
      const g = c.createRadialGradient(
        w / 2,
        h / 2,
        radius * 0.25,
        w / 2,
        h / 2,
        radius
      );
      g.addColorStop(0, "rgba(124,58,237,.95)");
      g.addColorStop(1, "rgba(124,58,237,0)");
      c.fillStyle = g;
      c.beginPath();
      c.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
      c.fill();
      audioRef.current.animId = requestAnimationFrame(draw);
    };
    draw();

    audioRef.current = {
      ctx,
      analyser,
      src,
      animId: audioRef.current.animId,
      stream,
    };
  }

  function stopMicViz() {
    cancelAnimationFrame(audioRef.current.animId || 0);
    try {
      audioRef.current.ctx && audioRef.current.ctx.close();
    } catch {}
    try {
      audioRef.current.stream?.getTracks?.().forEach((t) => t.stop());
    } catch {}
    audioRef.current = {
      ctx: null,
      analyser: null,
      src: null,
      animId: null,
      stream: null,
    };
    const c = canvasRef.current?.getContext?.("2d");
    if (c) c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  // --- speech recognition ---
  function ensureRecognizer() {
    if (recRef.current) return recRef.current;
    const SR =
      typeof window !== "undefined" &&
      (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) {
      alert("Voice recognition is not supported on this browser.");
      return null;
    }
    const rec = new SR();
    rec.lang = chosenLang || "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    // ✅ No-duplicate algorithm: keep finalized buffer separate from interim
    rec.onresult = (e) => {
      let latestInterim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = (r?.[0]?.transcript || "").trim();
        if (!t) continue;
        if (r.isFinal) {
          finalBufRef.current = (finalBufRef.current + " " + t).trim();
        } else {
          latestInterim = (latestInterim + " " + t).trim();
        }
      }
      const combined = (finalBufRef.current + " " + latestInterim)
        .replace(/\s+/g, " ")
        .trim();
      interimRef.current = latestInterim;
      setLiveText(combined);
    };

    // Auto-restart if still listening
    rec.onend = () => {
      if (listening) {
        try {
          rec.start();
        } catch {}
      }
    };

    recRef.current = rec;
    return rec;
  }

  async function onStart() {
    setReply("");
    setLiveText("");
    finalBufRef.current = "";
    interimRef.current = "";

    const rec = ensureRecognizer();
    if (!rec) return;
    try {
      // update language on each start (in case selector changed)
      rec.lang = chosenLang || "en-US";
      await startMicViz();
      setListening(true);
      rec.start();
    } catch {
      setListening(false);
      stopMicViz();
      alert("Microphone permission denied or unavailable.");
    }
  }

  async function onStop() {
    setListening(false);
    try {
      recRef.current && recRef.current.stop();
    } catch {}
    stopMicViz();

    const text = (finalBufRef.current + " " + (interimRef.current || ""))
      .replace(/\s+/g, " ")
      .trim();
    if (!text) return;

    setReplying(true);
    try {
      const r = await fetch("/api/auracode-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, path, mode, lang: chosenLang }),
      });
      const data = await r.json();
      const msg = data?.reply || "I’m here with you.";
      setReply(msg);

      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(msg);
        if (voiceRef.current) u.voice = voiceRef.current;
        u.lang = chosenLang || "en-US";
        u.onstart = () => setSpeaking(true);
        u.onend = () => setSpeaking(false);
        try {
          window.speechSynthesis.cancel();
          window.speechSynthesis.speak(u);
        } catch {}
      }
    } catch {
      setReply("Connection issue. Please try again.");
    } finally {
      setReplying(false);
    }
  }

  return (
    <section className="oracle">
      <header className="head">
        <div className="persona">{persona}</div>
        <h2>Speak to the Oracle</h2>
        <p className="lead">
          Share what’s on your heart. I’ll listen as long as you need, and
          answer when you press <b>Stop</b>.
        </p>

        {/* Controls: language + mode (small and unobtrusive) */}
        <div className="bar">
          <label>
            Language:
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              {LANG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Mode:
            <select value={mode} onChange={(e) => setMode(e.target.value)}>
              {MODE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </header>

      <div className="body">
        <div className="pane">
          <div className={`orb ${listening ? "on" : ""}`}>
            <canvas ref={canvasRef} width={240} height={240} />
            <div className="ring" />
          </div>
          <div className="log">
            <div className="label">You</div>
            <div className="bubble you">
              {liveText || (listening ? "…" : "—")}
            </div>
          </div>
        </div>

        <div className="pane">
          <div className={`orb spirit ${replying || speaking ? "on" : ""}`}>
            <div className="halo" />
          </div>
          <div className="log">
            <div className="label">Guide</div>
            <div className="bubble guide">
              {reply || (replying ? "Listening to the silence…" : "—")}
            </div>
          </div>
        </div>
      </div>

      <div className="controls">
        <button
          onClick={listening ? onStop : onStart}
          className={`btn ${listening ? "stop" : "start"}`}
        >
          {listening ? "⏹ Stop & Answer" : "🎙️ Start Conversation"}
        </button>
        <div className="hint">
          {listening
            ? "Listening… take your time."
            : "Press to speak. I’ll answer when you stop."}
        </div>
      </div>

      <style jsx>{`
        .oracle {
          position: relative;
          max-width: 1100px;
          margin: 20px auto;
          padding: 24px 18px;
          border-radius: 24px;
          background: radial-gradient(1200px 600px at 5% -10%, #eef2ff 0%, transparent 60%),
            radial-gradient(900px 500px at 95% 0%, #ecfeff 0%, transparent 60%),
            linear-gradient(180deg, #ffffff, #f8fafc);
          border: 1px solid rgba(15, 23, 42, 0.08);
          box-shadow: 0 14px 40px rgba(2, 6, 23, 0.08);
        }
        .head {
          text-align: center;
        }
        .persona {
          display: inline-block;
          padding: 6px 10px;
          font-weight: 700;
          border: 1px solid #e2e8f0;
          border-radius: 999px;
          background: #fff;
          color: #334155;
          margin-bottom: 6px;
          font-size: 0.9rem;
        }
        .head h2 {
          margin: 4px 0 6px;
          font-size: 1.9rem;
          font-weight: 800;
          color: #0f172a;
        }
        .lead {
          color: #475569;
          max-width: 760px;
          margin: 0 auto 10px;
        }
        .bar {
          margin-top: 8px;
          display: flex;
          gap: 12px;
          justify-content: center;
          flex-wrap: wrap;
          color: #475569;
          font-size: 0.95rem;
        }
        .bar select {
          margin-left: 6px;
          padding: 6px 10px;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
          background: #fff;
        }
        .body {
          display: grid;
          gap: 18px;
          grid-template-columns: 1fr;
          margin-top: 12px;
        }
        @media (min-width: 860px) {
          .body {
            grid-template-columns: 1fr 1fr;
          }
        }
        .pane {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 18px;
          padding: 16px;
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .orb {
          width: 160px;
          height: 160px;
          min-width: 160px;
          border-radius: 999px;
          position: relative;
          background: radial-gradient(
            40% 40% at 50% 50%,
            rgba(124, 58, 237, 0.18),
            rgba(124, 58, 237, 0)
          );
          border: 1px solid rgba(124, 58, 237, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .orb .ring {
          position: absolute;
          inset: -10%;
          border-radius: 999px;
          border: 1px dashed rgba(124, 58, 237, 0.28);
          animation: slowspin 16s linear infinite;
        }
        .orb.on {
          box-shadow: 0 0 0 10px rgba(124, 58, 237, 0.08),
            0 0 50px rgba(124, 58, 237, 0.22) inset;
        }
        .orb.spirit {
          background: radial-gradient(
            40% 40% at 50% 50%,
            rgba(14, 165, 233, 0.18),
            rgba(14, 165, 233, 0)
          );
          border-color: rgba(14, 165, 233, 0.25);
        }
        .orb.spirit.on {
          box-shadow: 0 0 0 10px rgba(14, 165, 233, 0.08),
            0 0 50px rgba(14, 165, 233, 0.22) inset;
        }
        .orb.spirit .halo {
          position: absolute;
          inset: -18%;
          border-radius: 999px;
          background: conic-gradient(
            from 0deg,
            rgba(14, 165, 233, 0.25),
            rgba(124, 58, 237, 0.15),
            rgba(14, 165, 233, 0.25)
          );
          filter: blur(12px);
          animation: spin 3.6s linear infinite;
        }
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes slowspin {
          to {
            transform: rotate(-360deg);
          }
        }
        .log {
          flex: 1;
          min-width: 0;
        }
        .label {
          font-size: 0.86rem;
          color: #64748b;
          margin-bottom: 6px;
        }
        .bubble {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 12px 14px;
          min-height: 48px;
        }
        .bubble.guide {
          background: #eef6ff;
          border-color: #dbeafe;
        }
        .controls {
          display: flex;
          gap: 12px;
          align-items: center;
          justify-content: center;
          margin-top: 16px;
          flex-wrap: wrap;
        }
        .btn {
          padding: 12px 18px;
          border-radius: 14px;
          font-weight: 800;
          border: 1px solid rgba(15, 23, 42, 0.12);
          transition: transform 0.06s, box-shadow 0.15s, filter 0.2s;
        }
        .btn.start {
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          border: none;
        }
        .btn.stop {
          color: #fff;
          background: #111827;
          border: none;
        }
        .btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 10px 26px rgba(2, 6, 23, 0.1);
          filter: brightness(1.04);
        }
        .hint {
          color: #64748b;
          font-size: 0.95rem;
        }
      `}</style>
    </section>
  );
}
