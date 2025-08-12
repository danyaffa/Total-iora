// FILE: /pages/oracle-universe-dna.js
import { useState, useRef } from "react";
import Footer from "@/components/Footer";

export default function OracleUniverseDNA() {
  const [form, setForm] = useState({ name: "", birth: "", place: "", path: "Universal", question: "" });
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState("");
  const [citations, setCitations] = useState([]);
  const [showCites, setShowCites] = useState(true);
  const citeRef = useRef(null);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function generate() {
    setLoading(true);
    setReport(""); setCitations([]); setShowCites(true);
    try {
      const r = await fetch("/api/dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      setReport(data?.report || "I’m here with you.");
      setCitations(Array.isArray(data?.citations) ? data.citations : []);
      setTimeout(() => { try { citeRef.current?.scrollIntoView({ behavior: "smooth" }); } catch {} }, 50);
    } catch {
      setReport("Network issue. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function exportText() {
    const lines = [];
    lines.push(`Oracle Universe DNA — ${new Date().toLocaleString()}`);
    lines.push(`Name: ${form.name} | Birth: ${form.birth || "—"} | Place: ${form.place || "—"} | Path: ${form.path}`);
    lines.push("");
    lines.push("Question:");
    lines.push(form.question || "—");
    lines.push("");
    lines.push("Report:");
    lines.push(report || "—");
    if (citations.length) {
      lines.push("");
      lines.push("Citations:");
      citations.forEach((c,i) => {
        lines.push(`[${c.index ?? i+1}] ${c.work}${c.author ? " — " + c.author : ""}${c.url ? " <"+c.url+">" : ""}`);
        if (c.quote) lines.push(`“${c.quote}”`);
        if (c.reason) lines.push(`Reason: ${c.reason}`);
        lines.push("");
      });
    }
    return lines.join("\n");
  }

  function download() {
    const blob = new Blob([exportText()], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const safeName = (form.name || "oracle-universe-dna").replace(/[^a-z0-9\-_.]/gi, "_").toLowerCase();
    a.href = url; a.download = `${safeName}.txt`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  function printDoc() {
    const html = exportText().replace(/\n/g, "<br/>");
    const w = window.open("", "_blank", "noopener,noreferrer"); if (!w) return;
    w.document.write(`<html><head><title>Oracle Universe DNA</title>
      <meta name="viewport" content="width=device-width, initial-scale=1"/>
      <style>body{font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Arial;padding:24px;color:#0f172a}
      .box{border:1px solid #e2e8f0;border-radius:12px;padding:16px;background:#fff}</style>
      </head><body><h1>Oracle Universe DNA</h1><div class="box">${html}</div><script>window.print()</script></body></html>`);
    w.document.close();
  }

  return (
    <div className="wrap">
      <header className="hero">
        <div className="pill">Oracle Universe DNA</div>
        <h1>Your Personal Map</h1>
        <p>Ask for a future outlook, horoscope-style reflection, and gentle advice woven from your tradition.</p>
      </header>

      <main className="card">
        <div className="grid">
          <label> Name
            <input value={form.name} onChange={set("name")} placeholder="Your name" />
          </label>
          <label> Birthdate (optional)
            <input type="date" value={form.birth} onChange={set("birth")} />
          </label>
          <label> Birthplace or City (optional)
            <input value={form.place} onChange={set("place")} placeholder="e.g., Jerusalem" />
          </label>
          <label> Tradition / Path
            <select value={form.path} onChange={set("path")}>
              {["Muslim","Christian","Jewish","Eastern","Universal"].map(p => <option key={p}>{p}</option>)}
            </select>
          </label>
        </div>

        <label className="block"> What would you like guidance on?
          <textarea rows={6} value={form.question} onChange={set("question")} placeholder="Tell me what’s on your mind…" />
        </label>

        <div className="actions">
          <button className="btn accent" onClick={generate} disabled={loading}>{loading ? "Creating…" : "Create My DNA"}</button>
          <button className="btn" onClick={download} disabled={!report}>Download</button>
          <button className="btn" onClick={printDoc} disabled={!report}>Print</button>
          <button className="btn" onClick={() => { setShowCites(true); citeRef.current?.scrollIntoView({behavior:"smooth"}); }} disabled={!citations.length}>
            Source
          </button>
        </div>

        {report && (
          <pre className="report">{report}</pre>
        )}

        {!!citations.length && (
          <div ref={citeRef} className="citations">
            <button className="linkbtn" onClick={() => setShowCites(s => !s)}>
              {showCites ? "Hide sources" : `Show sources (${citations.length})`}
            </button>
            {showCites && (
              <ul className="srclist">
                {citations.map((c,i)=>(
                  <li key={`c-${c.index ?? i}`}>
                    <div className="sline">
                      <strong className="work">{c.work}</strong>
                      {c.author ? <span className="author"> — {c.author}</span> : null}
                      {c.url ? <a href={c.url} target="_blank" rel="noreferrer">open ↗</a> : null}
                    </div>
                    {c.quote ? <div className="quote">“{c.quote}”</div> : null}
                    {c.reason ? <div className="reason">Reason: {c.reason}</div> : null}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <p className="disc">
          Spiritual guidance only; presence over promises. No medical, legal, or financial advice.
        </p>
      </main>

      <Footer />

      <style jsx>{`
        .wrap { min-height:100vh; background:linear-gradient(#fff,#f8fafc); padding: 18px 12px 40px; }
        .hero { text-align:center; margin-bottom:10px; }
        .pill { display:inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h1 { margin:8px 0 6px; font-size:1.8rem; font-weight:800; color:#0f172a; }
        .card { max-width: 1000px; margin: 0 auto; background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; padding:16px; box-shadow:0 10px 30px rgba(2,6,23,.08); }
        .grid { display:grid; gap:10px; grid-template-columns: 1fr; }
        @media (min-width:900px){ .grid { grid-template-columns: repeat(4, 1fr); } }
        label { color:#334155; font-weight:700; font-size:.95rem; display:flex; flex-direction:column; gap:6px; }
        input, select, textarea { border:1px solid #e2e8f0; border-radius:12px; padding:10px 12px; font-size:1rem; }
        textarea { resize:vertical; }
        .block { margin-top:10px; }
        .actions { display:flex; gap:10px; flex-wrap:wrap; margin-top:12px; }
        .btn { padding:12px 18px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .report { white-space:pre-wrap; margin-top:12px; background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:12px 14px; }
        .citations { margin-top:12px; }
        .srclist { list-style:none; display:grid; gap:10px; padding-left:0; }
        .sline { display:flex; gap:8px; flex-wrap:wrap; align-items:baseline; }
        .work { color:#0f172a; }
        .author { color:#475569; }
        .quote { color:#334155; margin-top:2px; white-space:pre-wrap; border-left:3px solid #e2e8f0; padding-left:8px; }
        .reason { color:#64748b; font-size:.92rem; }
        .linkbtn{border:none;background:transparent;color:#1d4ed8;font-weight:700;cursor:pointer;padding:6px 0}
        .disc { color:#64748b; font-size:.92rem; margin-top:10px; }
      `}</style>
    </div>
  );
}
