// FILE: /pages/get-your-aura.js
import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";
import ChatGPTBall from "../components/ChatGPTBall";

// Simple download helper
function downloadFile(name, text){
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name;
  document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
}

export default function GetYourAura(){
  const router = useRouter();
  const path = (router.query.path || "Universal") + "";

  const [listening, setListening] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [finalReading, setFinalReading] = useState(null); // {report, citations, transcript}
  const [showCites, setShowCites] = useState(true);
  const citeRef = useRef(null);
  const recRef = useRef(null);

  // Web Speech for short turns
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setConversation(prev => [...prev, { from: 'user', text: transcript }]);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, []);

  const toggleListen = () => {
    if (!recRef.current) return;
    if (listening) recRef.current.stop(); else recRef.current.start();
    setListening(!listening);
  };

  const finishSession = async () => {
    const transcript = conversation.filter(m => m.from === 'user').map(m => m.text).join(' ');
    if (!transcript) return;

    const r = await fetch("/api/dna", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path, question: transcript })
    });
    const data = await r.json();

    setFinalReading({
      transcript,
      report: data?.report || "I’m here with you.",
      citations: Array.isArray(data?.citations) ? data.citations : []
    });

    setTimeout(()=>{ try { citeRef.current?.scrollIntoView({behavior:"smooth"}); } catch {} }, 50);
  };

  function exportText(r){
    const lines = [];
    lines.push(`Get Your Aura — ${new Date().toLocaleString()}`);
    lines.push(`Room: ${path}`);
    lines.push("");
    lines.push("Transcript:");
    lines.push(r.transcript || "—");
    lines.push("");
    lines.push("Reflection:");
    lines.push(r.report || "—");
    if (r.citations?.length){
      lines.push("");
      lines.push("Citations:");
      r.citations.forEach((c,i)=>{
        lines.push(`[${c.index ?? i+1}] ${c.work}${c.author ? " — " + c.author : ""}${c.url ? " <"+c.url+">" : ""}`);
        if (c.quote) lines.push(`“${c.quote}”`);
        if (c.reason) lines.push(`Reason: ${c.reason}`);
        lines.push("");
      });
    }
    return lines.join("\n");
  }

  return (
    <div className="max-w-2xl mx-auto grid gap-6">
      {!finalReading && (
        <>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-slate-800">Live Mentor Session</h1>
            <p className="mt-2 text-slate-500">Speak freely. When you're ready, end the session for a final reflection with sources.</p>
          </div>

          <div className="space-y-4">
            {conversation.map((msg, i) => (
              <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                <p className={`max-w-sm px-4 py-2 rounded-2xl ${msg.from === 'user' ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-800'}`}>
                  {msg.text}
                </p>
              </div>
            ))}
          </div>

          <div className="flex flex-col items-center justify-center gap-4 mt-8">
            <ChatGPTBall isListening={listening} />
            <button className="btn btn-soft" onClick={toggleListen}>
              {listening ? 'Listening...' : 'Speak Now'}
            </button>
            <button className="text-sm text-slate-500 hover:underline" onClick={finishSession} disabled={conversation.length === 0}>
              End Session & Get Reflection
            </button>
          </div>
        </>
      )}

      {finalReading && (
        <div className="text-center grid gap-4">
          <h2 className="text-3xl font-bold">Your Reflection</h2>

          <div className="p-6 rounded-2xl border bg-white/70 text-left whitespace-pre-wrap leading-relaxed">
            {finalReading.report}
          </div>

          <div className="flex gap-2 justify-center flex-wrap">
            <button className="btn" onClick={() => { setShowCites(true); citeRef.current?.scrollIntoView({behavior:"smooth"}) }} disabled={!finalReading.citations?.length}>
              Source
            </button>
            <button className="btn" onClick={() => downloadFile(`aura-reflection-${Date.now()}.txt`, exportText(finalReading))}>
              Download
            </button>
            <button className="btn" onClick={() => { const w = window.open("", "_blank", "noopener,noreferrer"); if(!w) return; w.document.write(`<pre style="white-space:pre-wrap;font:16px/1.5 system-ui;padding:24px">${exportText(finalReading).replace(/</g,"&lt;")}</pre><script>window.print()</script>`); w.document.close(); }}>
              Print
            </button>
          </div>

          {!!finalReading.citations?.length && (
            <div ref={citeRef} className="text-left">
              <button className="text-blue-700 font-bold" onClick={()=>setShowCites(s=>!s)}>
                {showCites ? "Hide sources" : `Show sources (${finalReading.citations.length})`}
              </button>
              {showCites && (
                <ul className="mt-2 grid gap-3 list-none pl-0">
                  {finalReading.citations.map((c,i)=>(
                    <li key={`c-${c.index ?? i}`}>
                      <div><strong>{c.work}</strong>{c.author ? ` — ${c.author}` : ""} {c.url ? <a className="underline" href={c.url} target="_blank" rel="noreferrer">open ↗</a> : null}</div>
                      {c.quote ? <div className="text-slate-700 border-l pl-2">“{c.quote}”</div> : null}
                      {c.reason ? <div className="text-slate-500 text-sm">Reason: {c.reason}</div> : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
