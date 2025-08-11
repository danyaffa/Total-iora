import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";

export default function Home() {
  const [path, setPath] = useState("Universal");
  const [locked, setLocked] = useState(true); // Ensures the page is locked on initial load

  // This effect checks the user's session and unlocks the page if they are logged in.
  useEffect(() => {
    // A simple client-side check for the registration cookie for faster UI feedback
    const hasRegisteredCookie = typeof document !== 'undefined' && document.cookie.includes('ac_registered=1');
    if (hasRegisteredCookie) {
        setLocked(false);
    }

    // A more secure check against the server to confirm the session
    async function checkServerSession() {
      try {
        const r = await fetch("/api/auth/whoami", { credentials: "include" });
        setLocked(!r.ok); // Unlock only if the server confirms the session with a 200 OK
      } catch {
        setLocked(true); // If the API call fails, ensure the page remains locked
      }
    }

    // We run the server check to get the true status
    checkServerSession();
    
    // We can periodically re-check if needed, for example if the user logs in in another tab
    const id = setInterval(checkServerSession, 5000); 
    return () => clearInterval(id);
  }, []);

  return (
    <div className="page">
      {/* Top nav — Register always visible */}
      <nav className="topnav">
        <Link href="/register" className="btn cta">Register — Free Access</Link>
      </nav>

      {/* Logo + short line */}
      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="TotalIora Logo" className="logo" />
        <p className="note">
          Advanced Voice is now <strong>Total-Iora Voice</strong>. Choose your spiritual heritage,
          or start with Sacred Notes.
        </p>
      </section>

      {/* Read-only banner shown when not logged in */}
      {locked && (
        <div className="previewBanner" role="status">
          You’re viewing a read-only preview. <Link href="/login">Log in</Link> or{" "}
          <Link href="/register">Register</Link> to use the interactive features.
        </div>
      )}

      {/* Feature tiles */}
      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pill">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>
                Your quiet place. Write, cry, pray, whisper. Light a candle. We don’t read or judge.
                <strong> Nothing is stored or kept.</strong>
              </p>
            </header>
            <footer className="f">
              {locked ? (
                <Link href="/login" className="btn accent" aria-disabled="true">Log in to Open</Link>
              ) : (
                <Link href="/sacred-space" className="btn accent">Open Sacred Notes</Link>
              )}
              <div className="disc">
                This is your space. Do whatever you like on this page. We have no responsibility
                for anything you write, and nothing is saved on our servers.
              </div>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pill">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>
                Ask for a future outlook, horoscope-style reflections, and gentle advice woven from your tradition.
                Download your write-up when it’s ready.
              </p>
            </header>
            <footer className="f">
              {locked ? (
                <Link href="/login" className="btn accent" aria-disabled="true">Log in to Get Yours</Link>
              ) : (
                <Link href="/oracle-universe-dna" className="btn accent">Get Your Oracle Universe DNA</Link>
              )}
              <div className="disc">
                Spiritual guidance only. No promises. No medical, legal, or financial advice.
              </div>
            </footer>
          </article>
        </div>
      </section>

      {/* The 'inert' attribute blocks keyboard focus and interaction */}
      <div
        className={`main${locked ? " preview-locked" : ""}`}
        inert={locked ? "" : undefined}
        aria-disabled={locked ? "true" : "false"}
      >
        <HeritageSelector path={path} onChange={setPath} />
        <OracleVoice path={path} />
      </div>

      <Footer />

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#ffffff,#f8fafc); }

        .topnav { display:flex; justify-content:center; padding:14px; }
        .btn { display:inline-block; padding:10px 16px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.cta { color:#fff; border:none; background:linear-gradient(135deg,#7c3aed,#14b8a6); }

        .hero { text-align:center; padding-top:8px; }
        .logo { width:148px; height:auto; margin:0 auto; display:block; }
        .note { max-width:820px; margin:10px auto 0; color:#475569; padding:0 12px; }

        .tiles { max-width:1100px; margin:10px auto 6px; padding:0 16px; }
        .grid { display:grid; gap:14px; grid-template-columns:1fr; }
        @media (min-width:900px){ .grid { grid-template-columns:1fr 1fr; } }
        .card { background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; box-shadow:0 10px 30px rgba(2,6,23,.08); padding:18px; }
        .pill { display:inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h3 { margin:8px 0 4px; font-size:1.25rem; font-weight:800; color:#0f172a; }
        p { color:#475569; }
        .f { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .disc { color:#64748b; font-size:.92rem; }

        .previewBanner {
          margin: 8px auto 0; max-width: 1100px; padding: 10px 14px;
          background: #fffbe6; border: 1px solid #facc15; border-radius: 10px;
          color: #713f12; text-align: center; font-weight: 600;
        }
        .previewBanner a { color: #1d4ed8; text-decoration: underline; }

        .main.preview-locked a,
        .main.preview-locked button,
        .main.preview-locked [role="button"],
        .main.preview-locked input,
        .main.preview-locked select,
        .main.preview-locked textarea {
          pointer-events: none !important;
          opacity: .85;
        }
      `}</style>
    </div>
  );
}
