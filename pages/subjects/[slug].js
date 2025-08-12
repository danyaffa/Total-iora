// FILE: /pages/subjects/[slug].js
// One page that serves EVERY subject: sacred-first search + trusted resources.
// Mobile-first; no changes to your index layout.

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { SUBJECT_INDEX } from "../../lib/subjects-catalog";

export default function SubjectPage() {
  const router = useRouter();
  const { slug } = router.query;
  const meta = SUBJECT_INDEX[String(slug||"")] || { label:"Subject", seeds:[] };

  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [quotes, setQuotes] = useState([]);

  // Optional: read ?path=Jewish|Muslim|Christian|Eastern|Universal
  const path = useMemo(() => {
    const p = typeof router.query.path === "string" ? router.query.path : "Universal";
    return ["Jewish","Muslim","Christian","Eastern","Universal"].includes(p) ? p : "Universal";
  }, [router.query.path]);

  useEffect(() => { setQ(meta.seeds?.[0] || ""); }, [slug]);

  async function runSearch() {
    const query = q.trim(); if (!query) return;
    setLoading(true); setQuotes([]);
    try {
      const r = await fetch("/api/subjects/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, path, max: 8 })
      });
      const js = await r.json().catch(()=>({}));
      setQuotes(js?.quotes || []);
    } finally { setLoading(false); }
  }

  return (
    <main className="wrap">
      <header className="hero">
        <h1>{meta.label}</h1>
        <p className="sub">Sacred-first results from trusted sources. Then you can refine in the Oracle.</p>
      </header>

      <section className="search">
        <div className="row">
          <input
            className="box"
            value={q}
            onChange={(e)=>setQ(e.target.value)}
            placeholder={`Search sacred texts about ${meta.label.toLowerCase()}…`}
          />
          <button className="btn" onClick={runSearch} disabled={loading}>{loading ? "Searching…" : "Search"}</button>
        </div>
        <div className="help">
          Try: {(meta.seeds||[]).slice(0,3).map((s,i)=>(
            <button key={i} className="chip" onClick={()=>setQ(s)}>{s}</button>
          ))}
        </div>
      </section>

      <section className="results">
        {!loading && quotes.length === 0 ? <div className="empty">No quotes yet. Search above.</div> : null}
        {quotes.map((q,i)=>(
          <article key={i} className="card">
            <div className="src">{q.work}</div>
            <div className="text">{q.text}</div>
            <a className="link" href={q.url} target="_blank" rel="noreferrer">Open source ↗</a>
          </article>
        ))}
      </section>

      {!!(meta.resources && meta.resources.length) && (
        <section className="resources">
          <h2>Trusted resources</h2>
          <ul>
            {meta.resources.map((r,i)=>(
              <li key={i}><a href={r.url} target="_blank" rel="noreferrer">{r.title}</a></li>
            ))}
          </ul>
        </section>
      )}

      <footer className="foot">
        <Link href="/subjects">← All subjects</Link>
      </footer>

      <style jsx>{`
        .wrap{max-width:1100px;margin:16px auto;padding:12px}
        .hero h1{font-size:1.6rem;font-weight:800;margin:0}
        .sub{color:#475569;margin-top:6px}
        .search{margin-top:12px}
        .row{display:flex;gap:8px}
        .box{flex:1;padding:12px;border:1px solid #e2e8f0;border-radius:12px}
        .btn{padding:12px 16px;border-radius:12px;font-weight:800;border:1px solid rgba(15,23,42,.12);background:#fff}
        .help{margin-top:8px;display:flex;flex-wrap:wrap;gap:8px}
        .chip{padding:6px 10px;border:1px solid #e2e8f0;border-radius:999px;background:#fff}
        .results{margin-top:14px;display:grid;gap:10px}
        .empty{color:#64748b}
        .card{background:#fff;border:1px solid rgba(2,6,23,.08);border-radius:14px;padding:12px}
        .src{font-size:.9rem;color:#334155;font-weight:700;margin-bottom:6px}
        .text{color:#0f172a;white-space:pre-wrap}
        .link{display:inline-block;margin-top:6px;color:#1d4ed8}
        .resources{margin-top:18px}
        .resources h2{font-size:1.1rem;margin:0 0 6px}
        .resources ul{margin:0;padding-left:18px}
        .foot{margin:20px 0;color:#1f2937}
      `}</style>
    </main>
  );
}
