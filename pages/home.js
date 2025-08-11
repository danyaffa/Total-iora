// FILE: /pages/home.js  (REAL INDEX — interactive; redirects to /login if not signed in)
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";

export default function Home() {
  const router = useRouter();
  const [path, setPath] = useState("Universal");
  const [locked, setLocked] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function check() {
      try {
        const r = await fetch("/api/auth/whoami", { credentials: "include" });
        const ok = r.ok;
        setLocked(!ok);
        setChecked(true);
        if (!ok) router.replace("/login");
      } catch {
        setLocked(true);
        setChecked(true);
        router.replace("/login");
      }
    }
    check();
  }, [router]);

  if (!checked) {
    return (
      <div style={{padding:"40px", textAlign:"center", color:"#475569"}}>
        Checking your session…
      </div>
    );
  }

  return (
    <div className="page">
      <nav className="topnav">
        <Link href="/logout" className="btn">Log out</Link>
      </nav>

      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="TotalIora Logo" className="logo" />
        <p className="note">
          Welcome back to <strong>Total-Iora Voice</strong>. Choose your spiritual heritage or start with Sacred Notes.
        </p>
      </section>

      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pill">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>Your quiet place. <strong>Nothing is stored or kept.</strong></p>
            </header>
            <footer className="f">
              <Link href="/sacred-space" className="btn accent">Open Sacred Notes</Link>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pill">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>Ask for a future outlook and gentle advice woven from your tradition.</p>
            </header>
            <footer className="f">
              <Link href="/oracle-universe-dna" className="btn accent">Get Your Oracle Universe DNA</Link>
            </footer>
          </article>
        </div>
      </section>

      {/* Remount on unlock -> Oracle starts clean (no old text) */}
      <div className="main">
        <HeritageSelector path={path} onChange={setPath} />
        <OracleVoice key="live" path={path} />
      </div>

      <Footer />

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#ffffff,#f8fafc); }
        .topnav { display:flex; justify-content:center; padding:14px; }
        .btn { display:inline-block; padding:10px 16px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .hero { text-align:center; padding-top:8px; }
        .logo { width:148px; height:auto; margin:0 auto; display:block; }
        .note { max-width:820px; margin:10px auto 0; color:#475569; padding:0 12px; }
        .tiles { max-width:1100px; margin:10px auto 6px; padding:0 16px; }
        .grid { display:grid; gap:14px; grid-template-columns:1fr; }
        @media (min-width:900px){ .grid { grid-template-columns:1fr 1fr; } }
        .card { background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; box-shadow:0 10px 30px rgba(2,6,23,.08); padding:18px; }
        .pill { display:inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        .f { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
      `}</style>
    </div>
  );
}
