// FILE: /components/AccessGate.jsx
import { useEffect, useState } from "react";
import Link from "next/link";

export default function AccessGate() {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        // Open-for-all overrides (optional)
        if (process.env.NEXT_PUBLIC_ORACLE_OPEN_FOR_ALL === "1") {
          setUnlocked(true); setChecking(false); return;
        }
        if (typeof window !== "undefined") {
          const sp = new URLSearchParams(window.location.search);
          if (sp.get("open") === "all" || sp.get("dev") === "on") {
            localStorage.setItem("oracle_open_for_all", "1");
          }
          if (localStorage.getItem("oracle_open_for_all") === "1") {
            setUnlocked(true); setChecking(false); return;
          }
        }
        // Real session check (no index changes)
        const r = await fetch("/api/auth/whoami", { credentials: "include" });
        setUnlocked(r.ok);
      } catch {
        setUnlocked(false);
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking || unlocked) return null;

  // Full-page overlay that blocks clicks but doesn't alter your layout underneath
  return (
    <>
      <div className="oracle-gate" role="dialog" aria-modal="true" aria-label="Sign in required">
        <div className="panel">
          <h2>Welcome</h2>
          <p>This page is read-only until you sign in.</p>
          <div className="row">
            <Link href="/register" className="btn accent">Register — Free</Link>
            <Link href="/login" className="btn">Log in</Link>
          </div>
        </div>
      </div>

      <style jsx>{`
        .oracle-gate {
          position: fixed; inset: 0; z-index: 9999;
          display: grid; place-items: center;
          backdrop-filter: blur(2px);
          background: rgba(248, 250, 252, 0.55);
        }
        .panel {
          text-align: center;
          background: #fff;
          border: 1px solid rgba(15,23,42,.08);
          border-radius: 20px;
          padding: 18px 16px;
          box-shadow: 0 10px 30px rgba(2,6,23,.10);
          max-width: 520px;
        }
        h2 { margin: 0 0 6px; font-size: 1.25rem; font-weight: 800; color: #0f172a; }
        p  { margin: 2px 0 10px; color: #334155; }
        .row { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
        .btn { padding: 12px 18px; border-radius: 14px; font-weight: 800; border: 1px solid rgba(15,23,42,.12); background: #fff; }
        .btn.accent { color: #fff; background: linear-gradient(135deg,#7c3aed,#14b8a6); border: none; }
      `}</style>
    </>
  );
}
