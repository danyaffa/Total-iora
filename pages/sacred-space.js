import { useRouter } from "next/router";
import { useState } from "react";
import { Candle, StarOfDavid, Cross, Crescent, Om } from "../components/Icons";

const templates = [
  { key:'children', text:'May my children grow in wisdom and light.' },
  { key:'healing', text:'Please bring healing to my body and calm to my spirit.' },
  { key:'love', text:'Help me find a love that sees my soul.' },
  { key:'purpose', text:'Guide my steps toward the work that is truly mine.' },
  { key:'peace', text:'Grant peace to my home and those I love.' },
];

function Heading({ path }){
  const map = {
    Jewish:    { title:"Quiet notes before the Western Wall", icon:<StarOfDavid className="text-gray-700"/> },
    Christian: { title:"Quiet notes within the Church",       icon:<Cross className="text-gray-700"/> },
    Muslim:    { title:"Quiet notes facing Mecca",            icon:<Crescent className="text-gray-700"/> },
    Eastern:   { title:"Quiet notes within the Temple",       icon:<Om className="text-gray-700"/> },
    Universal: { title:"Quiet notes in the Sanctuary",        icon:<Candle className="text-gray-700"/> },
  };
  const m = map[path||"Universal"];
  return <div className="flex items-center gap-2"><div>{m.icon}</div><h2 className="text-2xl font-bold">{m.title}</h2></div>;
}

export default function SacredSpace(){
  const router = useRouter();
  const path = (router.query.path || "Universal")+"";
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [candle, setCandle] = useState(false);

  async function save(type){
    setStatus("Saving…");
    const res = await fetch('/api/wall', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ note, candle:(type==='candle') }) });
    setStatus(res.ok? "Your note rests in the sacred silence." : "Could not save.");
  }

  return (
    <div className="grid gap-6">
      <Heading path={path}/>
      <p className="text-gray-600">Leave a private note. Light a candle. We don’t read or judge; we hold space.</p>
      <div className="flex flex-wrap gap-2">
        {templates.map(t => <button key={t.key} className="btn" onClick={()=> setNote(t.text)}>{t.key}</button>)}
      </div>
      <textarea value={note} onChange={e=>setNote(e.target.value)} rows={5} className="input w-full" placeholder="Write your note here, or choose a template above"></textarea>
      <div className="flex gap-3">
        <button className="btn" onClick={()=>save('note')}>Place Note</button>
        <button className="btn" onClick={()=>{setCandle(true); save('candle');}}>Light Candle</button>
      </div>
      {status && <p className="text-sm text-gray-600">{status}</p>}
      {candle && <div className="mt-4 p-6 rounded-2xl border grid place-items-center bg-black/80 text-white">
        <div className="animate-pulse text-6xl">🕯️</div>
        <p className="mt-3 text-sm">A candle has been lit for your intention.</p>
      </div>}
      <p className="text-xs text-gray-500">Privacy & Integrity: symbolic reflections only; notes are private and may be deleted after 12 months.</p>
    </div>
  );
}
