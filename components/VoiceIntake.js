import { useEffect, useRef, useState } from "react";

export default function VoiceIntake({ path="Universal", onDone }){
  const [listening, setListening] = useState(false);
  const [text, setText] = useState("");
  const recRef = useRef(null);

  useEffect(()=>{
    if (typeof window==='undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = "en-US"; // auto-detect later if needed
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e)=>{
      let t = "";
      for (let i=e.resultIndex;i<e.results.length;i++){ t += e.results[i][0].transcript; }
      setText(t.trim());
    };
    recRef.current = rec;
  },[]);

  const toggle = ()=>{
    const rec = recRef.current;
    if (!rec) { alert("Voice input not supported in this browser."); return; }
    if (listening){ rec.stop(); setListening(false); }
    else { setText(""); rec.start(); setListening(true); }
  };

  const submit = async ()=>{
    const payload = { voiceText: text, path, locale:"en" };
    const res = await fetch("/api/aura", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify(payload) });
    const data = await res.json();
    onDone?.({ transcript:text, reading:data.reading });
  };

  return (
    <div className="p-4 rounded-2xl border bg-white/70">
      <p className="text-sm text-gray-600">Tell us about yourself in your own words. Speak freely — what hurts, what you hope for, what you carry.</p>
      <div className="mt-3 flex items-center gap-3">
        <button onClick={toggle} className={`btn ${listening?'bg-rose-600':'bg-black'}`}>{listening? "Listening…" : "Start speaking"}</button>
        <button className="btn" onClick={submit} disabled={!text}>Finish & Reflect</button>
      </div>
      <div className="mt-3 p-3 rounded border bg-white min-h-[90px] text-sm whitespace-pre-wrap">{text || "— live transcript —"}</div>
      <p className="mt-2 text-[11px] text-gray-500">We reflect; we don’t diagnose or promise outcomes.</p>
    </div>
  );
}
