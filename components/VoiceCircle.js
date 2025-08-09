import { useEffect, useRef, useState } from "react";

export default function VoiceCircle({ onTranscript, voiceLocale = "en-US" }) {
  const [listening, setListening] = useState(false);
  const recRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    rec.lang = voiceLocale;
    rec.continuous = true;
    rec.interimResults = true;
    rec.onresult = (e) => {
      let text = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        text += e.results[i][0].transcript;
      }
      onTranscript(text);
    };
    recRef.current = rec;
  }, [voiceLocale, onTranscript]);

  const toggle = () => {
    const rec = recRef.current;
    if (!rec) return alert("Voice not supported on this device/browser.");
    if (listening) { rec.stop(); setListening(false); }
    else { rec.start(); setListening(true); }
  };

  return (
    <button onClick={toggle} className={`w-24 h-24 rounded-full grid place-items-center text-sm shadow-md border ${listening? 'bg-rose-100' : 'bg-white'}`}>
      {listening ? 'Listening…' : 'Speak'}
    </button>
  );
}
