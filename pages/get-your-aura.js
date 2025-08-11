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
      } catch { 
        setLocked(true); 
      }
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
      <div className="wrap">
        <main className="card">
          <h2 className="text-3xl font-bold">Your Reflection is Ready</h2>
          <div className="p-6 rounded-2xl border bg-white/70 text-left">
            <p className="text-xs text-gray-500">Your AuraCode: <span className="font-mono">{finalReading.code} · {finalReading.color}</span></p>
            <div className="mt-3 whitespace-pre-wrap leading-relaxed">{finalReading.reading}</div>
          </div>
          <button className="btn accent w-full" onClick={() => downloadAuraDNA(dnaContent)}>
            Download Aura DNA
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="wrap">
      <main className="card" inert={locked ? "" : undefined} aria-disabled={locked ? "true" : "false"}>
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-800">Live Mentor Session</h1>
          <p className="mt-2 text-slate-500">Speak freely. When you're ready, end the session for a final reflection.</p>
        </div>

        <div className="conversation">
          {conversation.map((msg, i) => (
            <div key={i} className={`msg-row ${msg.from === 'user' ? 'user' : 'ai'}`}>
              <p className="msg">
                {msg.text}
              </p>
            </div>
          ))}
        </div>

        <div className="controls">
          <ChatGPTBall isListening={listening} />
          <button className="btn soft" onClick={toggleListen} disabled={locked}>
            {locked ? "Log in to Speak" : (listening ? 'Listening...' : 'Speak Now')}
          </button>
          <button className="btn-text" onClick={finishSession} disabled={locked || conversation.length === 0}>
            End Session & Get Reflection
          </button>
          {locked && <div className="lockhint">Log in to use this page.</div>}
        </div>
      </main>
      <style jsx>{`
        .wrap {
            min-height: 100vh;
            padding: 40px 16px 60px;
            background: linear-gradient(180deg, #f0f9ff, #e0f2fe);
        }
        .card {
            max-width: 800px;
            margin: 0 auto;
            background: rgba(255,255,255,.9);
            border: 1px solid rgba(15,23,42,.08);
            box-shadow: 0 10px 30px rgba(2,6,23,.1);
            border-radius: 20px;
            padding: 24px;
            backdrop-filter: blur(8px);
            text-align: center;
        }
        .conversation {
            margin-top: 24px;
            space-y: 16px;
            min-height: 200px;
            display: flex;
            flex-direction: column;
            gap: 16px;
        }
        .msg-row { display: flex; }
        .msg-row.user { justify-content: flex-end; }
        .msg-row.ai { justify-content: flex-start; }
        .msg {
            max-width: 75%;
            padding: 10px 16px;
            border-radius: 18px;
            line-height: 1.5;
        }
        .msg-row.user .msg {
            background: #2563eb;
            color: white;
            border-bottom-right-radius: 4px;
        }
        .msg-row.ai .msg {
            background: #e2e8f0;
            color: #1e293b;
            border-bottom-left-radius: 4px;
        }
        .controls {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-top: 32px;
        }
        .btn {
          padding: 12px 24px;
          border-radius: 14px;
          font-weight: 700;
          border: 1px solid rgba(15,23,42,.08);
          cursor: pointer;
          transition: transform .1s, box-shadow .15s;
        }
        .btn:disabled { opacity: .6; cursor: not-allowed; }
        .btn.soft { background: #ffffff; }
        .btn.soft:hover:not(:disabled) { box-shadow: 0 6px 20px rgba(2,6,23,.1); transform: translateY(-1px); }
        .btn.accent {
          color: #fff;
          background: linear-gradient(135deg, #6366f1, #14b8a6);
          border: none;
        }
        .btn-text {
            font-size: 0.9rem;
            color: #475569;
            background: none;
            border: none;
            cursor: pointer;
        }
        .btn-text:hover:not(:disabled) { text-decoration: underline; }
        .lockhint { margin-top:10px; width: 100%; text-align:center; color:#713f12; background:#fffbe6; border:1px solid #facc15; border-radius:10px; padding:8px; }
      `}</style>
    </div>
  );
}
