// FILE: /components/OracleVoice.js
import { useEffect, useMemo, useRef, useState } from "react";

/* ---------- SUBJECTS ---------- */
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

/* ---------- HELPERS ---------- */
const hasRecorder = () =>
  (typeof window !== "undefined") && typeof window.MediaRecorder === "function";

const isSecure = () =>
  typeof window === "undefined"
    ? true
    : (window.isSecureContext ||
       /^https:/i.test(location.protocol) ||
       /^http:\/\/localhost/i.test(location.href));

function bestMime() {
  if (!hasRecorder()) return "audio/webm";
  const M = window.MediaRecorder;
  if (M.isTypeSupported?.("audio/mp4;codecs=aac")) return "audio/mp4;codecs=aac";
  if (M.isTypeSupported?.("audio/webm;codecs=opus")) return "audio/webm;codecs=opus";
  if (M.isTypeSupported?.("audio/webm")) return "audio/webm";
  if (M.isTypeSupported?.("audio/ogg;codecs=opus")) return "audio/ogg;codecs=opus";
  return "audio/webm";
}

/* robust append to avoid “provide provide …” duplicates */
function appendSegment(existing, seg) {
  const A = String(existing || "").trim();
  const B = String(seg || "").trim();
  if (!B) return A;
  if (!A) return B;
  const tail = A.slice(Math.max(0, A.length - 80));
  if (tail.endsWith(B)) return A;
  if (A.includes(B)) return A;
  return (A + " " + B).replace(/\s+/g, " ").trim();
}

// NEW: Intelligently appends only the new words from a transcript
function diffTail(oldStr, newStr) {
  const A = String(oldStr || "").trim();
  const B = String(newStr || "").trim();
  if (!B || A === B) return "";
  if (!A) return B;
  
  // Find the last 4 words of the old string to use as an anchor
  const anchorWords = A.split(/\s+/).slice(-4).join(" ");
  if (!anchorWords) return B;
  const idx = B.indexOf(anchorWords);

  if (idx !== -1) {
    // If the anchor is found, return the text that comes after it
    return B.slice(idx + anchorWords.length).trim();
  }
  
  // Fallback for very different strings
  if (B.startsWith(A)) {
    return B.slice(A.length).trim();
  }

  return B; // Return the whole new string if no clear overlap
}

// Map to full BCP-47 for recognizer / TTS
function toBCP47(tag = "en-US") {
  const t = String(tag || "").toLowerCase();
  if (t.startsWith("he")) return "he-IL";
  if (t.startsWith("ar")) return "ar-SA";
  if (t.startsWith("de")) return "de-DE";
  if (t.startsWith("fr")) return "fr-FR";
  if (t.startsWith("es")) return "es-ES";
  if (t.startsWith("ru")) return "ru-RU";
  if (t.startsWith("zh")) return "zh-CN";
  if (t.startsWith("ja")) return "ja-JP";
  if (t.startsWith("hi")) return "hi-IN";
  if (t.startsWith("th")) return "th-TH";
  return "en-US";
}

function pickVoice(lang) {
  try {
    const voices = window.speechSynthesis?.getVoices?.() || [];
    if (!voices.length) return null;
    const full = toBCP47(lang);
    return (
      voices.find(v => v.lang === full) ||
      voices.find(v => v.lang?.startsWith(full.split("-")[0])) ||
      voices[0]
    );
  } catch { return null; }
}

/* send blob to /api/stt (auto language) — with abortable previews */
async function sttUpload(blob, mime, signal) {
  const buf = await blob.arrayBuffer();
  let b64 = ""; const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i++) b64 += String.fromCharCode(bytes[i]);
  const r = await fetch("/api/stt", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ b64: btoa(b64), mime }),
    signal,
  });
  const js = await r.json().catch(()=>({}));
  if (!r.ok) throw new Error(js?.error || js?.detail || "STT failed");
  return js; // { text, lang }
}

/* simple language-name normalizer for “translate to <X>” */
function normalizeLangName(s) {
  const x = String(s || "").trim().toLowerCase();
  const map = {
    arabic: "Arabic", ar: "Arabic", "العربية": "Arabic",
    hebrew: "Hebrew", he: "Hebrew", "עברית": "Hebrew",
    english: "English", en: "English",
    french: "French", fr: "French", français: "French",
    spanish: "Spanish", es: "Spanish", español: "Spanish",
    german: "German", de: "German", deutsch: "German",
    russian: "Russian", ru: "Russian", русский: "Russian",
    chinese: "Chinese", zh: "Chinese", 中文: "Chinese",
    japanese: "Japanese", ja: "Japanese", 日本語: "Japanese",
    hindi: "Hindi", hi: "Hindi", हिन्दी: "Hindi",
    thai: "Thai", th: "Thai", ไทย: "Thai",
  };
  return map[x] || (x ? (x[0].toUpperCase() + x.slice(1)) : "");
}

export default function OracleVoice({ path = "Universal" }) {
  const [listening, setListening]   = useState(false);
  const [speaking, setSpeaking]     = useState(false);
  const [replying, setReplying]     = useState(false);
  const [status, setStatus]         = useState("");
  const [liveText, setLiveText]     = useState("");
  const [reply, setReply]           = useState("");
  const [subject, setSubject]       = useState("topic:general");
  const [volume, setVolume]         = useState(1);
  const [polish, setPolish]         = useState(false);
  const [citations, setCitations]   = useState([]);
  const [sources, setSources]       = useState([]);
  const [showSrc, setShowSrc]       = useState(false);
  const [showCites, setShowCites]   = useState(false);

  const canvasRef      = useRef(null);
  const recRef         = useRef({ stream:null, rec:null, chunks:[], mime:"", ctx:null, analyser:null, anim:0 });
  const finalRef       = useRef("");
  const audioRef       = useRef(null);
  const lastDetectedLangRef = useRef("en-US");
  const listeningRef   = useRef(listening);
  useEffect(() => { listeningRef.current = listening; }, [listening]);

  const persona = useMemo(() => (
    path === "Jewish"    ? "Rabbi"  :
    path === "Christian" ? "Priest" :
    path === "Muslim"    ? "Imam"   :
    path === "Eastern"   ? "Monk"   : "Sage"
  ), [path]);

  useEffect(() => { audioRef.current = new Audio(); audioRef.current.preload = "auto"; }, []);

  useEffect(() => {
    const cnv = canvasRef.current; if (!cnv) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const w = 220, h = 220;
    cnv.width = w * dpr; cnv.height = h * dpr;
    cnv.style.width = `${w}px`; cnv.style.height = `${h}px`;
    cnv.getContext("2d").scale(dpr, dpr);
  }, []);

  useEffect(() => {
    const onVoices = () => {};
    if (window?.speechSynthesis) {
      window.speechSynthesis.addEventListener?.('voiceschanged', onVoices);
      window.speechSynthesis.getVoices?.();
      return () => window.speechSynthesis.removeEventListener?.('voiceschanged', onVoices);
    }
  }, []);

  async function onStart() {
    setReply(""); setLiveText("");
    finalRef.current = "";
    setCitations([]); setSources([]); setShowSrc(false); setShowCites(false);
    setStatus(""); setListening(true);

    if (!isSecure()) { setListening(false); setStatus("Microphone requires HTTPS (or localhost)."); return; }
    if (!hasRecorder() || !navigator.mediaDevices?.getUserMedia) {
      setListening(false); setStatus("Dictation not supported on this device/browser."); return;
    }

    try {
      setStatus("Opening microphone…");
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { channelCount:1, noiseSuppression:true, echoCancellation:true } });
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC(); try { await ctx.resume(); } catch {}
      const analyser = ctx.createAnalyser(); analyser.fftSize = 512;
      const src = ctx.createMediaStreamSource(stream); src.connect(analyser);

      const mime = bestMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks = [];
      let lastChunkSent = 0;
      const CHUNK_MS = 500; // How often to send a preview
      const SLICE_MS = 400; // How often to slice audio

      // ** UPDATED LOGIC **
      rec.ondataavailable = async (e) => {
        if (e.data && e.data.size) {
          chunks.push(e.data);
          const now = Date.now();
      
          if (now - lastChunkSent >= CHUNK_MS && listeningRef.current) {
            lastChunkSent = now;
            try {
              // Send the CUMULATIVE audio recorded so far
              const cumulativeBlob = new Blob(chunks, { type: mime || "audio/webm" });
              const preview = await sttUpload(cumulativeBlob, mime || "audio/webm");
      
              // Intelligently append only what is newly recognized
              if (preview?.text) {
                const freshText = diffTail(finalRef.current, preview.text);
                if (freshText) {
                  finalRef.current = appendSegment(finalRef.current, freshText);
                  setLiveText(finalRef.current);
                }
              }
      
              if (preview?.lang) {
                lastDetectedLangRef.current = preview.lang;
              }
            } catch {
              // Ignore preview errors; the final pass on Stop will still run.
            }
          }
        }
      };

      rec.onstart = () => setStatus("Recording…");
      rec.onerror = () => setStatus("Recorder error.");
      rec.onstop = () => {
        try { recRef.current.stream?.getTracks?.().forEach(t => t.stop()); } catch {}
        try { recRef.current.ctx && recRef.current.ctx.close(); } catch {}
        cancelAnimationFrame(recRef.current.anim || 0);
      };
      rec.start(SLICE_MS);

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

      recRef.current = { stream, rec, chunks, mime: mime || "audio/webm", ctx, analyser, anim: recRef.current.anim };
      setStatus("Recording…");
    } catch {
      setListening(false); setStatus("Mic permission denied or unavailable.");
    }
  }

  async function onStop() {
    if (!listening) return;
    setListening(false);
    setStatus("Stopping…");

    const r = recRef.current.rec;
    try { r && r.state !== "inactive" && r.stop(); } catch {}
    await new Promise(res => setTimeout(res, 200));
    try { recRef.current.stream?.getTracks?.().forEach(t => t.stop()); } catch {}
    try { recRef.current.ctx && recRef.current.ctx.close(); } catch {}
    cancelAnimationFrame(recRef.current.anim || 0);
    const { chunks, mime } = recRef.current;
    recRef.current = { stream:null, rec:null, chunks:[], mime:"", ctx:null, analyser:null, anim:0 };

    if (!chunks.length) { setStatus("Stopped."); return; }

    setStatus("Transcribing…");
    try {
      const blob = new Blob(chunks, { type: mime || "audio/webm" });
      const { text, lang } = await sttUpload(blob, mime || "audio/webm");
      if (text) {
        finalRef.current = text;
        setLiveText(finalRef.current);
      }
      if (lang) lastDetectedLangRef.current = lang;
      setStatus("Ready.");
      const m = /^\s*(translate|translation)\s+(it|this|answer|message)?\s*to\s+([A-Za-z\u00C0-\u024F\u0400-\u04FF\u0590-\u05FF\u0600-\u06FF\u4E00-\u9FFF]+)\s*[\.\?!]*$/i.exec(text);
      if (m && reply) {
        const targetName = normalizeLangName(m[3]);
        if (targetName) await doTranslate(targetName);
      }
    } catch (e) {
      setStatus(String(e?.message || e));
    }
  }

  async function speakOutServer(text) {
    if (!text) return;
    try {
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, voice: "verse" }),
      });
      if (!r.ok) throw new Error(`TTS ${r.status}`);
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = audioRef.current;
      a.src = url;
      a.onended = () => { setSpeaking(false); URL.revokeObjectURL(url); };
      setSpeaking(true);
      await a.play().catch(() => setSpeaking(false));
    } catch (e) {
      setStatus(`TTS failed: ${String(e?.message || e)}`);
    }
  }

  async function sendForAnswer(text) {
    const clean = String(text || "").trim();
    if (!clean || clean.split(/\s+/).length < 2) return;

    setReplying(true);
    setShowSrc(false); setShowCites(false);
    setCitations([]); setSources([]);

    try {
      const isStyle = subject.startsWith("style:");
      const isTopic = subject.startsWith("topic:");
      const mode = isStyle ? subject.slice(6) : "gentle";
      const topic = isTopic ? subject.slice(6) : "general";

      const r = await fetch("/api/auracode-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: clean,
          path, mode, topic,
          lang: lastDetectedLangRef.current || "en-US",
          polish
        }),
      });
      const data = await r.json().catch(()=> ({}));

      const msg = data?.reply || "";
      setReply(msg || "—");
      setCitations(Array.isArray(data?.citations) ? data.citations : []);
      setSources(Array.isArray(data?.sources) ? data.sources : []);

      const spokeLang = String(lastDetectedLangRef.current || "en-US");
      const isEnglish = /^en\b/i.test(spokeLang);

      if (isEnglish && window?.speechSynthesis) {
        // Try browser voice first for EN
        const v = pickVoice(spokeLang);
        if (v) {
          try { window.speechSynthesis.cancel(); } catch {}
          const u = new SpeechSynthesisUtterance(msg);
          u.voice = v; u.lang = spokeLang;
          u.volume = Math.max(0, Math.min(1, Number(volume) || 1));
          u.onend = () => setSpeaking(false);
          setSpeaking(true);
          try {
            window.speechSynthesis.speak(u);
          } catch {
            await speakOutServer(msg); // fallback
          }
        } else {
          await speakOutServer(msg);
        }
      } else {
        // For Hebrew/Arabic/other languages: always use server TTS
        await speakOutServer(msg);
      }
    } finally {
      setReplying(false);
    }
  }

  async function doTranslate(targetName) {
    try {
      const r = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: reply, target: targetName }),
      });
      const js = await r.json().catch(()=>({}));
      if (r.ok && js?.text) {
        const spoken = js.text;
        setReply(spoken);
        await speakOutServer(spoken);
      } else {
        setStatus("Translate failed.");
      }
    } catch (e) {
      setStatus(`Translate failed: ${String(e?.message || e)}`);
    }
  }

  function onSourceButton() {
    if (citations?.length) { setShowSrc(false); setShowCites(v => !v); }
    else if (sources?.length) { setShowCites(false); setShowSrc(v => !v); }
  }

  return (
    <section className="oracle">
      <header className="head">
        <div className="persona">{persona}</div>
        <h2>Write or Speak to the Oracle</h2>

        <div className="bar">
          <label>Subject:
            <select value={subject} onChange={(e)=>setSubject(e.target.value)}>
              {SUBJECT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </label>

          <label>Guide voice volume:
            <input type="range" min="0" max="1" step="0.05"
                   value={volume}
                   onChange={(e)=>setVolume(parseFloat(e.target.value||"1"))} />
          </label>

          <label>
            <input type="checkbox" checked={polish} onChange={(e)=>setPolish(e.target.checked)} />
            &nbsp;Fix my grammar before sending
          </label>
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
              onChange={(e) => setLiveText(e.target.value)}
              placeholder="Speak in any language…"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={true}
              enterKeyHint="send"
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
              {speaking && (
                <button
                  className="btn danger"
                  onClick={() => {
                    try { window.speechSynthesis.cancel(); } catch {}
                    try { const a = audioRef.current; if (a) { a.pause(); a.currentTime = 0; a.src = ""; } } catch {}
                    setSpeaking(false);
                  }}
                >
                  🔇 Stop Answer
                </button>
              )}
            </div>

            <div className="row" style={{marginTop:8}}>
              <button className="btn ghost" onClick={onSourceButton} disabled={!citations?.length && !sources?.length}>📚 Source</button>
              <button className="btn ghost" onClick={()=>{
                const text = `Question:\n${liveText}\n\nAnswer:\n${reply}`;
                const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
                const a = document.createElement("a");
                a.href = URL.createObjectURL(blob);
                a.download = `total-iora-answer-${Date.now()}.txt`;
                document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(a.href);
              }} disabled={!reply}>⬇️ Download</button>
              <button className="btn ghost" onClick={()=>{
                const text = `Question:\n${liveText}\n\nAnswer:\n${reply}`;
                const w = window.open("", "_blank", "noopener,noreferrer");
                w.document.write(`<pre style="font:16px/1.4 system-ui,Segoe UI,Roboto">${text}</pre><script>window.print()</script>`);
                w.document.close();
              }} disabled={!reply}>🖨️ Print</button>
              <button className="btn ghost" onClick={async ()=>{
                if (!reply) return;
                const target = window.prompt("Translate to which language? (e.g., Arabic, Hebrew, German)") || "";
                const name = normalizeLangName(target);
                if (!name) return;
                await doTranslate(name);
              }} disabled={!reply || replying}>🌐 Translate…</button>
            </div>
          </div>
        </div>

        <div className="pane">
          <div className={`orb spirit ${replying || speaking ? "on" : ""}`}><div className="halo" /></div>
          <div className="log">
            <div className="label">Guide</div>
            <div className="bubble guide">{reply || (replying ? "Thinking…" : "—")}</div>

            {(showCites && citations?.length > 0) && (
              <div className="sources">
                <div className="src-title">Citations</div>
                <ol>
                  {citations.map((s, i) => (
                    <li key={i}>
                      <strong>{s.work}</strong>
                      {s.author ? <> — <em>{s.author}</em></> : null}
                      {s.url ? <> · <a href={s.url} target="_blank" rel="noopener noreferrer">Open</a></> : null}
                      {s.quote ? <blockquote>{s.quote}</blockquote> : null}
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {(showSrc && sources?.length > 0) && (
              <div className="sources">
                <div className="src-title">Sources</div>
                <ol>
                  {sources.map((s, i) => (
                    <li key={i}>
                      <strong>{s.work}</strong>
                      {s.author ? <> — <em>{s.author}</em></> : null}
                      {s.url ? <> · <a href={s.url} target="_blank" rel="noopener noreferrer">Open</a></> : null}
                      {s.quote ? <blockquote>{s.quote}</blockquote> : null}
                    </li>
                  ))}
                </ol>
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
        .log{flex:1;min-width:0;}
        .label{font-size:.86rem;color:#64748b;margin-bottom:6px;}
        .bubble{background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;min-height:44px;}
        .bubble.guide{background:#eef6ff;border-color:#dbeafe;}
        .edit{width:100%;border:1px solid #e2e8f0;border-radius:10px;padding:10px 12px;font-size:1rem;min-height:120px;}
        .row{display:flex;gap:10px;margin-top:8px;flex-wrap:wrap;}
        .btn{padding:12px 18px;border-radius:14px;font-weight:800;border:1px solid rgba(15,23,42,.12);cursor:pointer;}
        .btn:disabled{opacity:.6;cursor:not-allowed;}
        .btn.start{color:#fff;background:linear-gradient(135deg,#7c3aed,#14b8a6);border:none;}
        .btn.stop{color:#fff;background:#111827;border:none;}
        .btn.ghost{background:#fff;}
        .btn.danger{color:#fff;background:#b91c1c;border:none;}
        .sources{margin-top:10px;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:10px}
        .src-title{font-weight:800;color:#0f172a;margin-bottom:6px}
        .sources ol{margin:0;padding-left:18px}
        .sources li{margin:6px 0}
        .sources blockquote{margin:6px 0 0;padding-left:10px;border-left:3px solid #e2e8f0;color:#334155}
      `}</style>
    </section>
  );
}
