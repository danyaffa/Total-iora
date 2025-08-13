// FILE: /components/OracleVoice.js
import { useEffect, useMemo, useRef, useState } from "react";

const SUBJECT_OPTIONS = [
  { value: "topic:general", label: "General" },
  { value: "style:gentle", label: "Gentle Guidance" },
  { value: "style:wisdom", label: "Ancient Wisdom" },
  { value: "style:practical", label: "Practical Steps" },
  { value: "style:comfort", label: "Comfort & Healing" },
  { value: "topic:scripture", label: "Scripture Study" },
  // keep the rest if you want…
];

const hasSR = () => typeof window !== "undefined" && (window.SpeechRecognition || window.webkitSpeechRecognition);
const hasRecorder = () => typeof window !== "undefined" && typeof window.MediaRecorder === "function";
const isSecure = () => typeof window === "undefined" ? true : (window.isSecureContext || /^https:/i.test(location.protocol) || /^http:\/\/localhost/i.test(location.href));

function bestMime() {
  if (!hasRecorder()) return "audio/webm";
  const M = window.MediaRecorder;
  if (M.isTypeSupported?.("audio/mp4;codecs=aac")) return "audio/mp4;codecs=aac";      // iOS
  if (M.isTypeSupported?.("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";  // Chrome
  if (M.isTypeSupported?.("audio/webm")) return "audio/webm";
  if (M.isTypeSupported?.("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus";    // Firefox
  return "audio/webm";
}
function mergeNoDupe(a, b) {
  a = (a||"").trim(); b = (b||"").trim(); if (!b) return a; if (!a) return b;
  const at = a.split(/\s+/), bt = b.split(/\s+/), k = Math.min(10, bt.length);
  if (at.slice(-k).join(" ") === bt.slice(0,k).join(" ")) return (a + " " + bt.slice(k).join(" ")).trim();
  return (a + " " + b).replace(/\s+/g, " ").trim();
}
async function sttUploadBlob(blob, mime) {
  const buf = await blob.arrayBuffer();
  let b64 = ""; const bytes = new Uint8Array(buf);
  for (let i=0;i<bytes.length;i++) b64 += String.fromCharCode(bytes[i]);
  const r = await fetch("/api/stt", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ b64: btoa(b64), mime: mime || "audio/webm" }),
  });
  const js = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(js?.error || js?.detail || `STT ${r.status}`);
  return js; // { text, lang }
}
function encodeWavPCM16(float32, sampleRate) {
  const inRate = sampleRate, outRate = 16000, ratio = inRate / outRate;
  const n = Math.floor(float32.length / ratio); const res = new Float32Array(n);
  for (let i=0;i<n;i++) res[i] = float32[Math.floor(i*ratio)];
  const buf = new ArrayBuffer(44 + n*2), v = new DataView(buf);
  const w = (o,s)=>{ for(let i=0;i<s.length;i++) v.setUint8(o+i, s.charCodeAt(i)); };
  w(0,"RIFF"); v.setUint32(4,36+n*2,true); w(8,"WAVE"); w(12,"fmt "); v.setUint32(16,16,true);
  v.setUint16(20,1,true); v.setUint16(22,1,true); v.setUint32(24,outRate,true); v.setUint32(28,outRate*2,true);
  v.setUint16(32,2,true); v.setUint16(34,16,true); w(36,"data"); v.setUint32(40,n*2,true);
  for (let i=0,o=44;i<n;i++,o+=2){ let s=Math.max(-1,Math.min(1,res[i])); v.setInt16(o, s<0?s*0x8000:s*0x7FFF, true); }
  return new Blob([v], { type:"audio/wav" });
}

export default function OracleVoice({ path = "Universal" }) {
  const [listening, setListening] = useState(false);
  const [replying, setReplying]   = useState(false);
  const [speaking, setSpeaking]   = useState(false);
  const [status, setStatus]       = useState("");
  const [subject, setSubject]     = useState("topic:general");
  const [volume, setVolume]       = useState(1);
  const [polish, setPolish]       = useState(false);

  const [liveText, setLiveText]   = useState("");
  const [reply, setReply]         = useState("");
  const [translated, setTranslated] = useState("");

  const [citations, setCitations] = useState([]);
  const [sources, setSources]     = useState([]);
  const [showCites, setShowCites] = useState(true);
  const [showSrc, setShowSrc]     = useState(false);

  const [detectedLang, setDetectedLang] = useState(null);

  const audioRef  = useRef(null);
  const canvasRef = useRef(null);
  const citesRef  = useRef(null);

  const srRef  = useRef(null);
  const recRef = useRef({ stream:null, rec:null, mime:"", busy:false, anim:0, ctx:null, proc:null, buf:[] });

  const persona = useMemo(() => (
    path === "Jewish" ? "Rabbi" :
    path === "Christian" ? "Priest" :
    path === "Muslim" ? "Imam" :
    path === "Eastern" ? "Monk" : "Sage"
  ), [path]);

  useEffect(()=>{ audioRef.current = new Audio(); audioRef.current.preload = "auto"; },[]);
  useEffect(()=>{ const c=canvasRef.current; if(!c) return; const dpr=Math.max(1,window.devicePixelRatio||1); c.width=220*dpr; c.height=220*dpr; c.style.width="220px"; c.style.height="220px"; c.getContext("2d").scale(dpr,dpr); },[]);

  async function onStart() {
    setReply(""); setTranslated(""); setDetectedLang(null);
    setCitations([]); setSources([]); setShowCites(true); setShowSrc(false);
    setStatus(""); setListening(true); setLiveText("");

    if (!isSecure()) { setListening(false); setStatus("Microphone requires HTTPS (or localhost)."); return; }

    // A) Browser SR for live captions (no fixed lang for better auto)
    if (hasSR()) {
      try {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        const r = new SR(); r.continuous = true; r.interimResults = true; r.maxAlternatives = 1;
        r.onresult = (e) => {
          let interim = "";
          for (let i=e.resultIndex;i<e.results.length;i++){
            const rr = e.results[i]; const t=(rr[0]?.transcript||"").trim(); if(!t) continue;
            if (rr.isFinal) setLiveText(prev => mergeNoDupe(prev, t));
            else interim = mergeNoDupe("", t);
          }
          if (interim) setLiveText(prev => [prev, interim].filter(Boolean).join(" ").trim());
        };
        r.onerror = () => {}; r.onend = () => {};
        r.start(); srRef.current = r;
        setStatus("Listening… (live captions)");
      } catch { /* ignore */ }
    }

    // B) MediaRecorder → STT every ~1.2s
    if (hasRecorder() && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio:{channelCount:1, noiseSuppression:true, echoCancellation:true} });
        const mime = bestMime();
        const rec = new MediaRecorder(stream, mime?{ mimeType:mime }:undefined);
        rec.ondataavailable = async (e) => {
          if (!e.data || !e.data.size) return;
          if (recRef.current.busy) return;
          recRef.current.busy = true;
          try {
            const out = await sttUploadBlob(e.data, mime);
            if (out?.lang && !detectedLang) setDetectedLang(out.lang);
            if (out?.text) setLiveText(prev => mergeNoDupe(prev, out.text));
          } catch {} finally { recRef.current.busy = false; }
        };
        rec.onstart = () => setStatus(s => s || "Recording… (words appear as you speak)");
        rec.start(1200);
        recRef.current = { ...recRef.current, stream, rec, mime };
        animateOrb(stream);
        return;
      } catch { /* fall through */ }
    }

    // C) Fallback: raw PCM → WAV
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio:true });
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC(); try { await ctx.resume(); } catch {}
      const source = ctx.createMediaStreamSource(stream);
      const proc = ctx.createScriptProcessor(4096,1,1);
      const buf = [];
      proc.onaudioprocess = async (ev) => {
        const ch = ev.inputBuffer.getChannelData(0);
        buf.push(new Float32Array(ch));
        const secs = buf.length * ev.inputBuffer.duration;
        if (secs > 1.2 && !recRef.current.busy) {
          const all = concatFloat32(buf.splice(0));
          recRef.current.busy = true;
          try {
            const wav = encodeWavPCM16(all, ctx.sampleRate);
            const out = await sttUploadBlob(wav, "audio/wav");
            if (out?.lang && !detectedLang) setDetectedLang(out.lang);
            if (out?.text) setLiveText(prev => mergeNoDupe(prev, out.text));
          } catch {} finally { recRef.current.busy = false; }
        }
      };
      source.connect(proc); proc.connect(ctx.destination);
      recRef.current = { ...recRef.current, stream, ctx, proc, buf };
      setStatus(s => s || "Recording… (words appear as you speak)");
      animateOrb(stream);
    } catch {
      setListening(false);
      setStatus("Dictation not supported on this device/browser.");
    }
  }

  function concatFloat32(chunks){ let len=0; for(const c of chunks) len+=c.length; const out=new Float32Array(len); let o=0; for(const c of chunks){ out.set(c,o); o+=c.length; } return out; }
  function animateOrb(stream){ const AC = window.AudioContext||window.webkitAudioContext; const ctx=new AC(); const an=ctx.createAnalyser(); an.fftSize=512; ctx.createMediaStreamSource(stream).connect(an); const data=new Uint8Array(an.frequencyBinCount); const c=canvasRef.current?.getContext?.("2d"); const draw=()=>{ if(!c) return; an.getByteFrequencyData(data); const avg=data.reduce((a,b)=>a+b,0)/data.length; const r=32+(avg/255)*40; c.clearRect(0,0,220,220); const g=c.createRadialGradient(110,110,r*.25,110,110,r); g.addColorStop(0,"rgba(124,58,237,.95)"); g.addColorStop(1,"rgba(124,58,237,0)"); c.fillStyle=g; c.beginPath(); c.arc(110,110,r,0,Math.PI*2); c.fill(); recRef.current.anim=requestAnimationFrame(draw); }; draw(); }

  async function onStop(){
    if(!listening) return; setListening(false);
    try{ srRef.current?.stop?.(); }catch{}
    try{ const r=recRef.current.rec; if(r && r.state!=="inactive") r.stop(); }catch{}
    try{ recRef.current.stream?.getTracks?.().forEach(t=>t.stop()); }catch{}
    try{ recRef.current.proc && recRef.current.proc.disconnect(); }catch{}
    try{ recRef.current.ctx && recRef.current.ctx.close(); }catch{}
    cancelAnimationFrame(recRef.current.anim||0);
    recRef.current = { stream:null, rec:null, mime:"", busy:false, anim:0, ctx:null, proc:null, buf:[] };
    setStatus("Ready.");
  }

  async function speakOut(text){
    if(!text) return;
    const a = audioRef.current;
    try{
      let r = await fetch("/api/tts", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ text, voice:"alloy" }) });
      if(!r.ok) r = await fetch("/api/tts?voice=alloy&text="+encodeURIComponent(text));
      if(!r.ok) throw new Error(`TTS ${r.status}`);
      const blob = await r.blob(); const url = URL.createObjectURL(blob);
      a.src = url; a.onended = () => { try{URL.revokeObjectURL(url);}catch{} setSpeaking(false); };
      setSpeaking(true); await a.play().catch(()=>setSpeaking(false));
    }catch(e){
      try{ const v = window.speechSynthesis?.getVoices?.()[0]; if(v){ window.speechSynthesis.cancel(); const u=new SpeechSynthesisUtterance(text); u.voice=v; u.volume=Math.max(0,Math.min(1,Number(volume)||1)); u.onend=()=>setSpeaking(false); setSpeaking(true); window.speechSynthesis.speak(u); setStatus("TTS API failed; used device voice."); return; } }catch{}
      setStatus(String(e?.message||e));
    }
  }

  async function sendForAnswer(text){
    const clean = String(text||"").trim(); if(!clean || clean.split(/\s+/).length<2) return;
    setReplying(true); setCitations([]); setSources([]); setTranslated(""); setShowCites(true); setShowSrc(false);
    try{
      const r = await fetch("/api/auracode-chat", {
        method:"POST", headers:{ "Content-Type":"application/json" },
        body: JSON.stringify({ message: clean, path, mode: subject.startsWith("style:") ? subject.slice(6) : "gentle", topic: subject.startsWith("topic:") ? subject.slice(6) : "general", lang: detectedLang || "auto", polish })
      });
      const data = await r.json().catch(()=>({}));
      const msg = data?.reply || "I’m here with you.";
      setReply(msg); setCitations(Array.isArray(data?.citations)?data.citations:[]); setSources(Array.isArray(data?.sources)?data.sources:[]);
      await speakOut(msg);
    } finally { setReplying(false); }
  }

  async function onTranslate(){
    if(!reply) return;
    const target = (typeof window!=="undefined") ? (window.prompt("Translate to which language? (e.g. English, Arabic, Hebrew)")||"").trim() : "";
    if(!target) return;
    setTranslated("Translating…");
    try{
      const r = await fetch("/api/translate", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ text: reply, target }) });
      const js = await r.json();
      if(!r.ok || !js?.text) throw new Error(js?.detail || "Translate failed");
      setTranslated(js.text); await speakOut(js.text);
    }catch(e){ setTranslated(String(e?.message||e)); }
  }

  return (
    <section className="oracle">
      <header className="head">
        <div className="persona">{persona}</div>
        <h2>Write or Speak to the Oracle</h2>
        <div className="bar">
          <label>Subject:
            <select value={subject} onChange={(e)=>setSubject(e.target.value)}>
              {SUBJECT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>
          <label>Guide voice volume:
            <input type="range" min="0" max="1" step="0.05" value={volume} onChange={(e)=>setVolume(parseFloat(e.target.value||"1"))}/>
          </label>
          <label><input type="checkbox" checked={polish} onChange={(e)=>setPolish(e.target.checked)}/> Fix my grammar before sending</label>
        </div>
        {status && <div style={{textAlign:"center",color:"#334155",fontWeight:700,marginTop:6}}>{status}</div>}
      </header>

      <div className="body">
        <div className="pane">
          <div className={`orb ${listening?"on":""}`}><canvas ref={canvasRef} width={220} height={220}/><div className="ring"/></div>
          <div className="log">
            <div className="label">You</div>
            <textarea className="edit" rows={5} value={liveText} onChange={(e)=>setLiveText(e.target.value)} placeholder="Speak or type here, then press Get Answer." autoCorrect="off" autoCapitalize="off" spellCheck enterKeyHint="send"/>
            <div className="row">
              {!listening ? <button className="btn start" onClick={onStart}>🎙️ Start</button> : <button className="btn stop" onClick={onStop}>⏹ Stop</button>}
              <button className="btn ghost" onClick={()=>sendForAnswer(liveText)} disabled={replying || !liveText}>{replying?"Thinking…":"Get Answer ⟶"}</button>
            </div>
            <div className="row" style={{marginTop:8}}>
              <button className="btn ghost" onClick={()=>{ if(citations?.length){setShowCites(true); citesRef.current?.scrollIntoView({behavior:"smooth"});} else if (sources?.length){setShowSrc(true); citesRef.current?.scrollIntoView({behavior:"smooth"});} }} disabled={!citations?.length && !sources?.length}>📚 Source</button>
              <button className="btn ghost" onClick={()=>{ const blob=new Blob([`Q:\n${liveText}\n\nA:\n${reply}${translated?`\n\n[Translation]\n${translated}`:""}`],{type:"text/plain;charset=utf-8"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`oracle-${Date.now()}.txt`; a.click(); }} disabled={!reply}>⬇️ Download</button>
              <button className="btn ghost" onClick={()=>{ const w=window.open("","_blank"); if(!w) return; w.document.write(`<pre style="font:16px system-ui;padding:20px;white-space:pre-wrap">${(liveText||"(none)")}\n\n— — —\n\n${reply||"(none)"}${translated?`\n\n[Translation]\n${translated}`:""}</pre><script>window.print()</script>`); w.document.close(); }} disabled={!reply}>🖨️ Print</button>
              <button className="btn ghost" onClick={onTranslate} disabled={!reply}>🌐 Translate…</button>
            </div>
          </div>
        </div>

        <div className="pane" ref={citesRef}>
          <div className={`orb spirit ${replying || speaking ? "on" : ""}`}><div className="halo"/></div>
          <div className="log">
            <div className="label">Guide</div>
            <div className="bubble guide">{reply || (replying ? "Thinking…" : "—")}</div>
            {translated && <div className="bubble" style={{marginTop:12, background:"#f0f9ff", borderColor:"#e0f2fe"}}>{translated}</div>}
            {Array.isArray(citations) && citations.length>0 && (
              <div className="sources">
                <button className="linkbtn" onClick={()=>setShowCites(s=>!s)} aria-expanded={showCites}>{showCites?"Hide citations":`Show citations (${citations.length})`}</button>
                {showCites && (<ul className="srclist">{citations.map((c,i)=>(
                  <li key={`c-${c.index ?? i}`}><div className="sline"><span className="work">{c.work}</span>{c.author?<span className="author"> — {c.author}</span>:null}{c.url?<a href={c.url} target="_blank" rel="noreferrer">open ↗</a>:null}</div>{c.quote?<div className="quote">“{c.quote}”</div>:null}</li>
                ))}</ul>)}
              </div>
            )}
            {sources && sources.length>0 && (
              <div className="sources" style={{marginTop:8}}>
                <button className="linkbtn" onClick={()=>setShowSrc(s=>!s)} aria-expanded={showSrc}>{showSrc?"Hide source pool":`Show source pool (${sources.length})`}</button>
                {showSrc && (<ul className="srclist">{sources.map((s,i)=>(
                  <li key={`${s.i||i}-${s.url||s.work}`}><div className="sline"><span className="work">{s.work}</span>{s.author?<span className="author"> — {s.author}</span>:null}{s.url?<a href={s.url} target="_blank" rel="noreferrer">open ↗</a>:null}</div>{s.quote?<div className="quote">“{s.quote}”</div>:null}</li>
                ))}</ul>)}
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .oracle{position:relative;max-width:1100px;margin:16px auto;padding:18px 12px;border-radius:24px;background:radial-gradient(1200px 600px at 5% -10%, #eef2ff 0%, transparent 60%),radial-gradient(900px 500px at 95% 0%, #ecfeff 0%, transparent 60%),linear-gradient(180deg, #ffffff, #f8fafc);border:1px solid rgba(15,23,42,.08);box-shadow:0 14px 40px rgba(2,6,23,.08);}
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
        .linkbtn{border:none;background:transparent;color:#1d4ed8;font-weight:700;cursor:pointer;padding:6px 0}
        .srclist{margin:6px 0 0;padding-left:16px;display:grid;gap:8px; list-style-type:none;}
        .sline{display:flex;gap:8px;flex-wrap:wrap;align-items:baseline}
        .work{font-weight:700;color:#0f172a}
        .author{color:#475569}
        .quote{color:#334155;margin-top:2px;white-space:pre-wrap;border-left:3px solid #e2e8f0;padding-left:8px;}
      `}</style>
    </section>
  );
}
