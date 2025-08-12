// FILE: /pages/subjects/index.js
// Lists all subjects and links to each dedicated page. No layout changes to your index page.

import Link from "next/link";
import { SUBJECTS } from "../../lib/subjects-catalog";

export default function SubjectsHome() {
  const groups = [
    ["themes", "Core spiritual themes"],
    ["life", "Life situations"],
    ["work", "Work & practical life"],
    ["world", "Community & world"],
    ["stages", "Life stages"],
    ["special", "Special topics"],
  ];

  return (
    <main className="wrap">
      <h1>Subjects</h1>
      {groups.map(([key, title]) => {
        const items = SUBJECTS.filter(s => s.group === key && !s.isStyle);
        if (!items.length) return null;
        return (
          <section key={key} className="group">
            <h2>{title}</h2>
            <div className="grid">
              {items.map(s => (
                <Link key={s.slug} href={`/subjects/${s.slug}`} className="card">
                  <div className="label">{s.label}</div>
                  <div className="hint">{(s.seeds||[]).slice(0,2).join(" • ")}</div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}
      <style jsx>{`
        .wrap{max-width:1100px;margin:20px auto;padding:12px}
        h1{font-size:1.8rem;font-weight:800;margin:4px 0 12px}
        h2{font-size:1.2rem;margin:12px 0 8px;color:#334155}
        .grid{display:grid;gap:10px;grid-template-columns:1fr}
        @media(min-width:760px){.grid{grid-template-columns:1fr 1fr}}
        .card{display:block;background:#fff;border:1px solid rgba(2,6,23,.08);border-radius:14px;padding:12px;
          box-shadow:0 8px 24px rgba(2,6,23,.06)}
        .label{font-weight:800;color:#0f172a}
        .hint{color:#64748b;margin-top:4px;font-size:.92rem}
      `}</style>
    </main>
  );
}
