import { useRouter } from "next/router";
import { useState } from "react";
import AnimatedCandle from "../components/AnimatedCandle";

const templates = [
  { key:'children', text:'May my children grow in wisdom and light.' },
  { key:'healing', text:'Please bring healing to my body and calm to my spirit.' },
  { key:'love', text:'Help me find a love that sees my soul.' },
  { key:'purpose', text:'Guide my steps toward the work that is truly mine.' },
  { key:'peace', text:'Grant peace to my home and those I love.' },
];

export default function SacredSpace(){
  const router = useRouter();
  const path = (router.query.path || "Universal") + "";
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [candleLit, setCandleLit] = useState(false);

  async function save(type){
    setStatus("Saving…");
    const isCandle = type === 'candle';
    if (isCandle) setCandleLit(true);
    const res = await fetch('/api/wall', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ note, candle: isCandle }) });
    setStatus(res.ok ? "Your intention rests in the sacred silence." : "Could not save your note at this time.");
    // Clear candle after a while
    setTimeout(() => setCandleLit(false), 10000);
  }

  return (
    <div className="max-w-2xl mx-auto grid gap-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-slate-800">The Sanctuary</h1>
        <p className="mt-2 text-slate-500">Leave a private note. Light a candle. We don’t read or judge; we hold space.</p>
      </div>

      <div className="bg-white/60 p-6 rounded-2xl border border-slate-200 shadow-sm">
        <textarea 
          value={note} 
          onChange={e => setNote(e.target.value)} 
          rows={5} 
          className="input w-full" 
          placeholder="Write your note here..."
        ></textarea>
        <div className="flex flex-wrap gap-2 mt-3">
          <span className="text-xs text-slate-500 self-center">Templates:</span>
          {templates.map(t => <button key={t.key} className="btn-small ghost" onClick={()=> setNote(t.text)}>{t.key}</button>)}
        </div>
      </div>

      <div className="flex justify-center gap-4">
        <button className="btn btn-soft" onClick={()=>save('note')} disabled={!note}>Place Note</button>
        <button className="btn btn-accent" onClick={()=>save('candle')}>Light a Candle</button>
      </div>
      
      {status && <p className="text-sm text-center text-slate-600">{status}</p>}
      
      {candleLit && (
        <div className="mt-4 p-6 rounded-2xl grid place-items-center text-center">
          <AnimatedCandle />
          <p className="mt-3 text-sm text-slate-700 font-medium">A candle has been lit for your intention.</p>
        </div>
      )}

      <p className="text-xs text-center text-slate-400 mt-6">
        Privacy & Integrity: notes are private and may be deleted after 12 months.
      </p>
    </div>
  );
}
