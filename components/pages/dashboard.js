import { useState } from "react";
import VoiceCircle from "../components/VoiceCircle";

function speak(text, lang='en-US'){
  if (typeof window === 'undefined') return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang; window.speechSynthesis.speak(u);
}

export default function Dashboard(){
  const [transcript, setTranscript] = useState("");
  const [reply, setReply] = useState("");

  async function reflect() {
    const res = await fetch('/api/aura', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ voiceText: transcript, path:'Universal', name:'Friend', dob:'', code:'', color:'', locale:'en' })
    });
    const data = await res.json();
    setReply(data.reading);
    speak(data.reading);
  }

  return (
    <div className="grid gap-6">
      <h2 className="text-2xl font-bold">Speak to AuraCode</h2>
      <p className="text-gray-600">A gentle space to be heard. We don’t fix. We reflect.</p>
      <div className="flex items-center gap-6">
        <VoiceCircle onTranscript={setTranscript} />
        <div className="flex-1">
          <p className="text-xs text-gray-500">Live transcript:</p>
          <div className="p-3 rounded border bg-white/60 min-h-[80px]">{transcript || '—'}</div>
        </div>
      </div>
      <button className="btn w-max" onClick={reflect} disabled={!transcript}>Reflect back</button>
      {reply && <div className="p-4 rounded border bg-white/70 whitespace-pre-wrap">{reply}</div>}
      <p className="text-xs text-gray-500">Disclaimer: For reflection only. Not therapy or clergy.</p>
    </div>
  );
}
