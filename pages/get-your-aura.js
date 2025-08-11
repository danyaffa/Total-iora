import { useRouter } from "next/router";
import { useState, useRef, useEffect } from "react";
import ChatGPTBall from "../components/ChatGPTBall";
import { generateAuraCode } from "../lib/generateAuraCode";

// Helper to download the Aura DNA
function downloadAuraDNA(content) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'AuraCode-DNA.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function GetYourAura(){
  const router = useRouter();
  const path = (router.query.path || "Universal") + "";
  const [locked, setLocked] = useState(true);
  const [listening, setListening] = useState(false);
  const [conversation, setConversation] = useState([]);
  const [finalReading, setFinalReading] = useState(null);
  const recRef = useRef(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/auth/whoami", { credentials: "include" });
        setLocked(!r.ok);
      } catch { setLocked(true); }
    })();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { console.error("Speech Recognition not supported."); return; }

    const rec = new SR();
    rec.continuous = false; // Listen for one phrase at a time
    rec.interimResults = false;
    
    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setConversation(prev => [...prev, { from: 'user', text: transcript }]);
      // Placeholder for AI response
      setTimeout(() => {
        setConversation(prev => [...prev, { from: 'ai', text: `Reflecting on "${transcript}"... Tell me more.`}]);
      }, 1500);
      setListening(false);
    };
    rec.onend = () => setListening(false);
    recRef.current = rec;
  }, []);

  const toggleListen = () => {
    if (locked) return;
    if (listening) {
      recRef.current?.stop();
    } else {
      recRef.current?.start();
    }
    setListening(!listening);
  };

  const finishSession = () => {
    if (locked) return;
    const fullTranscript = conversation.filter(m => m.from === 'user').map(m => m.text).join(' ');
    const reading = `Based on your words, a feeling of gentle searching emerges. You carry both strength and vulnerability. Remember to be kind to yourself on this path. This is a reflection of the energy you've shared today.`;
    const { code, color } = generateAuraCode("Friend", "1970-01-01");
    setFinalReading({ transcript: fullTranscript, reading, code, color });
  };

  if (finalReading) {
    const dnaContent = `--- Your Aura DNA ---\n\nAuraCode: ${finalReading.code}\nAuraColor: ${finalReading.color}\n\n--- Your Reflection ---\n${finalReading.reading}\n\n--- Your Words ---\n${finalReading.transcript}`;
    return (
      <div className="max-w-2xl mx-auto text-center grid gap-4">
        <h2 className="text-3xl font-bold">Your Reflection is Ready</h2>
        <div className="p-6 rounded-2xl border bg-white/70 text-left">
          <p className="text-xs text-gray-500">Your AuraCode: <span className="font-mono">{finalReading.code} · {finalReading.color}</span></p>
          <div className="mt-3 whitespace-pre-wrap leading-relaxed">{finalReading.reading}</div>
        </div>
        <button className="btn btn-accent w-full" onClick={() => downloadAuraDNA(dnaContent)}>
          Download Aura DNA
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto grid gap-6" inert={locked ? "" : undefined} aria-disabled={locked ? "true" : "false"}>
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800">Live Mentor Session</h1>
        <p className="mt-2 text-slate-500">Speak freely. When you're ready, end the session for a final reflection.</p>
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
        <button className="btn btn-soft" onClick={toggleListen} disabled={locked}>
          {locked ? "Log in to Speak" : (listening ? 'Listening...' : 'Speak Now')}
        </button>
        <button className="text-sm text-slate-500 hover:underline" onClick={finishSession} disabled={locked || conversation.length === 0}>
          End Session & Get Reflection
        </button>
        {locked && <div className="lockhint" style={{marginTop: "10px", textAlign: "center", color: "#713f12", background: "#fffbe6", border: "1px solid #facc15", borderRadius: "10px", padding: "8px", width: "100%"}}>Log in to use this page.</div>}
      </div>
    </div>
  );
}
