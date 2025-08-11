// FILE: /components/OracleVoice.js
// One "Subject" picker (merged), Start/Stop & Answer, Stop Answer (TTS),
// volume control, download & print, and mobile/iOS speech fixes.

import { useEffect, useMemo, useRef, useState } from "react";

/* --- Select options --- */
const LANG_OPTIONS = [
  { value: "auto",   label: "Auto (by room)" },
  { value: "en-US",  label: "English (US)" },
  { value: "en-GB",  label: "English (UK)" },
  { value: "en-IN",  label: "English (India)" },
  { value: "ar",     label: "Arabic" },
  { value: "he",     label: "Hebrew" },
];

// Merge of “General Guidance” styles + topical subjects, per your request
const SUBJECT_OPTIONS = [
  // guidance styles
  { value: "style:gentle",    label: "Gentle Guidance" },
  { value: "style:practical", label: "Practical Steps" },
  { value: "style:wisdom",    label: "Ancient Wisdom" },
  { value: "style:comfort",   label: "Comfort & Healing" },
  // topics
  { value: "topic:general",       label: "General" },
  { value: "topic:healthy",       label: "Healthy living" },
  { value: "topic:relationships", label: "Human to human" },
  { value: "topic:skills",        label: "Life skills (practical)" },
  { value: "topic:partner",       label: "Finding a life partner" },
  { value: "topic:work",          label: "Work & purpose" },
  { value: "topic:parenting",     label: "Parenting" },
  { value: "topic:grief",         label: "Grief & healing" },
  { value: "topic:addiction",     label: "Addiction support (non-clinical)" },
  { value: "topic:mindfulness",   label: "Mindfulness & calm" },
];

function autoLangFromPath(path) {
  switch (path) {
    case "Muslim":    return "ar";
    case "Jewish":    return "he";
    case "Eastern":   return "en-IN";
    case "Christian": return "en-GB";
    default:          return "en-US";
  }
}

function pickVoice(lang) {
  try {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    if (!voices.length) return null;
    let v = voices.find((x) => x.lang === lang);
    if (v) return v;
    const base = (lang || "").split("-")[0];
    v = voices.find((x) => (x.lang || "").startsWith(base));
    return v || voices[0];
  } catch { return null; }
}

/* --- Component --- */
export default function OracleVoice({ path }) {
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText]   = useState("");
  const [reply, setReply]         = useState("");
  const [replying, setReplying]   = useState(false);
  const [speaking, setSpeaking]   = useState(false);
  const [lang, setLang]           = useState("auto");
  const [subject, setSubject]     = useState("topic:general");
  const [volume, setVolume]       = useState(1);
  const [error, setError]         = useState("");

  const recRef        = useRef(null);
  const finalBufRef   = useRef("");
  const interimRef    = useRef("");
  const canvasRef     = useRef(null);
  const audioRef      = useRef({ ctx:null, analyser:null, src:null, animId:null, stream:null });
  const voiceRef      = useRef(null);

  const persona = useMemo(() => (
    path === "Jewish" ? "Rabbi" :
    path === "Christian" ? "Priest" :
    path === "Muslim" ? "Imam" :
    path === "Eastern" ? "Monk" : "Sage"
  ), [path]);

  const chosenLang = lang === "auto" ? autoLangFromPath(path) : lang;

  /* --- TTS voice prepared --- */
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const assign = () => (voiceRef.current = pickVoice(chosenLang));
    window.speechSynthesis.onvoiceschanged = assign;
    setTimeout(assign, 120);
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [chosenLang]);

  /* --- HiDPI canvas sizing --- */
  useEffect(() => {
    const cnv = canvasRef.current;
    if (!cnv) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = 240, h = 240;
    cnv.width = w * dpr; cnv.height = h * dpr;
    cnv.style.width = `${w}px`; cnv.style.height = `${h}px`;
    const c = cnv.getContext("2d"); c.scale(dpr, dpr);
  }, []);

  /* --- Mic visualization --- */
  async function startMicViz() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    const src = ctx.createMediaStreamSource(stream);
    src.connect(analyser);

    const data = new Uint8Array(analyser.frequencyBinCount);
    const c = canvasRef.current.getContext("2d");

    const draw = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      const radius = 36 + (avg / 255) * 44;
      c.clearRect(0, 0, 240, 240);
      const g = c.createRadialGradient(120, 120, radius * 0.25, 120, 120, radius);
      g.addColorStop(0, "rgba(124,58,237,.95)");
      g.addColorStop(1, "rgba(124,58,237,0)");
      c.fillStyle = g;
      c.beginPath(); c.arc(120, 120, radius, 0, Math.PI * 2); c.fill();
      audioRef.current.animId = requestAnimationFrame(draw);
    };
    draw();

    audioRef.current = { ctx, analyser, src, animId: audioRef.current.animId, stream };
  }
  function stopMicViz() {
    cancelAnimationFrame(audioRef.current.animId || 0);
    try { audioRef.current.ctx && audioRef.current.ctx.close(); } catch {}
    try { audioRef.current.stream?.getTracks?.().forEach((t) => t.stop()); } catch {}
    audioRef.current = { ctx:null, analyser:null, src:null, animId:null, stream:null };
    const c = canvasRef.current?.getContext?.("2d");
    if (c) c.clearRect(0, 0, 240, 240);
  }

  /* --- Speech recognition (mobile safe) --- */
  function ensureRecognizer() {
    if (recRef.current) return recRef.current;
    const SR = (typeof window !== "undefined") && (window.webkitSpeechRecognition || window.SpeechRecognition);
    if (!SR) { alert("Voice recognition isn’t supported on this device."); return null; }
    const rec = new SR();
    rec.lang = chosenLang || "en-US";
    rec.interimResults = true;
    rec.continuous = true; // iOS may end; we'll auto-restart onend
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let interim = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = (r[0]?.transcript || "").trim();
        if (!t) continue;
        if (r.isFinal) {
          finalBufRef.current = (finalBufRef.current + " " + t).replace(/\s+/g, " ").trim();
        } else {
          interim = (interim + " " + t).replace(/\s+/g, " ").trim();
        }
      }
      interimRef.current = interim;
      setLiveText([finalBufRef.current, interim].filter(Boolean).join(" ").trim());
    };

    rec.onend = () => { if (listening) { try { rec.start(); } catch {} } };
    rec.onerror = () => {}; // do not kill session on iOS “network/no-speech”

    recRef.current = rec;
    return rec;
  }

  async function onStart() {
    setError(""); setReply(""); setLiveText("");
    finalBufRef.current = ""; interimRef.current = "";
    try {
      await startMicViz();
      if (audioRef.current?.ctx?.state === "suspended") {
        try { await audioRef.current.ctx.resume(); } catch {}
      }
      const rec = ensureRecognizer(); if (!rec) return;
      rec.lang = chosenLang || "en-US";
      setListening(true);
      try { rec.start(); } catch {}
    } catch {
      setListening(false); stopMicViz();
      alert("Microphone permission denied or unavailable.");
    }
  }

  function stopAnswerVoice() {
    try { window.speechSynthesis.cancel(); } catch {}
    setSpeaking(false);
  }

  async function onStop() {
    setListening(false);
    try { recRef.current && recRef.current.stop(); } catch {}
    stopMicViz();

    const text = [finalBufRef.current, interimRef.current].filter(Boolean).join(" ").trim();
    if (!text) return;

    // Split merged "subject" into old fields for API compatibility
    const isStyle  = subject.startsWith("style:");
    const isTopic  = subject.startsWith("topic:");
    const mode  = isStyle ? subject.slice(6) : "gentle";
    const topic = isTopic ? subject.slice(6) : "general";

    setReplying(true);
    setError("");
    try {
      const r = await fetch("/api/auracode-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, path, mode, topic, lang: chosenLang }),
      });

      if (!r.ok) {
        const detail = await r.json().catch(async () => ({ error:"Unknown error", detail: await r.text() }));
        setReply("");
        setError(detail?.error ? `${detail.error}${detail.detail ? ` — ${detail.detail}` : ""}` : "Service error.");
        return;
      }

      const data = await r.json().catch(() => ({}));
      const msg = data?.reply || "I’m here with you.";
      setReply(msg);

      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(msg);
        const v = pickVoice(chosenLang);
        if (v) u.voice = v;
        u.lang = chosenLang || "en-US";
        u.volume = Math.max(0, Math.min(1, Number(volume) || 1));
        u.rate = 1; u.pitch = 1;
        u.onstart = () => setSpeaking(true);
        u.onend   = () => setSpeaking(false);
        try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch {}
      }
    } catch (e) {
      setReply("");
      setError(String(e?.message || e || "Network error"));
    } finally {
      setReplying(false);
    }
  }

  function downloadReply() {
    const text = [
      `Room: ${path} | Subject: ${subject} | Lang: ${chosenLang}`,
      `Date: ${new Date().toLocaleString()}`,
      "",
      "You:",
      finalBufRef.current || liveText,
      "",
      "Guide:",
      reply,
    ].join("\n");
    const blob = new Blob([text], { type:"text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `oracle-${path}-${Date.now()}.txt`; a.click();
    URL.revokeObjectURL(url);
  }

  function printReply() {
    const w = window.open("", "_blank", "width=720,height=900");
    if (!w) return;
    w.document.write(`
      <title>Oracle Guide</title>
      <pre style="font:14px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Arial; white-space:pre-wrap">
Room: ${path} | Subject: ${subject} | Lang: ${chosenLang}
Date: ${new Date().toLocaleString()}

You:
${finalBufRef.current || liveText}

Guide:
${reply}
      </pre>`);
    w.document.close(); w.focus(); w.print();
  }

  useEffect(() => () => { try { recRef.current && recRef.current.stop(); } catch {}; stopMicViz(); }, []);

  return (
    <section className="oracle">
      <header className="head">
        <div className="persona">{persona}</div>
        <h2>Speak to the Oracle</h2>
        <p className="lead">
          Share what’s on your heart. I’ll listen as long as you need, and answer when you press <b>Stop</b>.
        </p>

        <div className="bar">
          <label>Language:
            <select value={lang} onChange={(e) => setLang(e.target.value)}>
              {LANG_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>Subject:
            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {SUBJECT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label title="Also raise your device/system volume">
            Voice volume:
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e) => setVolume(e.target.value)} />
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
            <div className="bubble you">{liveText || (listening ? "…" : "—")}</div>
          </div>
        </div>

        <div className="pane">
          <div className={`orb spirit ${replying || speaking ? "on" : ""}`}>
            <div className="halo" />
          </div>
          <div className="log">
            <div className="label">Guide</div>
            <div className="bubble guide">
              {error ? <span style={{color:"#b91c1c",fontWeight:700}}>{error}</span> : (reply || (replying ? "Listening to the silence…" : "—"))}
            </div>
          </div>
        </div>
      </div>

      <div className="controls">
        <button onClick={listening ? onStop : onStart} className={`btn ${listening ? "stop" : "start"}`}>
          {listening ? "⏹ Stop & Answer" : "🎙️ Start Conversation"}
        </button>

        {(speaking || reply) && (
          <>
            {speaking && <button onClick={stopAnswerVoice} className="btn ghost">Stop Answer</button>}
            {!!reply && (
              <>
                <button onClick={downloadReply} className="btn ghost">Download</button>
                <button onClick={printReply} className="btn ghost">Print</button>
              </>
            )}
          </>
        )}

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
        .bar { margin-top:8px; display:flex; gap:12px; justify-content:center; flex-wrap:wrap; color:#475569; font-size:.95rem; }
        .bar select { margin-left:6px; padding:6px 10px; border-radius:10px; border:1px solid #e2e8f0; background:#fff; }
        .bar input[type="range"] { vertical-align:middle; width:140px; margin-left:8px; }
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
        .orb.spirit .halo { position:absolute; inset:-18%; border-radius:999px; background: conic-gradient(from 0deg, rgba(14,165,233,.25), rgba(124,58,237,.15), rgba(14,165,233,.25)); filter: blur(12px); animation: spin 3.6s linear infinite; }
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
        .btn.ghost { background:#fff; }
        .btn:hover { transform: translateY(-1px); box-shadow:0 10px 26px rgba(2,6,23,.10); filter:brightness(1.04); }
        .hint { color:#64748b; font-size:.95rem; }
      `}</style>
    </section>
  );
}
