// FILE: /components/OracleVoice.js
import { useEffect, useMemo, useRef, useState } from "react";

export default function OracleVoice({ path }) {
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState("");
  const [reply, setReply] = useState("");
  const [replying, setReplying] = useState(false);
  const [speaking, setSpeaking] = useState(false);

  const recRef = useRef(null);
  const finalRef = useRef("");      // accumulate final transcript (deduped)
  const interimRef = useRef("");    // current interim
  const audioRef = useRef({ ctx: null, analyser: null, src: null, animId: null, stream: null });
  const canvasRef = useRef(null);

  const persona = useMemo(() => (
    path === "Jewish" ? "Rabbi" :
    path === "Christian" ? "Priest" :
    path === "Muslim" ? "Kadhi" :
    path === "Eastern" ? "Monk" : "Sage"
  ), [path]);

  // crisp canvas on HiDPI
  useEffect(() => {
    const cnv = canvasRef.current;
    if (!cnv) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = 240, h = 240;
    cnv.width = w * dpr;
    cnv.height = h * dpr;
    cnv.style.width = `${w}px`;
    cnv.style.height = `${h}px`;
    const c = cnv.getContext("2d");
    c.scale(dpr, dpr);
  }, []);

  // mic visualization
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
      const w = 240, h = 240;
      c.clearRect(0, 0, w, h);
      const g = c.createRadialGradient(w/2, h/2, radius*0.25, w/2, h/2, radius);
      g.addColorStop(0, "rgba(124,58,237,.95)");
      g.addColorStop(1, "rgba(124,58,237,0)");
      c.fillStyle = g;
      c.beginPath(); c.arc(w/2, h/2, radius, 0, Math.PI*2); c.fill();
      audioRef.current.animId = requestAnimationFrame(draw);
    };
    draw();

    audioRef.current = { ctx, analyser, src, animId: audioRef.current.animId, stream };
  }
  function stopMicViz() {
    cancelAnimationFrame(audioRef.current.animId || 0);
    try { audioRef.current.ctx && audioRef.current.ctx.close(); } catch {}
    try { audioRef.current.stream?.getTracks?.().forEach((t) => t.stop()); } catch {}
    audioRef.current = { ctx: null, analyser: null, src: null, animId: null, stream: null };
    const c = canvasRef.current?.getContext?.("2d");
    if (c) c.clearRect(0, 0, 240, 240);
  }

  // recognizer
  function ensureRecognizer() {
    if (recRef.current) return recRef.current;
    const SR = typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
    if (!SR) { alert("Voice recognition is not supported on this browser. Try Chrome/Edge."); return null; }
    const rec = new SR();
    rec.lang = "en-US";
    rec.interimResults = true;
    rec.continuous = true;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let newFinal = "";
      let newInterim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript || "";
        if (r.isFinal) {
          newFinal += (t.endsWith(" ") ? t : t + " ");
        } else {
          newInterim += t;
        }
      }
      if (newFinal) {
        // append only the new final once
        finalRef.current = (finalRef.current + " " + newFinal).replace(/\s+/g, " ").trim() + " ";
      }
      interimRef.current = newInterim;
      const combined = (finalRef.current + (newInterim ? " " + newInterim : "")).replace(/\s+/g, " ").trim();
      setLiveText(combined);
    };

    rec.onend = () => { if (listening) { try { rec.start(); } catch {} } };
    rec.onerror = (ev) => {
      // recover from "no-speech" / "audio-capture" errors
      if (listening) { try { rec.stop(); rec.start(); } catch {} }
      // optional: console.warn("SR error:", ev?.error);
    };

    recRef.current = rec;
    return rec;
  }

  async function onStart() {
    setReply("");
    setLiveText("");
    finalRef.current = "";
    interimRef.current = "";

    const rec = ensureRecognizer();
    if (!rec) return;
    try {
      await startMicViz();
      setListening(true);
      try { rec.start(); } catch {}
    } catch {
      setListening(false);
      stopMicViz();
      alert("Microphone permission denied or unavailable.");
    }
  }

  async function onStop() {
    setListening(false);
    try { recRef.current && recRef.current.stop(); } catch {}
    stopMicViz();
    const text = (finalRef.current + " " + interimRef.current).replace(/\s+/g, " ").trim();
    if (!text) return;
    setReplying(true);
    try {
      const r = await fetch("/api/auracode-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, path }),
      });
      const data = await r.json().catch(() => ({}));
      const msg = data?.reply || "I’m here with you.";
      setReply(msg);
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(msg);
        u.onstart = () => setSpeaking(true);
        u.onend = () => setSpeaking(false);
        try { window.speechSynthesis.cancel(); } catch {}
        window.speechSynthesis.speak(u);
      }
    } catch {
      setReply("Connection issue. Please try again.");
    } finally {
      setReplying(false);
    }
  }

  // cleanup on unmount
  useEffect(() => {
    return () => {
      try { recRef.current && recRef.current.stop(); } catch {}
      stopMicViz();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section className="oracle">
      <header className="head">
        <div className="persona">{persona}</div>
        <h2>Speak to the Oracle</h2>
        <p className="lead">Share what’s on your heart. I’ll listen as long as you need, and answer when you press <b>Stop</b>.</p>
      </header>

      <div className="body">
        <div className="pane">
          <div className={`orb ${listening ? "on" : ""}`}>
            <canvas ref={canvasRef} width={240} height={240} />
            <div className="ring" />
          </div>
          <div className="log">
            <div className="label">You</div>
            <div className="bubble you">{liveText || (listening ? "…" : "—")}</div>
          </div>
        </div>

        <div className="pane">
          <div className={`orb spirit ${replying || speaking ? "on" : ""}`}>
            <div className="halo" />
          </div>
          <div className="log">
            <div className="label">Guide</div>
            <div className="bubble guide">{reply || (replying ? "Listening to the silence…" : "—")}</div>
          </div>
        </div>
      </div>

      <div className="controls">
        <button onClick={listening ? onStop : onStart} className={`btn ${listening ? "stop" : "start"}`}>
          {listening ? "⏹ Stop & Answer" : "🎙️ Start Conversation"}
        </button>
        <div className="hint">
          {listening ? "Listening… take your time." : "Press to speak. I’ll answer when you stop."}
        </div>
      </div>

      <style jsx>{`
        .oracle { position:relative; max-width:1100px; margin:20px auto; padding:24px 18px; border-radius:24px;
                  background: radial-gradient(1200px 600px at 5% -10%, #eef2ff 0%, transparent 60%),
                              radial-gradient(900px 500px at 95% 0%, #ecfeff 0%, transparent 60%),
                              linear-gradient(180deg, #ffffff, #f8fafc);
                  border:1px solid rgba(15,23,42,.08); box-shadow:0 14px 40px rgba(2,6,23,.08); }
        .head { text-align:center; }
        .persona { display:inline-block; padding:6px 10px; font-weight:700; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; margin-bottom:6px; font-size:.9rem; }
        .head h2 { margin:4px 0 6px; font-size:1.9rem; font-weight:800; color:#0f172a; }
        .lead { color:#475569; max-width:760px; margin:0 auto 10px; }
        .body { display:grid; gap:18px; grid-template-columns:1fr; margin-top:12px; }
        @media (min-width:860px){ .body { grid-template-columns:1fr 1fr; } }
        .pane { background:#fff; border:1px solid #e2e8f0; border-radius:18px; padding:16px; display:flex; gap:16px; align-items:center; }
        .orb { width:160px; height:160px; min-width:160px; border-radius:999px; position:relative;
               background: radial-gradient(40% 40% at 50% 50%, rgba(124,58,237,.18), rgba(124,58,237,0));
               border:1px solid rgba(124,58,237,.25); display:flex; align-items:center; justify-content:center; overflow:hidden; }
        .orb .ring { position:absolute; inset:-10%; border-radius:999px; border:1px dashed rgba(124,58,237,.28); animation: slowspin 16s linear infinite; }
        .orb.on { box-shadow:0 0 0 10px rgba(124,58,237,.08), 0 0 50px rgba(124,58,237,.22) inset; }
        .orb.spirit { background: radial-gradient(40% 40% at 50% 50%, rgba(14,165,233,.18), rgba(14,165,233,0)); border-color: rgba(14,165,233,.25); }
        .orb.spirit.on { box-shadow:0 0 0 10px rgba(14,165,233,.08), 0 0 50px rgba(14,165,233,.22) inset; }
        .orb.spirit .halo { position:absolute; inset:-18%; border-radius:999px;
                            background: conic-gradient(from 0deg, rgba(14,165,233,.25), rgba(124,58,237,.15), rgba(14,165,233,.25));
                            filter: blur(12px); animation: spin 3.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slowspin { to { transform: rotate(-360deg); } }
        .log { flex:1; min-width:0; }
        .label { font-size:.86rem; color:#64748b; margin-bottom:6px; }
        .bubble { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px; min-height:48px; }
        .bubble.guide { background:#eef6ff; border-color:#dbeafe; }
        .controls { display:flex; gap:12px; align-items:center; justify-content:center; margin-top:16px; flex-wrap:wrap; }
        .btn { padding:12px 18px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); transition: transform .06s, box-shadow .15s, filter .2s; }
        .btn.start { color:#fff; background: linear-gradient(135deg, #7c3aed, #14b8a6); border:none; }
        .btn.stop { color:#fff; background:#111827; border:none; }
        .btn:hover { transform: translateY(-1px); box-shadow:0 10px 26px rgba(2,6,23,.10); filter:brightness(1.04); }
        .hint { color:#64748b; font-size:.95rem; }
      `}</style>
    </section>
  );
}
