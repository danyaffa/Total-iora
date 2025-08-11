// FILE: /pages/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import OracleVoice from "../components/OracleVoice";
import Footer from "../components/Footer";

// Helper: check session OR open-for-all overrides
async function checkAccess() {
  try {
    // 1) Env flag (build-time)
    if (process.env.NEXT_PUBLIC_ORACLE_OPEN_FOR_ALL === "1") return true;

    // 2) URL param (first launch)
    if (typeof window !== "undefined") {
      const sp = new URLSearchParams(window.location.search);
      if (sp.get("open") === "all" || sp.get("dev") === "on") {
        localStorage.setItem("oracle_open_for_all", "1");
      }
      // 3) Local storage override (persistent)
      if (localStorage.getItem("oracle_open_for_all") === "1") return true;
    }

    // 4) Normal session check
    const r = await fetch("/api/auth/whoami", { credentials: "include" });
    return r.ok;
  } catch {
    return false;
  }
}

const ROOMS = [
  { key: "Universal", label: "Universal", emoji: "🌍" },
  { key: "Jewish",    label: "Jewish",    emoji: "✡️" },
  { key: "Christian", label: "Christian", emoji: "✝️" },
  { key: "Muslim",    label: "Muslim",    emoji: "☪️" },
  { key: "Eastern",   label: "Eastern",   emoji: "🕉️" },
];

export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [path, setPath] = useState("Universal");

  useEffect(() => {
    (async () => {
      setUnlocked(await checkAccess());
      setChecking(false);
    })();
  }, []);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("oracle_room");
      if (saved && ROOMS.find(r => r.key === saved)) setPath(saved);
    } catch {}
  }, []);

  useEffect(() => {
    try { localStorage.setItem("oracle_room", path); } catch {}
  }, [path]);

  return (
    <div className="wrap">
      <header className="hero">
        <h1>Oracle</h1>
        <p>Your private space for questions and answers.</p>
      </header>

      {/* LOCKED (read-only) if not unlocked */}
      {!unlocked && !checking && (
        <main className="card" inert="">
          <div className="locked">
            <p>This page is read-only until you sign in.</p>
            <div className="row">
              <Link href="/register" className="btn accent">Register — Free</Link>
              <Link href="/login" className="btn">Log in</Link>
            </div>
            <p style={{marginTop:10, fontSize:".85rem", color:"#94a3b8"}}>
              Tip for launch: add <code>?open=all</code> to the URL once to open without login.
            </p>
          </div>
        </main>
      )}

      {/* UNLOCKED */}
      {unlocked && !checking && (
        <main className="card">
          <div className="rooms" role="tablist" aria-label="Select room">
            {ROOMS.map(r => (
              <button
                key={r.key}
                role="tab"
                aria-selected={path === r.key}
                className={`room ${path === r.key ? "on" : ""}`}
                onClick={() => setPath(r.key)}
              >
                <span className="e">{r.emoji}</span>
                <span className="t">{r.label}</span>
              </button>
            ))}
          </div>
          <OracleVoice path={path} />
        </main>
      )}

      <Footer />

      <style jsx>{`
        .wrap { min-height:100vh; background:linear-gradient(#fff,#f8fafc); padding:22px 12px 40px; }
        .hero { text-align:center; }
        h1 { margin:8px 0 6px; font-size:2rem; font-weight:800; color:#0f172a; }
        .card { max-width:1100px; margin:12px auto 0; background:#fff; border:1px solid rgba(15,23,42,.08);
                border-radius:20px; padding:16px; box-shadow:0 10px 30px rgba(2,6,23,.08); }
        .locked { text-align:center; padding:24px 8px; color:#334155; }
        .row { display:flex; gap:10px; justify-content:center; margin-top:10px; flex-wrap:wrap; }
        .btn { padding:12px 18px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }

        .rooms { display:flex; gap:10px; flex-wrap:wrap; justify-content:center; margin:4px 4px 14px; }
        .room { display:flex; align-items:center; gap:8px; padding:10px 14px; border-radius:999px; border:1px solid #e2e8f0;
                background:#fff; font-weight:800; color:#334155; box-shadow:0 2px 6px rgba(2,6,23,.04); }
        .room .e { font-size:1.1rem; line-height:1; }
        .room.on { color:#0b1020; border-color:#c7d2fe; background:linear-gradient(180deg,#eef2ff,#ffffff);
                   box-shadow:0 6px 16px rgba(2,6,23,.08); }
        .room:focus { outline:2px solid #818cf8; outline-offset:2px; }
      `}</style>
    </div>
  );
}
