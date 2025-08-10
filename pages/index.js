// FILE: /pages/index.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";

// --- Helper Functions ---
function setCookie(name, value, maxAgeDays = 365) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 3600;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax; Secure`;
}

function deleteCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;`;
}

// --- Component for Logged-In Users ---
const ActiveHomepage = () => {
  const [path, setPath] = useState("Universal");

  const handleLogout = () => {
    deleteCookie("ac_session");
    // This will trigger the useEffect in the main component to re-render as locked
    window.location.reload(); 
  };

  return (
    <>
      <nav className="topnav">
        <button onClick={handleLogout} className="btn ghost">Logout</button>
      </nav>
      <HeritageSelector path={path} onChange={setPath} />
      <OracleVoice path={path} />
    </>
  );
};


// --- Component for New, Logged-Out Visitors ---
const StaticHomepage = () => {
  return (
    <>
      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="TotalIora Logo" className="logo" />
        <h1 className="title">A quiet space to be heard.</h1>
        <p className="note">
          Speak to a compassionate guide aligned with your spiritual tradition. Your first session is always free.
        </p>
        <Link href="/register" className="btn cta">Register for Free Access</Link>
      </section>

      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pill">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>
                A quiet place to write, reflect, or pray. Light a virtual candle for your intentions. We don’t read or judge.
              </p>
            </header>
            <footer className="f">
              <Link href="/register" className="btn accent">Register to Open</Link>
            </footer>
          </article>
          <article className="card">
            <header className="h">
              <div className="pill">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>
                Ask for reflections and gentle advice woven from your tradition. Download your guide's write-up when it’s ready.
              </p>
            </header>
            <footer className="f">
              <Link href="/register" className="btn accent">Register to Get Yours</Link>
            </footer>
          </article>
        </div>
      </section>
    </>
  );
};

// --- Main Page Component ---
export default function Home() {
  const [unlocked, setUnlocked] = useState(false);
  const [loading, setLoading] = useState(true);

  // Gate logic: Check for session cookie to determine if user is logged in.
  useEffect(() => {
    // Support ?dev=on -> sets dev cookie for testing
    if (typeof window !== "undefined") {
      const usp = new URLSearchParams(window.location.search);
      if (usp.get("dev") === "on") setCookie("ac_dev", "1", 30);
    }

    const has = (n) => (typeof document !== "undefined" && document.cookie.includes(`${n}=`));
    const isDevBypass = has("ac_dev") || (typeof window !== "undefined" && window.location.hostname === "localhost");
    
    // ✅ The primary check: does a session cookie exist?
    const isRegistered = has("ac_session");

    setUnlocked(Boolean(isRegistered || isDevBypass));
    setLoading(false); // Stop loading once check is complete
  }, []);

  // While checking for the cookie, we can show a loading state
  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="page">
      {/* Conditionally render the correct view */}
      {unlocked ? <ActiveHomepage /> : <StaticHomepage />}
      
      <Footer />

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#ffffff, #f8fafc); }
        .loading-screen { display: flex; align-items: center; justify-content: center; min-height: 100vh; font-size: 1.2rem; color: #64748b; }

        .topnav { display:flex; justify-content:flex-end; padding:14px; }
        .btn { display:inline-block; padding:10px 16px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; text-decoration: none; text-align: center; }
        .btn.ghost { background: transparent; border-color: #cbd5e1; color: #475569; }
        .btn.cta { color:#fff; border:none; background:linear-gradient(135deg,#7c3aed,#14b8a6); padding: 12px 24px; font-size: 1rem; margin-top: 1rem; }

        .hero { text-align:center; padding: 2rem 1rem 1rem; }
        .logo { width:148px; height:auto; margin:0 auto; display:block; }
        .title { font-size: 2rem; margin: 1rem 0 0.5rem; color: #1e293b; }
        .note { max-width:480px; margin: 0 auto; color:#475569; padding:0 12px; line-height: 1.6; }

        .tiles { max-width:1100px; margin:2rem auto 6px; padding:0 16px; }
        .grid { display:grid; gap:14px; grid-template-columns:1fr; }
        @media (min-width:900px){ .grid { grid-template-columns:1fr 1fr; } }
        .card { background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; box-shadow:0 10px 30px rgba(2,6,23,.08); padding:18px; display: flex; flex-direction: column; }
        .h { flex-grow: 1; }
        .pill { display:inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h3 { margin:8px 0 4px; font-size:1.25rem; font-weight:800; color:#0f172a; }
        p { color:#475569; margin-top: 0.5rem; }
        .f { margin-top:1.5rem; }
        .btn.accent { width: 100%; color:#fff; background:linear-gradient(135deg,#6d28d9,#14b8a6); border:none; }
      `}</style>
    </div>
  );
}
