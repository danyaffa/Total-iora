// FILE: /components/OracleVoice.js
import { useEffect, useMemo, useRef, useState } from "react";

const LANG_OPTIONS = [
  { value: "auto", label: "Auto (by room)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "en-IN", label: "English (India)" },
  { value: "ar", label: "Arabic" },
  { value: "he", label: "Hebrew" },
];

const SUBJECT_OPTIONS = [
  { value: "topic:general", label: "General" },
  { value: "style:gentle", label: "Gentle Guidance" },
  { value: "style:wisdom", label: "Ancient Wisdom" },
  { value: "style:practical", label: "Practical Steps" },
  { value: "style:comfort", label: "Comfort & Healing" },
  { value: "topic:prayer", label: "Prayer & Meditation" },
  { value: "topic:faith", label: "Faith & Belief" },
  { value: "topic:doubt", label: "Spiritual Doubt" },
  { value: "topic:purpose", label: "Purpose & Meaning" },
  { value: "topic:gratitude", label: "Gratitude" },
  { value: "topic:forgiveness", label: "Forgiveness" },
  { value: "topic:hope", label: "Hope & Resilience" },
  { value: "topic:relationships", label: "Relationships & Love" },
  { value: "topic:family", label: "Family & Parenting" },
  { value: "topic:friendship", label: "Friendship" },
  { value: "topic:conflict", label: "Conflict Resolution" },
  { value: "topic:loneliness", label: "Loneliness" },
  { value: "topic:grief", label: "Grief & Loss" },
  { value: "topic:anxiety", label: "Anxiety & Fear" },
  { value: "topic:health", label: "Health & Illness" },
  { value: "topic:addiction", label: "Addictions & Recovery" },
  { value: "topic:work", label: "Work & Purpose" },
  { value: "topic:career", label: "Career Decisions" },
  { value: "topic:money", label: "Money & Stewardship" },
  { value: "topic:ethics", label: "Ethical Dilemmas" },
  { value: "topic:decisions", label: "Decision-Making" },
  { value: "topic:habits", label: "Habits & Discipline" },
  { value: "topic:study", label: "Study & Learning" },
  { value: "topic:creativity", label: "Creativity" },
  { value: "topic:community", label: "Community & Service" },
  { value: "topic:justice", label: "Justice & Compassion" },
  { value: "topic:nature", label: "Nature & Environment" },
  { value: "topic:travel", label: "Travel & Pilgrimage" },
  { value: "topic:rituals", label: "Rituals & Holidays" },
  { value: "topic:youth", label: "Youth & Teens" },
  { value: "topic:marriage", label: "Marriage" },
  { value: "topic:aging", label: "Elders & Aging" },
  { value: "topic:endoflife", label: "End of Life" },
  { value: "topic:dreams", label: "Dreams & Symbols" },
  { value: "topic:scripture", label: "Scripture Study" },
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
    let v = voices.find((x) => x.lang === lang) || voices.find((x)=>x.lang?.startsWith((lang||"").split("-")[0]));
    return v || voices[0];
  } catch { return null; }
}

const isMobile = () => typeof navigator !== "undefined" && /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent||"");
const hasSR = () => (typeof window !== "undefined") && !isMobile() && (window.webkitSpeechRecognition || window.SpeechRecognition);
const hasRecorder = () => (typeof window !== "undefined") && typeof window.MediaRecorder === "function";
const isSecure = () =>
  typeof window === "undefined" ? true :
  (window.isSecureContext || /^https:/i.test(location.protocol) || /^http:\/\/localhost/i.test(location.href));

/* Choose lowest-latency compatible format per device */
function bestMime() {
  if (!hasRecorder()) return "audio/webm";
  const M = window.MediaRecorder;
  if (M.isTypeSupported?.("audio/mp4;codecs=aac")) return "audio/mp4;codecs=aac";      // iOS/Safari
  if (M.isTypeSupported?.("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";  // Android/Chrome
  if (M.isTypeSupported?.("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus";    // Firefox
  if (M.isTypeSupported?.("audio/webm")) return "audio/webm";
  return "audio/webm";
}

/* Helpers */
function mergeNoDupe(base, addition) {
  const a = (base||"").trim(), b = (addition||"").trim();
  if (!b) return a; if (!a) return b;
  const at = a.split(/\s+/), bt = b.split(/\s+/);
  const n = Math.min(12, bt.length);
  const tail = at.slice(-n).join(" "), head = bt.slice(0, n).join(" ");
  if (tail === head || a.endsWith(b)) return a;
  return (a + " " + b).replace(/\s+/g," ").trim();
}
async function sttUploadBlob(blob, mime, lang) {
  const buf = await blob.arrayBuffer();
  let b64 = ""; const bytes = new Uint8Array(buf);
  for (let i=0;i<bytes.length;i++) b64 += String.fromCharCode(bytes[i]);
  const r = await fetch("/api/stt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ b64: btoa(b64), mime: mime || "audio/webm", lang: (lang || "en") }),
  });
  const js = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(js?.error || js?.detail || "STT failed");
  return js?.text || "";
}

export default function OracleVoice({ path = "Universal" }) {
  const [listening, setListening] = useState(false);
  const [replying, setReplying] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [status, setStatus] = useState("");

  const [liveText, setLiveText] = useState("");  // progressively updated as you speak
  const [reply, setReply] = useState("");

  const [lang, setLang] = useState("auto");
  const [subject, setSubject] = useState("topic:general");
  const [volume, setVolume] = useState(1);
  const [polish, setPolish] = useState(false);

  const [sources, setSources] = useState([]);
  const [showSrc, setShowSrc] = useState(false);

  const canvasRef = useRef(null);
  const srRef = useRef(null);

  // Recorder & streaming queue
  const recRef = useRef({ stream:null, rec:null, mime:"", ctx:null, analyser:null, anim:0 });
  const chunkQueueRef = useRef([]);    // {idx, blob, mime}
  const processingRef = useRef(false);
  const chunkIdxRef = useRef(0);
  const manualEditRef = useRef(false);
  const stopRequestedRef = useRef(false);

  const persona = useMemo(() => (
    path === "Jewish" ? "Rabbi" :
    path === "Christian" ? "Priest" :
    path === "Muslim" ? "Imam" :
    path === "Eastern" ? "Monk" : "Sage"
  ), [path]);

  const chosenLang = lang === "auto" ? autoLangFromPath(path) : lang;

  /* TTS */
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const assign = () => {/* trigger voices load */};
    window.speechSynthesis.onvoiceschanged = assign;
    setTimeout(assign, 150);
    return () => { window.speechSynthesis.onvoiceschanged = null; };
  }, [chosenLang]);
  function speak(text) {
    if (!text) return;
    try { window.speechSynthesis.cancel(); } catch {}
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice(chosenLang); if (v) u.voice = v;
    u.lang = chosenLang || "en-US";
    u.volume = Math.max(0, Math.min(1, Number(volume) || 1));
    u.onend = () => setSpeaking(false);
    setSpeaking(true);
    try { window.speechSynthesis.speak(u); } catch {}
  }

  // Canvas mic viz size
  useEffect(() => {
    const cnv = canvasRef.current; if (!cnv) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = 220, h = 220;
    cnv.width = w * dpr; cnv.height = h * dpr;
    cnv.style.width = `${w}px`; cnv.style.height = `${h}px`;
    cnv.getContext("2d").scale(dpr, dpr);
  }, []);

  /* ====== Progressive captions pipeline ======
     A) If browser has SpeechRecognition (desktop) -> near-instant interim words.
     B) Always run MediaRecorder with 400ms chunks -> stream each chunk to /api/stt and append text.
  */
  async function processChunkQueue() {
    if (processingRef.current) return;
    processingRef.current = true;
    try {
      while (chunkQueueRef.current.length) {
        const { blob, mime } = chunkQueueRef.current.shift();
        try {
          const text = await sttUploadBlob(blob, mime, chosenLang);
          if (!text) continue;
          if (!manualEditRef.current) {
            setLiveText(prev => mergeNoDupe(prev, text));
          }
        } catch (e) {
          // swallow chunk errors; keep streaming
        }
      }
    } finally {
      processingRef.current = false;
    }
  }

  function setupSR() {
    const SR = (window.webkitSpeechRecognition || window.SpeechRecognition);
    if (!SR) return null;
    const rec = new SR();
    rec.lang = chosenLang || "en-US";
    rec.interimResults = true; rec.continuous = true; rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      let interim = "", final = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]; const t = (r[0]?.transcript || "").trim();
        if (!t) continue;
        if (r.isFinal) final = mergeNoDupe(final, t);
        else interim = mergeNoDupe("", t);
      }
      if (!manualEditRef.current) {
        const combo = [final, interim].filter(Boolean).join(" ").trim();
        if (combo) setLiveText(prev => mergeNoDupe(prev, combo));
      }
    };
    rec.onerror = () => setStatus("Live captions (browser) error — server captions active.");
    srRef.current = rec;
    return rec;
  }

  async function startRecorder() {
    if (!isSecure()) { setStatus("Microphone requires HTTPS or localhost."); return false; }
    if (!navigator.mediaDevices?.getUserMedia || !hasRecorder()) {
      setStatus("Recorder not supported on this device."); return false;
    }
    const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount:1, noiseSuppression:true, echoCancellation:true } });
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC(); try { await ctx.resume(); } catch {}
    const analyser = ctx.createAnalyser(); analyser.fftSize = 512;
    const src = ctx.createMediaStreamSource(stream); src.connect(analyser);

    const mime = bestMime();
    const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
    rec.ondataavailable = (e) => {
      if (!e.data || !e.data.size) return;
      chunkQueueRef.current.push({ idx: chunkIdxRef.current++, blob: e.data, mime });
      processChunkQueue(); // send chunk to STT immediately
    };
    rec.onstart = () => setStatus("Recording… (words appear as you speak)");
    rec.onerror = () => setStatus("Recorder error.");
    stopRequestedRef.current = false;
    rec.start(400); // ~400ms chunks => low-latency captions

    // simple visualizer
    const data = new Uint8Array(analyser.frequencyBinCount);
    const c = canvasRef.current?.getContext?.("2d");
    const draw = () => {
      if (!c) return;
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a,b)=>a+b,0)/data.length;
      const radius = 32 + (avg/255)*40;
      c.clearRect(0,0,220,220);
      const g = c.createRadialGradient(110,110,radius*0.25,110,110,radius);
      g.addColorStop(0,"rgba(124,58,237,.95)"); g.addColorStop(1,"rgba(124,58,237,0)");
      c.fillStyle = g; c.beginPath(); c.arc(110,110,radius,0,Math.PI*2); c.fill();
      if (!stopRequestedRef.current) recRef.current.anim = requestAnimationFrame(draw);
    };
    draw();

    recRef.current = { stream, rec, mime, ctx, analyser, anim: recRef.current.anim };
    return true;
  }

  async function onStart() {
    setReply(""); setStatus(""); setListening(true);
    setLiveText(l => l); // don't clear what user typed
    // A) Desktop live captions (if available)
    if (hasSR()) {
      try { const sr = setupSR(); sr && sr.start(); setStatus("Live captions on."); } catch {}
    }
    // B) Universal streaming recorder
    try {
      const ok = await startRecorder();
      if (!ok) setListening(false);
    } catch {
      setListening(false); setStatus("Mic unavailable.");
    }
  }

  async function onStop() {
    stopRequestedRef.current = true;
    setListening(false);
    try { srRef.current && srRef.current.stop && srRef.current.stop(); } catch {}
    const r = recRef.current.rec;
    if (r) { try { r.stop(); r.requestData && r.requestData(); } catch {} }
    cancelAnimationFrame(recRef.current.anim || 0);
    try { recRef.current.ctx && recRef.current.ctx.close(); } catch {}
    try { recRef.current.stream?.getTracks?.().forEach(t => t.stop()); } catch {}
    recRef.current = { stream:null, rec:null, mime:"", ctx:null, analyser:null, anim:0 };
    // allow final queued chunks to flush
    setTimeout(processChunkQueue, 200);
  }

  async function sendForAnswer(text) {
    const clean = String(text || "").trim();
    if (!clean) return;
    setReplying(true);
    setShowSrc(false); setSources([]);
    try {
      const isStyle = subject.startsWith("style:");
      const isTopic = subject.startsWith("topic:");
      const mode = isStyle ? subject.slice(6) : "gentle";
      const topic = isTopic ? subject.slice(6) : "general";
      const r = await fetch("/api/auracode-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: clean, path, mode, topic, lang: chosenLang, polish }),
      });
      const data = await r.json().catch(()=> ({}));
      setReply(data?.reply || "—");
      setSources(Array.isArray(data?.sources) ? data.sources : []);
      if (data?.reply) speak(data.reply);
    } finally {
      setReplying(false);
    }
  }

  function onUserTyping(e) {
    manualEditRef.current = true;
    setLiveText(e.target.value);
    clearTimeout(onUserTyping.tid);
    onUserTyping.tid = setTimeout(() => (manualEditRef.current = false), 500);
  }

  return (
    <section className="oracle">
      <header className="head">
        <div className="persona">{persona}</div>
        <h2>Write or Speak to the Oracle</h2>

        <div className="bar">
          <label>Language:
            <select value={lang} onChange={(e)=>setLang(e.target.value)}>
              {LANG_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>Subject:
            <select value={subject} onChange={(e)=>setSubject(e.target.value)}>
              {SUBJECT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>Guide voice volume:
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e)=>setVolume(parseFloat(e.target.value||"1"))} />
          </label>
          <label><input type="checkbox" checked={polish} onChange={(e)=>setPolish(e.target.checked)} />&nbsp;Fix my grammar</label>
        </div>

        {status && <div style={{textAlign:"center", color:"#334155", fontWeight:700, marginTop:6}}>{status}</div>}
      </header>

      <div className="body">
        <div className="pane">
          <div className={`orb ${listening ? "on" : ""}`}>
            <canvas ref={canvasRef} width={220} height={220} />
            <div className="ring" />
            {listening && <div style={{position:"absolute",bottom:10,fontWeight:800,color:"#7c3aed"}}>LIVE</div>}
          </div>
          <div className="log">
            <div className="label">You</div>
            <textarea
              className="edit"
              rows={5}
              value={liveText}
              onChange={onUserTyping}
              placeholder="Words appear as you speak…"
              autoCorrect="off" autoCapitalize="off" spellCheck={false}
            />
            <div className="row">
              {!listening ? (
                <button className="btn start" onClick={onStart}>🎙️ Start</button>
              ) : (
                <button className="btn stop" onClick={onStop}>⏹ Stop</button>
              )}
              <button className="btn ghost" onClick={()=>sendForAnswer(liveText)} disabled={replying || !liveText}>
                {replying ? "Thinking…" : "Get Answer ⟶"}
              </button>
              {speaking && <button className="btn danger" onClick={()=>{try{window.speechSynthesis.cancel();}catch{}; setSpeaking(false);}}>🔇 Stop Answer</button>}
            </div>
          </div>
        </div>

        <div className="pane">
          <div className={`orb spirit ${replying || speaking ? "on" : ""}`}><div className="halo" /></div>
          <div className="log">
            <div className="label">Guide</div>
            <div className="bubble guide">{reply || (replying ? "Thinking…" : "—")}</div>

            {sources && sources.length > 0 && (
              <div className="sources">
                <button className="linkbtn" onClick={()=>setShowSrc(s => !s)} aria-expanded={showSrc}>
                  {showSrc ? "Hide sources" : `Show sources (${sources.length})`}
                </button>
                {showSrc && (
                  <ul className="srclist">
                    {sources.map((s, i) => (
                      <li key={`${s.i || i}-${s.url || s.work}`}>
                        <div className="sline">
                          <span className="work">{s.work}</span>
                          {s.author ? <span className="author"> — {s.author}</span> : null}
                          {s.url ? <a href={s.url} target="_blank" rel="noreferrer">open ↗</a> : null}
                        </div>
                        {s.quote ? <div className="quote">“{s.quote}”</div> : null}
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
        .oracle{position:relative;max-width:1100px;margin:16px auto;padding:18px 12px;border-radius:24px;
          background:radial-gradient(1200px 600px at 5% -10%, #eef2ff 0%, transparent 60%),
          radial-gradient(900px 500px at 95% 0%, #ecfeff 0%, transparent 60%),
          linear-gradient(180deg, #ffffff, #f8fafc);
          border:1px solid rgba(15,23,42,.08);box-shadow:0 14px 40px rgba(2,6,23,.08);}
        .head{text-align:center;padding:0 8px;}
        .persona{display:inline-block;padding:6px 10px;font-weight:700;border:1px solid #e2e8f0;border-radius:999px;background:#fff;color:#334155;margin-bottom:6px;font-size:.9rem;}
        .head h2{margin:4px 0 6px;font-size:1.7rem;font-weight:800;color:#0f172a;}
        .bar{margin-top:6px;display:flex;gap:10px;justify-content:center;flex-wrap:wrap;color:#475569;font-size:.95rem;}
        .bar select{margin-left:6px;padding:8px 10px;border-radius:10px;border:1px solid #e2e8f0;background:#fff;}
        .bar input[type="range"]{vertical-align:middle;width:140px;margin-left:8px;}
        .body{display:grid;gap:12px;grid-template-columns:1fr;margin-top:10px;padding:0 6px;}
        @media(min-width:860px){.body{grid-template-columns:1fr 1fr;}}
        .pane{background:#fff;border:1px solid #e2e8f0;border-radius:18px;padding:12px;display:flex;gap:12px;align-items:flex-start;}
        .orb{width:140px;height:140px;min-width:140px;border-radius:999px;position:relative;
          background:radial-gradient(40% 40% at 50% 50%, rgba(124,58,237,.18), rgba(124,58,237,0));
          border:1px solid rgba(124,58,237,.25);display:flex;align-items:center;justify-content:center;overflow:hidden;}
        @media(min-width:500px){.orb{width:160px;height:160px;min-width:160px;}}
        .orb .ring{position:absolute;inset:-10%;border-radius:999px;border:1px dashed rgba(124,58,237,.28);animation:slowspin 16s linear infinite;}
        .orb.on{box-shadow:0 0 0 10px rgba(124,58,237,.08), 0 0 50px rgba(124,58,237,.22) inset;}
        .orb.spirit{background:radial-gradient(40% 40% at 50% 50%, rgba(14,165,233,.18), rgba(14,165,233,0));border-color:rgba(14,165,233,.25);}
        .orb.spirit.on{box-shadow:0 0 0 10px rgba(14,165,233,.08), 0 0 50px rgba(14,165,233,.22) inset;}
        .orb.spirit .halo{position:absolute;inset:-18%;border-radius:999px;background:conic-gradient(from 0deg, rgba(14,165,233,.25), rgba(124,58,237,.15), rgba(14,165,233,.25));filter:blur(12px);animation:spin 3.6s linear infinite;}
        @keyframes spin{to{transform:rotate(360deg);}}
        @keyframes slowspin{to{transform:rotate(-360deg);}}
        .log{flex:1;min-width:0;}
        .label{font-size:.86rem;color:#64748b;margin-bottom:6px;}
        .bubble{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;min-height:44px;}
        .bubble.guide{background:#eef6ff;border-color:#dbeafe;}
        .edit{width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:1rem;min-height:120px;}
        .row{display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;}
        .btn{padding:12px 18px;border-radius:14px;font-weight:800;border:1px solid rgba(15,23,42,.12);touch-action:manipulation; cursor:pointer;}
        .btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .btn.start{color:#fff;background:linear-gradient(135deg,#7c3aed,#14b8a6);border:none;}
        .btn.stop{color:#fff;background:#111827;border:none;}
        .btn.ghost{background:#fff;}
        .btn.danger{color:#fff;background:#b91c1c;border:none;}
        .sources{margin-top:8px}
        .linkbtn{border:none;background:transparent;color:#1d4ed8;font-weight:700;cursor:pointer;padding:6px 0}
        .srclist{margin:6px 0 0;padding-left:16px;display:grid;gap:8px; list-style-type: none;}
        .sline{display:flex;gap:8px;flex-wrap:wrap;align-items:baseline}
        .work{font-weight:700;color:#0f172a}
        .author{color:#475569}
        .quote{color:#334155;margin-top:2px;white-space:pre-wrap; border-left: 3px solid #e2e8f0; padding-left: 8px;}
      `}</style>
    </section>
  );
}
