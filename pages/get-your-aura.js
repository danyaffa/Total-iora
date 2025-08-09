import { useState } from "react";
import AuraForm from "../components/AuraForm";
import { generateAuraCode } from "../lib/generateAuraCode";

export default function GetYourAura() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function submit(form) {
    try {
      setLoading(true);
      const { code, color } = generateAuraCode(form.name, form.dob);
      const res = await fetch('/api/aura', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ ...form, code, color })
      });
      const data = await res.json();
      setResult({ code, color, reading: data.reading });
    } finally { setLoading(false); }
  }

  return (
    <div className="grid gap-6">
      <h2 className="text-2xl font-bold">Reveal your AuraCode</h2>
      <p className="text-gray-600">Fill a few details. Receive a symbolic, empowering reflection. No promises. Only presence.</p>
      <AuraForm onSubmit={submit} />
      {loading && <p>Decoding your energy…</p>}
      {result && (
        <div className="p-6 rounded-2xl border bg:white/70 shadow-sm">
          <p className="font-mono">{result.code} · {result.color}</p>
          <div className="mt-3 whitespace-pre-wrap">{result.reading}</div>
        </div>
      )}
    </div>
  );
}
