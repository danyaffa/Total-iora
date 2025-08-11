// FILE: /components/OracleVoice.js
// Write OR Speak. Single editable box.
// Mobile-safe SR, Stop Answer, Download/Print.
// Shows quoted sources. Uses /api/ground-sources for ALL traditions.
// 2025-08-11 updates:
// - Added "Stop Answer" button to cancel TTS mid-speech
// - Preserve dictated/typed text (and store to localStorage)
// - Added "Fix my grammar before sending" toggle
// - Volume slider stored as Number and label clarified

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

// One “Subject” menu (styles + topics)
const SUBJECT_OPTIONS = [
  { value: "style:gentle",    label: "Gentle Guidance" },
  { value: "style:practical", label: "Practical Steps" },
  { value: "style:wisdom",    label: "Ancient Wisdom" },
  { value: "style:comfort",   label: "Comfort & Healing" },
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

async function fetchGroundSources(query, path, lang, max = 6) {
  const r = await fetch("/api/ground-sources", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, path, lang, max }),
  });
  if (!r.ok) return [];
  const js = await r.json().catch(() => ({}));
  return Array.isArray(js.quotes) ? js.quotes : [];
}

/* --- Component --- */
export default function OracleVoice({ path }) {
  const [listening, setListening]   = useState(false);
  const [liveText, setLiveText]     = useState("");   // ONE editable box (typing or SR)
  const [reply, setReply]           = useState("");
  const [replying, setReplying]     = useState(false);
  const [speaking, setSpeaking]     = useState(false);
  const [lang, setLang]             = useState("auto");
  const [subject, setSubject]       = useState("topic:general");
  const [volume, setVolume]         = useState(1);
  const [polish, setPolish]         = useState(true); // NEW: fix grammar
  const [error, setError]           = useState("");
  const [sources, setSources]       = useState([]);   // [{work,author,url,pos,quote}]
  const [showSources, setShowSrcs]  = useState(false);

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

  /* --- Restore / persist text so dictations aren't “lost” --- */
  useEffect(() => {
    try {
      const saved = localStorage.getItem("oracle_live_text");
      if (saved) setLiveText(saved);
    } catch {}
  }, []);
  useEffect(() => {
    try { localStorage.setItem("oracle_live_text", liveText || ""); } catch {}
  }, [liveText]);

  /* --- TTS voice prepared --- */
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const assign = () => (voiceRef.current = pickVoice(chosenLang));
    window.speechSynthesis.onvoiceschanged = assign;
    setTimeout(assign, 120);
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [chosenLang]);

  /* --- HiDPI canvas --- */
  useEffect(() => {
    const cnv = canvasRef.current;
    if (!cnv) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = 220, h = 220;
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
      const radius = 32 + (avg / 255) * 40;
      c.clearRect(0, 0, 220, 220);
      const g = c.createRadialGradient(110, 110, radius * 0.25, 110, 110, radius);
      g.addColorStop(0, "rgba(124,58,237,.95)");
      g.addColorStop(1, "rgba(124,58,237,0)");
      c.fillStyle = g;
      c.beginPath(); c.arc(110, 110, radius, 0, Math.PI * 2); c.fill();
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
    if (c) c.clearRect(0, 0, 220, 220);
  }

  /* --- Speech recognition (mobile safe) --- */
  function ensureRecognizer() {
    if (recRef.current) return recRef.current;
    const SR = (typeof window !== "undefined") && (window.webkitSpeechRecognition || window.SpeechRecognition);
    if (!SR) { alert("Voice recognition isn’t supported on this device."); return null; }
    const rec = new SR();
    rec.lang = chosenLang || "en-US";
    rec.interimResults = true;
    rec.continuous = true;
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
      const combined = [finalBufRef.current, interim].filter(Boolean).join(" ").trim();
      setLiveText(combined);
    };

    rec.onend = () => { if (listening) { try { rec.start(); } catch {} } };
    rec.onerror = () => {};

    recRef.current = rec;
    return rec;
  }

  async function onStart() {
    setError(""); setReply(""); setSources([]); setShowSrcs(false);
    // DO NOT clear liveText; user keeps dictation
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

    const typed = String(liveText || "").trim();
    const captured = [finalBufRef.current, interimRef.current].filter(Boolean).join(" ").trim();
    const text = (typed || captured).trim();
    if (!text) return;

    // Preserve what was sent so it doesn't "disappear"
    setLiveText(text);

    const isStyle = subject.startsWith("style:");
    const isTopic = subject.startsWith("topic:");
    const mode  = isStyle ? subject.slice(6) : "gentle";
    const topic = isTopic ? subject.slice(6) : "general";

    setReplying(true);
    setError("");

    try {
      // 1) Get grounded quotes for THIS room
      const quotes = await fetchGroundSources(text, path, chosenLang, 6);

      // 2) Build context for the model + show them in UI
      const contextBlock = quotes.length
        ? "\n\nSourced quotes:\n" +
          quotes.map((s, i) => `[#${i + 1}] ${s.work}${s.author ? " — " + s.author : ""}${typeof s.pos === "number" ? ` (#${s.pos})` : ""}\n${s.text}`).join("\n\n")
        : "";

      // Optional input polishing
      const message = polish
        ? `Please first restate the user's input in clear, simple English (fix grammar, keep meaning). Then answer their request. User input: """${text}"""` + (contextBlock ? `\n\n---\n${contextBlock}` : "")
        : text + (contextBlock ? `\n\n---\n${contextBlock}` : "");

      const r = await fetch("/api/auracode-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          path, mode, topic, lang: chosenLang
        }),
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

      const srv = Array.isArray(data?.sources) ? data.sources : [];
      const merged = [
        ...srv.map(s => ({ work: s.work, author: s.author, url: s.url, pos: s.pos, quote: s.quote })),
        ...quotes.map(s => ({ work: s.work, author: s.author, url: s.url, pos: s.pos, quote: s.text }))
      ];
      setSources(merged);

      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(msg);
        const v = pickVoice(chosenLang);
        if (v) u.voice = v;
        u.lang = chosenLang || "en-US";
        u.volume = Math.max(0, Math.min(1, Number(volume) || 1)); // browser TTS volume (cap = system volume)
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
      liveText || finalBufRef.current,
      "",
      "Guide:",
      reply,
      ...(sources?.length ? ["", "Sources:", ...sources.map((s,i) =>
        `[#${i+1}] ${s.work}${s.author ? " — " + s.author : ""}${s.pos != null ? ` (pos ${s.pos})` : ""}${s.url ? " — " + s.url : ""}\n${s.quote || ""}`
      )] : [])
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
      <pre style="font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Arial;white-space:pre-wrap;padding:16px">
Room: ${path} | Subject: ${subject} | Lang: ${chosenLang}
Date: ${new Date().toLocaleString()}

You:
${liveText || finalBufRef.current}

Guide:
${reply}

${sources?.length ? `Sources:\n${sources.map((s,i) => `[#${i+1}] ${s.work}${s.author ? " — " + s.author : ""}${s.pos != null ? ` (pos ${s.pos})` : ""}${s.url ? " — " + s.url : ""}\n${s.quote || ""}`).join("\n\n")}` : ""}
      </pre>`);
    w.document.close(); w.focus(); w.print();
  }

  useEffect(() => () => { try { recRef.current && recRef.current.stop(); } catch {}; stopMicViz(); }, []);

  return (
    <section className="oracle">
      <header className="head">
        <div className="persona">{persona}</div>
        <h2>Write or Speak to the Oracle</h2>
        <p className="lead">
          Type or dictate. Edit your words if needed. I’ll answer when you press <b>Stop</b> or <b>Get Answer</b>.
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
          <label title="Browser speech volume (0–100%). For louder audio, raise your device/system volume.">
            Guide voice volume:
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
            />
          </label>
          <label title="When ON, your text is lightly corrected before sending.">
            <input type="checkbox" checked={polish} onChange={(e) => setPolish(e.target.checked)} />
            &nbsp;Fix my grammar before sending
          </label>
        </div>
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
              onChange={(e) => setLiveText(e.target.value)}
              placeholder="Type or speak here… you can edit before sending."
            />
            <div className="row">
              {!listening ? (
                <button className="btn start" onClick={onStart}>🎙️ Start</button>
              ) : (
                <button className="btn stop" onClick={onStop}>⏹ Stop</button>
              )}
              <button className="btn ghost" onClick={onStop}>Get Answer ⟶</button>
              {speaking && <button className="btn danger" onClick={stopAnswerVoice}>🔇 Stop Answer</button>}
              <button className="btn ghost" onClick={downloadReply}>Download</button>
              <button className="btn ghost" onClick={printReply}>Print</button>
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
              {error ? <span style={{color:"#b91c1c",fontWeight:700}}>{error}</span> : (reply || (replying ? "Thinking…" : "—"))}
            </div>

            {sources?.length > 0 && (
              <div className="sources">
                <button className="link" onClick={() => setShowSrcs(v => !v)}>
                  {showSources ? "Hide sources" : "Show sources & quotes"}
                </button>
                {showSources && (
                  <ul className="srcList">
                    {sources.map((s, i) => (
                      <li key={i}>
                        <div className="srcTitle">
                          [#{i+1}] {s.work}{s.author ? ` — ${s.author}` : ""}{s.pos != null ? ` (pos ${s.pos})` : ""} {s.url ? <a href={s.url} target="_blank" rel="noreferrer">source</a> : null}
                        </div>
                        {s.quote ? <blockquote className="quote">“{s.quote}”</blockquote> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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
        .lead { color:#475569; max-width:760px; margin:0 auto 8px; }
        .bar { margin-top:6px; display:flex; gap:10px; justify-content:center; flex-wrap:wrap; color:#475569; font-size:.95rem; }
        .bar select { margin-left:6px; padding:8px 10px; border-radius:10px; border:1px solid #e2e8f0; background:#fff; }
        .bar input[type="range"] { vertical-align:middle; width:140px; margin-left:8px; }
        .body { display:grid; gap:12px; grid-template-columns:1fr; margin-top:10px; padding:0 6px; }
        @media (min-width:860px){ .body { grid-template-columns:1fr 1fr; } }
        .pane { background:#fff; border:1px solid #e2e8f0; border-radius:18px; padding:12px; display:flex; gap:12px; align-items:flex-start; }
        .orb { width:140px; height:140px; min-width:140px; border-radius:999px; position:relative;
               background: radial-gradient(40% 40% at 50% 50%, rgba(124,58,237,.18), rgba(124,58,237,0));
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
        .bubble { background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px; min-h
