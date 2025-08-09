import { useState } from "react";

const templates = [
  { key:'children', text:'May my children grow in wisdom and light.' },
  { key:'healing', text:'Please bring healing to my body and calm to my spirit.' },
  { key:'love', text:'Help me find a love that sees my soul.' },
  { key:'purpose', text:'Guide my steps toward the work that is truly mine.' },
  { key:'peace', text:'Grant peace to my home and those I love.' },
];

export default function Wall(){
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [candle, setCandle] = useState(false);

  async function save(type) {
    setStatus("Saving…");
    const res = await fetch('/api/wall', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ note, candle:(type==='candle') })
    });
    const ok = res.ok; setStatus(ok? 'Saved to the Aura Wall.' : 'Failed to save.');
  }
  return (
    <div className="grid gap-6">
      <h2 className="text-2xl font-bold">The Aura Wall</h2>
      <p className="text-gray-600">Leave a private note in the sacred silence. Light a candle. We don’t read or judge; we hold space.</p>
      <div className="flex flex-wrap gap-2">
        {templates.map(t => (
          <button key={t.key} className="btn" onClick={()=> setNote(t.text)}>{t.key}</button>
        ))}
      </div>
      <textarea value={note} onChange={e=>setNote(e.target.value)} rows={5} className="input w-full" placeholder="Write — or choose a template above"></textarea>
      <div className="flex gap-3">
        <button className="btn" onClick={()=>save('note')}>Place Note</button>
        <button className="btn" onClick={()=>{setCandle(true); save('candle')}}>Light Candle</button>
      </div>
      {status && <p className="text-sm text-gray-600">{status}</p>}
      {candle && <div className="mt-4 p-6 rounded-2xl border grid place-items-center bg-black/80 text-white">
        <div className="animate-pulse text-6xl">🕯️</div>
        <p className="mt-3 text-sm">A candle has been lit for your intention.</p>
      </div>}
      <p className="text-xs text-gray-500">Privacy: Notes are private, stored securely, auto-deleted after 12 months.</p>
    </div>
  );
}
