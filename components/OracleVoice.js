// FILE: /components/OracleVoice.js
import { useEffect, useMemo, useRef, useState } from "react";

/* ---------- Subject list ---------- */
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

/* ---------- tiny utils ---------- */
const hasSR = () => (typeof window !== "undefined") &&
  (window.SpeechRecognition || window.webkitSpeechRecognition);

const hasRecorder = () =>
  (typeof window !== "undefined") && typeof window.MediaRecorder === "function";

const isSecure = () =>
  typeof window === "undefined" ? true :
  (window.isSecureContext || /^https:/i.test(location.protocol) || /^http:\/\/localhost/i.test(location.href));

function bestMime() {
  if (!hasRecorder()) return "audio/webm";
  const M = window.MediaRecorder;
  if (M.isTypeSupported?.("audio/mp4;codecs=aac")) return "audio/mp4;codecs=aac";      // iOS/Safari
  if (M.isTypeSupported?.("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";  // Chrome/Android
  if (M.isTypeSupported?.("audio/webm")) return "audio/webm";
  if (M.isTypeSupported?.("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus";    // Firefox
  return "audio/webm";
}
function mergeNoDupe(base, addition) {
  const a = (base || "").trim(), b = (addition || "").trim();
  if (!b) return a; if (!a) return b;
  const at = a.split(/\s+/), bt = b.split(/\s+/);
  const k = Math.min(10, bt.length);
  if (at.slice(-k).join(" ") === bt.slice(0,k).join(" ")) return (a + " " + bt.slice(k).join(" ")).trim();
  return (a + " " + b).replace(/\s+/g, " ").trim();
}

/* ---------- server helpers ---------- */
async function sttUploadBlob(blob, mime) {
  const buf = await blob.arrayBuffer();
  let b64 = ""; const bytes = new Uint8Array(buf);
  for (let i=0;i<bytes.length;i++) b64 += String.fromCharCode(bytes[i]);
  const r = await fetch("/api/stt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ b64: btoa(b64), mime: mime || "audio/webm" }),
  });
  const js = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(js?.error || js?.detail || `STT ${r.status}`);
  return { text: js?.text || "", lang: js?.lang || null };
}

/* ---------- WAV encoder (fallback path) ---------- */
function encodeWavPCM16(float32, sampleRate) {
  // Downsample to 16000 Hz mono
  const inRate = sampleRate;
  const outRate = 16000;
  const ratio = inRate / outRate;
  const newLen = Math.floor(float32.length / ratio);
  const resampled = new Float32Array(newLen);
  for (let i=0;i<newLen;i++) {
    const idx = Math.floor(i * ratio);
    resampled[i] = float32[idx];
  }
  const buffer = new ArrayBuffer(44 + newLen * 2);
  const view = new DataView(buffer);
  const writeStr = (o,s)=>{ for(let i=0;i<s.length;i++) view.setUint8(o+i, s.charCodeAt(i)); };
  writeStr(0,"RIFF"); view.setUint32(4, 36 + newLen*2, true);
  writeStr(8,"WAVE"); writeStr(12,"fmt "); view.setUint32(16,16,true);
  view.setUint16(20,1,true); // PCM
  view.setUint16(22,1,true); // mono
  view.setUint32(24,outRate,true);
  view.setUint32(28,outRate*2,true); // byte rate
  view.setUint16(32,2,true); // block align
  view.setUint16(34,16,true); // bits
  writeStr(36,"data"); view.setUint32(40,newLen*2,true);
  let offset = 44;
  for (let i=0;i<newLen;i++) {
    let s = Math.max(-1, Math.min(1, resampled[i]));
    view.setInt16(offset, s<0 ? s*0x8000 : s*0x7FFF, true);
    offset += 2;
  }
  return new Blob([view], { type: "audio/wav" });
}

/* ---------- UI component ---------- */
export default function OracleVoice({ path = "Universal" }) {
  // UI state
  const [listening, setListening] = useState(false);
  const [replying, setReplying]   = useState(false);
  const [speaking, setSpeaking]   = useState(false);
  const [status, setStatus]       = useState("");
  const [volume, setVolume]       = useState(1);
  const [subject, setSubject]     = useState("topic:general");
  const [polish, setPolish]       = useState(false);

  // text state
  const [liveText, setLiveText]   = useState("");
  const [reply, setReply]         = useState("");
  const [translated, setTranslated] = useState("");

  // sources
  const [citations, setCitations] = useState([]);
  const [sources, setSources]     = useState([]);
  const [showCites, setShowCites] = useState(true);
  const [showSrc, setShowSrc]     = useState(false);

  // detected language (from STT)
  const [detectedLang, setDetectedLang] = useState(null);

  // refs
  const audioRef = useRef(null);
  const canvasRef = useRef(null);
  const citesRef  = useRef(null);

  // capture refs
  const srRef   = useRef(null);
  const recRef  = useRef({ stream:null, rec:null, mime:"", busy:false, anim:0, ctx:null, proc:null, buf:[] });

  const persona = useMemo(() => (
    path === "Jewish"    ? "Rabbi"  :
    path === "Christian" ? "Priest" :
    path === "Muslim"    ? "Imam"   :
    path === "Eastern"   ? "Monk"   : "Sage"
  ), [path]);

  /* ---------- setup ---------- */
  useEffect(() => { audioRef.current = new Audio(); audioRef.current.preload = "auto"; }, []);
  useEffect(() => {
    const cnv = canvasRef.current; if (!cnv) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    cnv.width = 220*dpr; cnv.height = 220*dpr; cnv.style.width="220px"; cnv.style.height="220px";
    cnv.getContext("2d").scale(dpr, dpr);
  }, []);

  /* ---------- capture start ---------- */
  async function onStart() {
    setReply(""); setTranslated(""); setDetectedLang(null);
    setCitations([]); setSources([]); setShowCites(true); setShowSrc(false);
    setStatus(""); setListening(true); setLiveText("");

    if (!isSecure()) { setListening(false); setStatus("Microphone requires HTTPS (or localhost)."); return; }

    // Path A: SpeechRecognition (live captions)
    if (hasSR()) {
      try {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const r = new SR();
        r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
        r.onresult = async (e) => {
          let interim = "";
          for (let i=e.resultIndex;i<e.results.length;i++) {
            const rr = e.results[i];
            const t = (rr[0]?.transcript || "").trim(); if (!t) continue;
            if (rr.isFinal) setLiveText(prev => mergeNoDupe(prev, t));
            else interim = mergeNoDupe("", t);
          }
          if (interim) setLiveText(prev => [prev, interim].filter(Boolean).join(" ").trim());
        };
        r.onerror = () => {}; // ignore and let fallback handle audio
        r.onend = () => {};   // we keep MediaRecorder/PCM running
        r.start();
        srRef.current = r;
        setStatus("Listening… (live captions)");
      } catch { /* ignore */ }
    }

    // Path B: MediaRecorder (chunks to STT)
    if (hasRecorder() && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount:1, noiseSuppression:true, echoCancellation:true } });
        const mime = bestMime();
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        rec.ondataavailable = async (e) => {
          if (!e.data || !e.data.size) return;
          if (recRef.current.busy) return;
          recRef.current.busy = true;
          try {
            const { text, lang } = await sttUploadBlob(e.data, mime);
            if (lang && !detectedLang) setDetectedLang(lang);
            if (text) setLiveText(prev => mergeNoDupe(prev, text));
          } catch {} finally { recRef.current.busy = false; }
        };
        rec.onstart = () => setStatus(s => s || "Recording… (words appear as you speak)");
        rec.start(1200);
        recRef.current = { ...recRef.current, stream, rec, mime };
        animateOrb(stream);
        return;
      } catch { /* fall through to PCM */ }
    }

    // Path C: Raw PCM → WAV (universal fallback)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC(); try { await ctx.resume(); } catch {}
      const src = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096, 1, 1);
      const buf = [];
      proc.onaudioprocess = async (ev) => {
        const ch = ev.inputBuffer.getChannelData(0);
        buf.push(new Float32Array(ch)); // collect
        // Every ~1.2s, flush to STT
        const seconds = buf.length * ev.inputBuffer.duration;
        if (seconds > 1.2 && !recRef.current.busy) {
          const all = concatFloat32(buf.splice(0)); // take and clear
          recRef.current.busy = true;
          try {
            const wav = encodeWavPCM16(all, ctx.sampleRate);
            const { text, lang } = await sttUploadBlob(wav, "audio/wav");
            if (lang && !detectedLang) setDetectedLang(lang);
            if (text) setLiveText(prev => mergeNoDupe(prev, text));
          } catch {} finally { recRef.current.busy = false; }
        }
      };
      src.connect(proc); proc.connect(ctx.destination);
      recRef.current = { ...recRef.current, stream, ctx, proc, buf };
      setStatus(s => s || "Recording… (words appear as you speak)");
      animateOrb(stream);
    } catch {
      setListening(false);
      setStatus("Dictation not supported on this device/browser.");
    }
  }

  function concatFloat32(chunks) {
    let len = 0; for (const c of chunks) len += c.length;
    const out = new Float32Array(len);
    let o = 0; for (const c of chunks) { out.set(c, o); o += c.length; }
    return out;
  }

  function animateOrb(stream) {
    const AC = window.AudioContext || window.webkitAudioContext;
    const ctx = new AC();
    const analyser = ctx.createAnalyser(); analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const data = new Uint8Array(analyser.frequencyBinCount);
    const c = canvasRef.current?.getContext?.("2d");
    const draw = () => {
      if (!c) return;
      analyser.getByteFrequencyData(data);
      const avg = data.reduce((a,b)=>a+b,0)/data.length;
      const r = 32 + (avg/255)*40;
      c.clearRect(0,0,220,220);
      const g = c.createRadialGradient(110,110,r*0.25,110,110,r);
      g.addColorStop(0,"rgba(124,58,237,.95)"); g.addColorStop(1,"rgba(124,58,237,0)");
      c.fillStyle = g; c.beginPath(); c.arc(110,110,r,0,Math.PI*2); c.fill();
      recRef.current.anim = requestAnimationFrame(draw);
    };
    draw();
  }

  /* ---------- stop ---------- */
  async function onStop() {
    if (!listening) return;
    setListening(false);
    try { srRef.current?.stop?.(); } catch {}
    try { const r = recRef.current.rec; if (r && r.state !== "inactive") r.stop(); } catch {}
    try { recRef.current.stream?.getTracks?.().forEach(t => t.stop()); } catch {}
    try { recRef.current.proc && recRef.current.proc.disconnect(); } catch {}
    try { recRef.current.ctx && recRef.current.ctx.close(); } catch {}
    cancelAnimationFrame(recRef.current.anim || 0);
    recRef.current = { stream:null, rec:null, mime:"", busy:false, anim:0, ctx:null, proc:null, buf:[] };
    setStatus("Ready.");
  }

  /* ---------- TTS (server first, device fallback) ---------- */
  async function speakOut(text) {
    if (!text) return;
    const a = audioRef.current;
    try {
      let r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "verse" }),
      });
      if (!r.ok) r = await fetch("/api/tts?voice=verse&text="+encodeURIComponent(text));
      if (!r.ok) throw new Error(`TTS ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      a.src = url;
      a.onended = () => { try{URL.revokeObjectURL(url);}catch{} setSpeaking(false); };
      setSpeaking(true);
      await a.play().catch(()=>setSpeaking(false));
    } catch (e) {
      try {
        const v = window.speechSynthesis?.getVoices?.()[0];
        if (v) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          u.voice = v; u.volume = Math.max(0, Math.min(1, Number(volume)||1));
          u.onend = () => setSpeaking(false);
          setSpeaking(true);
          window.speechSynthesis.speak(u);
          setStatus(`TTS API failed; used device voice.`);
          return;
        }
      } catch {}
      setStatus(String(e?.message || e));
    }
  }

  /* ---------- send to guide ---------- */
  async function sendForAnswer(text) {
    const clean = String(text || "").trim();
    if (!clean || clean.split(/\s+/).length < 2) return;
    setReplying(true);
    setCitations([]); setSources([]); setTranslated(""); setShowCites(true); setShowSrc(false);
    try {
      const r = await fetch("/api/auracode-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clean,
          path,
          mode: subject.startsWith("style:") ? subject.slice(6) : "gentle",
          topic: subject.startsWith("topic:") ? subject.slice(6) : "general",
          lang: detectedLang || "auto",
          polish
        }),
      });
      const data = await r.json().catch(()=>({}));
      const msg = data?.reply || "I’m here with you.";
      setReply(msg);
      setCitations(Array.isArray(data?.citations) ? data.citations : []);
      setSources(Array.isArray(data?.sources) ? data.sources : []);
      await speakOut(msg);
    } finally { setReplying(false); }
  }

  /* ---------- translate (non-destructive) ---------- */
  async function onTranslate() {
    if (!reply) return;
    const target = (typeof window !== "undefined") ? (window.prompt("Translate to which language? (e.g. English, Arabic, Hebrew)") || "").trim() : "";
    if (!target) return;
    setTranslated("Translating…");
    try {
      const r = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply, target }),
      });
      const js = await r.json();
      if (!r.ok || !js?.text) throw new Error(js?.detail || "Translate failed");
      setTranslated(js.text);
      await speakOut(js.text);
    } catch (e) { setTranslated(String(e?.message || e)); }
  }

  /* ---------- UI ---------- */
  return (
    <section className="oracle">
      <header className="head">
        <div className="persona">{path === "Jewish" ? "Rabbi" : path === "Christian" ? "Priest" : path === "Muslim" ? "Imam" : path === "Eastern" ? "Monk" : "Sage"}</div>
        <h2>Write or Speak to the Oracle</h2>
        <div className="bar">
          <label>Subject:
            <select value={subject} onChange={(e)=>setSubject(e.target.value)}>
              {SUBJECT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>Guide voice volume:
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e)=>setVolume(parseFloat(e.target.value||"1"))} />
          </label>
          <label><input type="checkbox" checked={polish} onChange={(e)=>setPolish(e.target.checked)} />&nbsp;Fix my grammar before sending</label>
        </div>
        {status && <div style={{textAlign:"center", color:"#334155", fontWeight:700, marginTop:6}}>{status}</div>}
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
              rows={5}
              value={liveText}
              onChange={(e)=>setLiveText(e.target.value)}
              placeholder="Speak or type here, then press Get Answer."
              autoCorrect="off" autoCapitalize="off" spellCheck={true} enterKeyHint="send"
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
            </div>
            <div className="row" style={{marginTop:8}}>
              <button className="btn ghost" onClick={()=>{ if(citations?.length){setShowCites(true);citesRef.current?.scrollIntoView({behavior:"smooth"});} else if (sources?.length){setShowSrc(true);citesRef.current?.scrollIntoView({behavior:"smooth"});} }} disabled={!citations?.length && !sources?.length}>📚 Source</button>
              <button className="btn ghost" onClick={()=>{ const blob=new Blob([`Q:\n${liveText}\n\nA:\n${reply}`],{type:"text/plain;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`oracle-${Date.now()}.txt`; a.click(); }} disabled={!reply}>⬇️ Download</button>
              <button className="btn ghost" onClick={()=>{ const w=window.open("", "_blank"); if(!w) return; w.document.write(`<pre style="font:16px system-ui;padding:20px;white-space:pre-wrap">${(liveText||"(none)")}\n\n— — —\n\n${reply||"(none)"}${translated?`\n\n[Translation]\n${translated}`:""}</pre><script>window.print()</script>`); w.document.close(); }} disabled={!reply}>🖨️ Print</button>
              <button className="btn ghost" onClick={onTranslate} disabled={!reply}>🌐 Translate…</button>
            </div>
          </div>
        </div>

        <div className="pane" ref={citesRef}>
          <div className={`orb spirit ${replying || speaking ? "on" : ""}`}><div className="halo" /></div>
          <div className="log">
            <div className="label">Guide</div>
            <div className="bubble guide">{reply || (replying ? "Thinking…" : "—")}</div>
            {translated && <div className="bubble" style={{marginTop:12, background:"#f0f9ff", borderColor:"#e0f2fe"}}>{translated}</div>}

            {Array.isArray(citations) && citations.length > 0 && (
              <div className="sources">
                <button className="linkbtn" onClick={()=>setShowCites(s => !s)} aria-expanded={showCites}>
                  {showCites ? "Hide citations" : `Show citations (${citations.length})`}
                </button>
                {showCites && (
                  <ul className="srclist">
                    {citations.map((c,i)=>(
                      <li key={`c-${c.index ?? i}`}>
                        <div className="sline">
                          <span className="work">{c.work}</span>
                          {c.author ? <span className="author"> — {c.author}</span> : null}
                          {c.url ? <a href={c.url} target="_blank" rel="noreferrer">open ↗</a> : null}
                        </div>
                        {c.quote ? <div className="quote">“{c.quote}”</div> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {sources && sources.length > 0 && (
              <div className="sources" style={{marginTop:8}}>
                <button className="linkbtn" onClick={()=>setShowSrc(s => !s)} aria-expanded={showSrc}>
                  {showSrc ? "Hide source pool" : `Show source pool (${sources.length})`}
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
        .orb{width:140px;height:140px;min-width:140px;border-radius:999px;position:relative;background:radial-gradient(40% 40% at 50% 50%, rgba(124,58,237,.18), rgba(124,58,237,0));border:1px solid rgba(124,58,237,.25);display:flex;align-items:center;justify-content:center;overflow:hidden;}
        @media(min-width:500px){.orb{width:160px;height:160px;min-width:160px;}}
        .orb .ring{position:absolute;inset:-10%;border-radius:999px;border:1px dashed rgba(124,58,237,.28);animation:slowspin 16s linear infinite;}
        .orb.on{box-shadow:0 0 0 10px rgba(124,58,237,.08), 0 0 50px rgba(124,58,237,.22) inset;}
        .orb.spirit{background:radial-gradient(40% 40% at 50% 50%, rgba(14,165,233,.18), rgba(14,165,233,0));border-color:rgba(14,165,233,.25);}
        .orb.spirit.on{box-shadow:0 0 0 10px rgba(14,165,233,.08), 0 0 50px rgba(14,165,233,.22) inset;}
        .orb.spirit .halo{position:absolute;inset:-18%;border-radius:999px;background:conic-gradient(from 0deg, rgba(14,165,233,.25), rgba(124,58,237,.15), rgba(14,165,233,.25));filter:blur(12px);animation:spin 3.6s linear infinite;}
        .log{flex:1;min-width:0;}
        .label{font-size:.86rem;color:#64748b;margin-bottom:6px;}
        .bubble{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;min-height:44px;}
        .bubble.guide{background:#eef6ff;border-color:#dbeafe;}
        .edit{width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:1rem;min-height:120px;}
        .row{display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;}
        .btn{padding:12px 18px;border-radius:14px;font-weight:800;border:1px solid rgba(15,23,42,.12);touch-action:manipulation;cursor:pointer;}
        .btn:disabled{opacity:.6;cursor:not-allowed;}
        .btn.start{color:#fff;background:linear-gradient(135deg,#7c3aed,#14b8a6);border:none;}
        .btn.stop{color:#fff;background:#111827;border:none;}
        .btn.ghost{background:#fff;}
      `}</style>
    </section>
  );
}
