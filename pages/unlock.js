// FILE: /pages/unlock.js
import { useEffect } from "react";
import { useRouter } from "next/router";
import { isFree, PLANS } from "../lib/monetization";

function PlanCard({ name, priceLabel, href }) {
  return (
    <div className="card">
      <h3>{name}</h3>
      <div className="price">{priceLabel}</div>
      <a className="btn" href={href} target="_blank" rel="noreferrer">Continue</a>
      <style jsx>{`
        .card { background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:16px; padding:16px;
                box-shadow:0 10px 30px rgba(2,6,23,.08); text-align:center; }
        .price { font-size:1.6rem; font-weight:800; margin:6px 0 10px; color:#0f172a; }
        .btn { display:inline-block; padding:10px 14px; border-radius:12px; font-weight:800; color:#fff;
               background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
      `}</style>
    </div>
  );
}

export default function Unlock() {
  const router = useRouter();

  // Today (free): just send people home. Nothing rendered.
  useEffect(() => {
    if (isFree()) router.replace("/");
  }, [router]);

  if (isFree()) return null;

  // Future (when you flip FREE_MODE=false and add PLANS):
  return (
    <div className="wrap">
      <header className="hero">
        <h1>Choose a Plan</h1>
        <p>Upgrade when you're ready.</p>
      </header>

      <main className="grid">
        {PLANS.map((p) => (
          <PlanCard key={p.id} name={p.name} priceLabel={p.priceLabel} href={p.href} />
        ))}
      </main>

      <style jsx>{`
        .wrap { min-height:100vh; background:linear-gradient(#fff,#f8fafc); padding:28px 16px 40px; }
        .hero { text-align:center; }
        .grid { display:grid; gap:14px; grid-template-columns:1fr; max-width:900px; margin:16px auto 0; }
        @media (min-width:860px){ .grid { grid-template-columns:repeat(2,1fr); } }
      `}</style>
    </div>
  );
}
