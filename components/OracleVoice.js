// FILE: /components/OracleVoice.js

import { useEffect, useMemo, useRef, useState } from "react";

const LANG_OPTIONS = [
  { value: "auto", label: "Auto (by room)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-IN", label: "English (India)" },
  { value: "ar",    label: "Arabic" },
  { value: "he",    label: "Hebrew" },
];

const SUBJECT_OPTIONS = [
  { value: "topic:general", label: "General" },
  { value: "style:gentle", label: "Gentle Guidance" },
  { value: "style:practical", label: "Practical Steps" },
  { value: "style:wisdom", label: "Ancient Wisdom" },
  { value: "style:comfort", label: "Comfort & Healing" },
  { value: "topic:healthy", label: "Healthy living" },
  { value: "topic:relationships", label: "Human to human" },
  { value: "topic:skills", label: "Life skills (practical)" },
  { value: "topic:partner", label: "Finding a life partner" },
  { value: "topic:work", label: "Work & purpose" },
  { value: "topic:parenting", label: "Parenting" },
  { value: "topic:grief", label: "Grief & healing" },
  { value: "topic:addiction", label: "Addiction support (non-clinical)" },
  { value: "topic:mindfulness", label: "Mindfulness & calm" },
];

function autoLangFromPath(path) {
  switch (path) {
    case "Jewish": return "he";
    case "Muslim": return "ar";
    case "Eastern": return "en-IN";
    case "Christian": return "en-GB";
    default: return "en-US";
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

async function fetchGroundSources(query, path, lang, max = 8) {
  try {
    const r = await fetch("/api/ground-sources", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, path, lang, max }),
    });
    if (!r.ok) return [];
    const js = await r.json().catch(() => ({}));
    return Array.isArray(js.quotes) ? js.quotes : [];
  } catch { return []; }
}

const splitIntoSentences = (t) => String(t||"").split(/(?<=[.!?])\s+/).filter(Boolean);

function sacredNormalize(s) {
  return s
    .replace(/\bgoods\b/gi, 'Gods')
    .replace(/\bgood\b(?=\s+is\b)/gi, 'God')
    .replace(/\balla?h\b/gi, 'Allah')
    .replace(/\bkabbalah?\b/gi, 'Kabbalah')
    .replace(/\brambam\b/gi, 'Rambam');
}

function buildTextFile(q, a, srcs=[]) {
  const body = [
    "Write or Speak to the Oracle",
    "",
    "Question:",
    q || "(none)",
    "",
    "Answer:",
    a || "(no answer)",
    "",
    srcs.length ? "Sources:" : "Sources: (none)",
    ...srcs.map((s,i)=>`[#${i+1}] ${s.work}${s.author?` — ${s.author}`:""} ${s.url?`\n${s.url}`:""}`)
  ].join("\n");
  return new Blob([body], { type: "text/plain;charset=utf-8" });
}

export default function OracleVoice({ path = "Universal" }) {
  const [listening, setListening]   = useState(false);
  const [speaking, setSpeaking]     = useState(false);
  const [replying, setReplying]     = useState(false);
  const [liveText, setLiveText]     = useState("");
  const [reply, setReply]           = useState("");
  const [lang, setLang]             = useState("auto");
  const [subject, setSubject]       = useState("topic:general");
  const [volume, setVolume]         = useState(1);
  const [polish, setPolish]         = useState(true);

  const recRef         = useRef(null);
  const keepAliveRef   = useRef(false);
  const finalBufRef    = useRef("");
  const interimRef     = useRef("");
  const voiceRef       = useRef(null);
  const canvasRef      = useRef(null);
  const audioRef       = useRef({ ctx:null, analyser:null, animId:null, stream:null });

  const [sources, setSources]       = useState([]);
  const [showSources, setShowSources] = useState(false);

  const speakState     = useRef({ parts:[], idx:0 });
  const wasCancelledRef= useRef(false);

  const persona = useMemo(() => (
    path === "Jewish"    ? "Rabbi"  :
    path === "Christian" ? "Priest" :
    path === "Muslim"    ? "Imam"   :
    path === "Eastern"   ? "Monk"   : "Sage"
  ), [path]);

  const chosenLang = lang === "auto" ? autoLangFromPath(path) : lang;

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const assign = () => (voiceRef.current = pickVoice(chosenLang));
    window.speechSynthesis.onvoiceschanged = assign;
    setTimeout(assign, 150);
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [chosenLang]);

  useEffect(() => {
    const cnv = canvasRef.current; if (!cnv) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w=220,h=220;
    cnv.width=w*dpr; cnv.height=h*dpr; cnv.style.width=`${w}px`; cnv.style.height=`${h}px`;
    cnv.getContext("2d").scale(dpr,dpr);
  }, []);

  async function startMicViz() {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const analyser = ctx.createAnalyser(); analyser.fftSize = 512;
    const src = ctx.createMediaStreamSource(stream); src.connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const c = canvasRef.current.getContext("2d");
    const draw = () => {
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a,b)=>a+b,0)/data.length;
      const radius = 32 + (avg/255)*40;
      c.clearRect(0,0,220,220);
      const g = c.createRadialGradient(110,110,radius*.25,110,110,radius);
      g.addColorStop(0,"rgba(124,58,237,.95)"); g.addColorStop(1,"rgba(124,58,237,0)");
      c.fillStyle=g; c.beginPath(); c.arc(110,110,radius,0,Math.PI*2); c.fill();
      audioRef.current.animId = requestAnimationFrame(draw);
    };
    draw();
    audioRef.current = { ctx, analyser, animId: audioRef.current.animId, stream };
  }
  function stopMicViz() {
    cancelAnimationFrame(audioRef.current.animId || 0);
    try { audioRef.current.ctx && audioRef.current.ctx.close(); } catch {}
    try { audioRef.current.stream?.getTracks?.().forEach((t)=>t.stop()); } catch {}
    audioRef.current = { ctx:null, analyser:null, animId:null, stream:null };
    const c = canvasRef.current?.getContext?.("2d"); if (c) c.clearRect(0,0,220,220);
  }

  function ensureRecognizer() {
    if (recRef.current) return recRef.current;
    const SR = (window.webkitSpeechRecognition || window.SpeechRecognition);
    if (!SR) { alert("Voice recognition isn’t supported on this device."); return null; }
    const rec = new SR();
    rec.lang = chosenLang || "en-US";
    rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      let interim = "";
      for (let i=e.resultIndex; i<e.results.length; i++) {
        const r = e.results[i];
        const t = (r[0]?.transcript || "").trim();
        if (!t) continue;
        if (r.isFinal) finalBufRef.current = (finalBufRef.current+" "+t).replace(/\s+/g," ").trim();
        else interim = (interim+" "+t).replace(/\s+/g," ").trim();
      }
      interimRef.current = interim;
      setLiveText([finalBufRef.current, interim].filter(Boolean).join(" ").trim());
    };
    rec.onend = () => { if (keepAliveRef.current) { try { rec.start(); } catch {} } else setListening(false); };
    rec.onerror = () => {};
    recRef.current = rec; return rec;
  }

  async function onStart() {
    finalBufRef.current=""; interimRef.current="";
    setReply(""); setSources([]); setShowSources(false);
    keepAliveRef.current = true;
    try {
      await startMicViz();
      const rec = ensureRecognizer(); if (!rec) return;
      rec.lang = chosenLang || "en-US";
      setListening(true);
      try { rec.start(); } catch {}
    } catch {
      setListening(false); stopMicViz();
      alert("Microphone permission denied or unavailable.");
    }
  }

  async function onStop() {
    keepAliveRef.current = false; setListening(false);
    try { recRef.current && recRef.current.stop(); } catch {}
    stopMicViz();
    const finalizedText = sacredNormalize([finalBufRef.current, interimRef.current].filter(Boolean).join(" ").trim());
    setLiveText(finalizedText);
  }

  function stopAnswerVoice() { try { window.speechSynthesis.cancel(); } catch {}; setSpeaking(false); }
  function speakFrom(i) {
    const parts = speakState.current.parts; if (!parts[i]) { setSpeaking(false); return; }
    const u = new SpeechSynthesisUtterance(parts[i]);
    const v = pickVoice(chosenLang); if (v) u.voice = v;
    u.lang   = chosenLang || "en-US";
    u.volume = Math.max(0, Math.min(1, Number(volume) || 1));
    u.onend  = () => { if (wasCancelledRef.current) { wasCancelledRef.current=false; return; } speakState.current.idx=i+1; speakFrom(i+1); };
    setSpeaking(true);
    try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(u); } catch {}
  }

  async function sendForAnswer(text) {
    const rawText = String(text||"").trim();
    if (!rawText) return;
    setReplying(true);

    const isStyle = subject.startsWith("style:");
    const isTopic = subject.startsWith("topic:");
    const mode  = isStyle ? subject.slice(6) : "gentle";
    const topic = isTopic ? subject.slice(6) : "general";
    
    const payload = polish
      ? `Please restate the user's input in clear ${chosenLang?.startsWith("en") ? "English" : "language"} (fix grammar only, keep meaning). Then answer directly.\n\n${rawText}`
      : rawText;

    try {
      const r = await fetch("/api/auracode-chat", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: payload, path, mode, topic, lang: chosenLang }),
      });
      const data = await r.json().catch(() => ({}));
      const msg  = data?.reply || "I apologize, but I couldn't formulate a response. Please try rephrasing your question.";
      setReply(msg);

      const srv = Array.isArray(data?.sources) ? data.sources : [];
      setSources(srv);

      if (msg) {
        speakState.current = { parts: splitIntoSentences(msg), idx: 0 };
        stopAnswerVoice(); speakFrom(0);
      }
    } finally { setReplying(false); }
  }

  function onVolumeChange(e) {
    const v = parseFloat(e.target.value || "1");
    const clamped = isNaN(v) ? 1 : Math.max(0, Math.min(1, v));
    setVolume(clamped);
    if (speaking) { wasCancelledRef.current = true; window.speechSynthesis.cancel(); setTimeout(() => speakFrom(speakState.current.idx), 120); }
  }
  
  function onUserTyping(e) { setLiveText(e.target.value); }

  function downloadTxt() {
    const blob = buildTextFile(liveText, reply, sources);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "oracle-answer.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(a.href);
  }

  function printView() {
    const w = window.open("", "_blank");
    w.document.write(`
      <html><head><title>Oracle Answer</title>
      <style>
        body{font-family:system-ui, -apple-system, Segoe UI, Roboto, sans-serif; padding:24px; line-height:1.6;}
        h1{margin:0 0 12px;font-size:20px} h2{margin:24px 0 8px;}
        p{margin:0;}
        blockquote{margin:8px 0;border-left:3px solid #cbd5e1;padding-left:10px;color:#334155}
        .src{margin-top:12px} a{color:#0b57d0;}
      </style></head><body>
      <h1>Write or Speak to the Oracle</h1>
      <h2>Question</h2><p>${(liveText||"").replaceAll("&","&amp;").replaceAll("<","&lt;")}</p>
      <h2>Answer</h2><div>${(reply||"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll("\n","<br>")}</div>
      ${sources?.length ? `<h2>Sources</h2>` : `<h2>Sources</h2><p>(none)</p>`}
      ${sources.map((s,i)=>`<div class="src">[#${i+1}] <strong>${s.work}</strong>${s.author?` — ${s.author}`:""} ${s.url?`<br><a href="${s.url}" target="_blank">${s.url}</a>`:""}</div>`).join("")}
      <script>setTimeout(() => window.print(), 500);</script></body></html>`);
    w.document.close();
  }

  useEffect(() => () => { try { recRef.current && recRef.current.stop(); } catch {}; stopMicViz(); stopAnswerVoice(); }, []);

  return (
    <section className="oracle">
      <header className="head">
        <div className="persona">{persona}</div>
        <h2>Write or Speak to the Oracle</h2>
        <div className="bar">
          <label>Language:
            <select value={lang} onChange={(e)=>setLang(e.target.value)}>
              {LANG_OPTIONS.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>Subject:
            <select value={subject} onChange={(e)=>setSubject(e.target.value)}>
              {SUBJECT_OPTIONS.map((o)=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>Guide voice volume:
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={onVolumeChange} />
          </label>
          <label title="When ON, your text is lightly corrected before sending.">
            <input type="checkbox" checked={polish} onChange={(e)=>setPolish(e.target.checked)} />&nbsp;Fix my grammar before sending
          </label>
        </div>
        <div className="hint" aria-live="polite">I only answer after you press <strong>Get Answer</strong>. Finish typing or dictating first.</div>
      </header>

      <div className="body">
        <div className="pane">
          <div className={`orb ${listening ? "on" : ""}`}>
            <canvas ref={canvasRef} width={220} height={220} />
            <div className="ring" />
          </div>
          <div className="log">
            <div className="label">You</div>
            <textarea
              className="edit"
              rows={4}
              value={liveText}
              onChange={onUserTyping}
              placeholder="Type or speak here…"
              lang={chosenLang || "en"}
              spellCheck={true}
              autoCorrect="on"
              autoCapitalize="sentences"
            />
            <div className="row">
              {!listening ? (
                <button className="btn start" onClick={onStart}>🎙️ Start</button>
              ) : (
                <button className="btn stop" onClick={onStop}>⏹ Stop</button>
              )}
              <button className="btn ghost" onClick={() => sendForAnswer(liveText)} disabled={replying || !liveText}>
                {replying ? "Thinking…" : "Get Answer ⟶"}
              </button>
              <button className="btn" onClick={downloadTxt} disabled={!reply}>Download</button>
              <button className="btn" onClick={printView} disabled={!reply}>Print</button>
              {speaking && <button className="btn danger" onClick={stopAnswerVoice}>🔇 Stop Answer</button>}
            </div>
          </div>
        </div>

        <div className="pane">
          <div className={`orb spirit ${replying || speaking ? "on" : ""}`}>
            <div className="halo" />
          </div>
          <div className="log">
            <div className="label">Guide</div>
            <div className="bubble guide">{reply || (replying ? "Thinking…" : "—")}</div>

            <div className="sources">
              <button
                className="link"
                onClick={() => sources.length && setShowSources(v => !v)}
                disabled={!sources.length}
                aria-disabled={!sources.length}
              >
                {sources.length
                  ? (showSources ? "Hide sources" : `Show sources & quotes (${sources.length})`)
                  : "Sources (0) — none matched this question"}
              </button>

              {showSources && sources.length > 0 && (
                <ul className="srcList">
                  {sources.map((s, i) => (
                    <li key={i}>
                      <div className="srcTitle">
                        [#{s.i || i+1}] {s.work}{s.author ? ` — ${s.author}` : ""}{" "}
                        {s.url ? <a href={s.url} target="_blank" rel="noopener noreferrer">source</a> : null}
                      </div>
                      {(s.quote || s.text) ? <blockquote className="quote">“{(s.quote || s.text).slice(0, 900)}”</blockquote> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
      <style jsx>{`
        .oracle { position:relative; max-width:1100px; margin:16px auto; padding:18px 12px; border-radius:24px;
                  background: radial-gradient(1200px 600px at 5% -10%, #eef2ff 0%, transparent 60%),
                              radial-gradient(900px 500px at 95% 0%, #ecfeff 0%, transparent 60%),
                              linear-gradient(180deg, #ffffff, #f8fafc);
                  border:1px solid rgba(15,23,42,.08); box-shadow:0 14px 40px rgba(2,6,23,.08); }
        .head { text-align:center; padding:0 8px; }
        .persona { display:inline-block; padding:6px 10px; font-weight:700; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; margin-bottom:6px; font-size:.9rem; }
        .head h2 { margin:4px 0 6px; font-size:1.7rem; font-weight:800; color:#0f172a; }
        .bar { margin-top:6px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; color:#475569; font-size:.95rem; }
        .bar select { margin-left:6px; padding:8px 10px; border-radius:10px; border:1px solid #e2e8f0; background:#fff; }
        .bar input[type="range"] { vertical-align:middle; width:140px; margin-left:8px; }
        .hint { margin-top:6px; color:#1f2937; font-weight:700; }
        .body { display:grid; gap:12px; grid-template-columns:1fr; margin-top:10px; padding:0 6px; }
        @media (min-width:860px){ .body { grid-template-columns:1fr 1fr; } }
        .pane { background:#fff; border:1px solid #e2e8f0; border-radius:18px; padding:12px; display:flex; gap:12px; align-items:flex-start; }
        .orb { width:140px; height:140px; min-width:140px; border-radius:999px; position:relative; background: radial-gradient(40% 40% at 50% 50%, rgba(124,58,237,.18), rgba(124,58,237,0));
               border:1px solid rgba(124,58,237,.25); display:flex; align-items:center; justify-content:center; overflow:hidden; }
        @media (min-width:500px){ .orb { width:160px; height:160px; min-width:160px; } }
        .orb .ring { position:absolute; inset:-10%; border-radius:999px; border:1px dashed rgba(124,58,237,.28); animation: slowspin 16s linear infinite; }
        .orb.on { box-shadow:0 0 0 10px rgba(124,58,237,.08), 0 0 50px rgba(124,58,237,.22) inset; }
        .orb.spirit { background: radial-gradient(40% 40% at 50% 50%, rgba(14,165,233,.18), rgba(14,165,233,0)); border-color: rgba(14,165,233,.25); }
        .orb.spirit.on { box-shadow:0 0 0 10px rgba(14,165,233,.08), 0 0 50px rgba(14,165,233,.22) inset; }
        .orb.spirit .halo { position:absolute; inset:-18%; border-radius:999px; background: conic-gradient(from 0deg, rgba(14,165,233,.25), rgba(124,58,237,.15), rgba(14,165,233,.25)); filter: blur(12px); animation: spin 3.6s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slowspin { to { transform: rotate(-360deg); } }
        .log { flex:1; min-width:0; }
        .label { font-size:.86rem; color:#64748b; margin-bottom:6px; }
        .bubble { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px; min-height:44px; white-space:pre-wrap; }
        .bubble.guide { background:#eef6ff; border-color:#dbeafe; }
        .edit { width:100%; border:1px solid #e2e8f0; border-radius:10px; padding:10px 12px; font-size:1rem; min-height:120px; }
        .row { display:flex; gap:10px; margin-top:8px; flex-wrap:wrap; }
        .btn { padding:12px 18px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); touch-action:manipulation; cursor:pointer; }
        .btn:disabled { background-color:#f1f5f9; color:#94a3b8; cursor:not-allowed; }
        .btn.start { color:#fff; background: linear-gradient(135deg, #7c3aed, #14b8a6); border:none; }
        .btn.stop  { color:#fff; background:#111827; border:none; }
        .btn.ghost { background:#fff; }
        .btn.danger { color:#fff; background:#b91c1c; border:none; }
        .link { margin-top:8px; background:none; border:none; color:#2563eb; font-weight:700; cursor:pointer; padding:0; }
        .link[disabled], .link[aria-disabled="true"] { color:#94a3b8; cursor:not-allowed; }
        .sources { margin-top:6px; }
        .srcList { list-style:none; padding:0; margin:8px 0 0; display:grid; gap:10px; }
        .srcTitle { font-weight:700; color:#334155; }
        .quote { margin:6px 0 0; padding-left:10px; border-left:3px solid #c7d2fe; color:#475569; }
      `}</style>
    </section>
  );
}
