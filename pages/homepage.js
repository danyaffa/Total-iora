// FILE: /pages/homepage.js
import { useEffect, useState } from "react";
import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";
import AtmospherePicker from "../components/AtmospherePicker";

/* ---------------------------------- utils ---------------------------------- */
function setCookie(name, value, maxAgeDays = 365) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 3600;
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${isHttps ? "; Secure" : ""}`;
}

function normalizeFaith(s) {
  switch (String(s || "").toLowerCase()) {
    case "muslim": return "Muslim";
    case "christian": return "Christian";
    case "jewish": return "Jewish";
    case "eastern": return "Eastern";
    case "universal": return "Universal";
    default: return null;
  }
}

/* --------------------------- server-side detection -------------------------- */
export async function getServerSideProps(ctx) {
  const { req, res, query } = ctx;

  const qFaith      = normalizeFaith(query?.faith);
  const headerFaith = normalizeFaith(req.headers["x-faith"]);
  const cookieFaith = normalizeFaith(req.cookies?.faith);
  const envFaith    = normalizeFaith(process.env.FAITH_OVERRIDE);

  const faith = qFaith || headerFaith || cookieFaith || envFaith || "Universal";

  if (qFaith && qFaith !== cookieFaith) {
    const oneYear = 60 * 60 * 24 * 365;
    const isHttps = (req.headers["x-forwarded-proto"] || "").includes("https");
    res.setHeader(
      "Set-Cookie",
      `faith=${encodeURIComponent(qFaith)}; Max-Age=${oneYear}; Path=/; SameSite=Lax${isHttps ? "; Secure" : ""}`
    );
  }

  return { props: { faith } };
}

/* --------------------------------- icons ----------------------------------- */
function FaithIcon({ faith }) {
  if (faith === "Muslim") {
    return (
      <svg className="faith-icon gold" viewBox="0 0 52 52" aria-label="Muslim Crescent">
        <path d="M32 2 C18.7 2 8 12.7 8 26 C8 39.3 18.7 50 32 50 C33.7 50 35.4 49.8 37 49.5 C26.5 47.5 19 37.9 19 26 C19 14.1 26.5 4.5 37 2.5 C35.4 2.2 33.7 2 32 2Z" />
      </svg>
    );
  }
  if (faith === "Christian") {
    return (
      <svg className="faith-icon gold" viewBox="0 0 64 64" aria-label="Christian Cross">
        <path d="M28 8h8v16h12v8H36v24h-8V32H16v-8h12z" />
      </svg>
    );
  }
  if (faith === "Jewish") {
    return (
      <svg className="faith-icon blue" viewBox="0 0 64 64" aria-label="Star of David">
        <polygon points="32,6 40,20 56,20 44,32 50,48 32,40 14,48 20,32 8,20 24,20" />
      </svg>
    );
  }
  return null;
}

/* --------------------------------- page ------------------------------------ */
export default function HomePage({ faith }) {
  const [path, setPath] = useState(faith);
  const [unlocked, setUnlocked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const usp = new URLSearchParams(window.location.search);
      if (usp.get("dev") === "on") setCookie("ac_dev", "1", 30);
    }
    const update = () => {
      const has = (n) => (typeof document !== "undefined" && document.cookie.includes(`${n}=`));
      const isDevBypass = (typeof window !== "undefined" &&
        (process.env.NEXT_PUBLIC_DEV_BYPASS === "1" || has("ac_dev") || window.location.hostname === "localhost"));
      const isRegistered = has("ac_registered") || has("ac_session") ||
        (typeof localStorage !== "undefined" && localStorage.getItem("ac_registered") === "1");
      setUnlocked(Boolean(isRegistered || isDevBypass));
    };
    update();
    const t = setTimeout(update, 80);
    window.addEventListener?.("storage", update);
    return () => { clearTimeout(t); window.removeEventListener?.("storage", update); };
  }, []);

  const locked = !unlocked;

  return (
    <div className="page">
      {/* Top nav as a readable pill */}
      <nav className="topnav">
        <Link href="/register" legacyBehavior>
          <a className="nav-btn">Register — Free Access</a>
        </Link>
      </nav>

      <section className="hero">
        {/* smaller logo card */}
        <img src="/TotalIora_Logo.png" alt="TotalIora Logo" className="logo" />

        {/* Atmosphere button under logo */}
        <div className="hero-atmo">
          <AtmospherePicker mode="inline" faith={path || faith} />
        </div>

        <FaithIcon faith={faith} />

        {/* white framed note for readability */}
        <p className="note">
          Advanced Voice is now <strong>Total-Iora Voice</strong>. Choose your spiritual heritage,
          or start with Sacred Notes.
        </p>
      </section>

      {locked && (
        <div className="previewBanner" role="status">
          You’re viewing a read-only preview. <Link href="/login">Log in</Link> or{" "}
          <Link href="/register">Register</Link> to use the interactive features.
        </div>
      )}

      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pill">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>Your quiet place. Write, cry, pray, whisper. Light a candle. We don’t read or judge.<strong> Nothing is stored or kept.</strong></p>
            </header>
            <footer className="f">
              {locked ? (
                <Link href="/login" className="btn accent" aria-disabled="true">Log in to Open</Link>
              ) : (
                <Link href="/sacred-space" className="btn accent">Open Sacred Notes</Link>
              )}
              <div className="disc">This is your space. Do whatever you like on this page. We have no responsibility for anything you write, and nothing is saved on our servers.</div>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pill">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>Ask questions by typing or voice and get grounded answers. Download your write-up when it’s ready.</p>
            </header>
            <footer className="f">
              {locked ? (
                <Link href="/login" className="btn accent" aria-disabled="true">Log in to Get Yours</Link>
              ) : (
                <Link href="/oracle-universe-dna" className="btn accent">Get Your Oracle Universe DNA</Link>
              )}
              <div className="disc">Spiritual guidance only. No medical, legal, or financial advice.</div>
            </footer>
          </article>
        </div>
      </section>

      {unlocked ? (
        <>
          {faith === "Universal" ? <HeritageSelector path={path} onChange={setPath} /> : null}
          <OracleVoice path={path} />
        </>
      ) : (
        <section className="gate">
          <div className="card gatecard">
            <h3>Speak to the Oracle</h3>
            <p>Log in (or register free) to start a private, one-to-one voice conversation with a guide aligned to your tradition.</p>
            <Link href="/login" className="btn accent">Log in</Link>
          </div>
        </section>
      )}

      {/* white rounded footer card */}
      <div className="footer-card">
        <Footer />
      </div>

      {/* ------------------------------- styles ------------------------------- */}
      <style jsx>{`
        .page { min-height:100vh; background:transparent; }
        .topnav { display:flex; justify-content:center; padding:14px; z-index:3; }
        .nav-btn, .nav-btn:link, .nav-btn:visited {
          -webkit-appearance:none; appearance:none;
          display:inline-block; padding:10px 18px; border-radius:9999px;
          border:0; font-weight:800; font-size:14px; color:#fff; text-decoration:none !important;
          background:linear-gradient(135deg,#7c3aed,#14b8a6); box-shadow:0 8px 20px rgba(2,6,23,.18);
        }
        .nav-btn:hover { transform: translateY(-1px); box-shadow:0 12px 26px rgba(2,6,23,.24); }

        .hero { text-align:center; padding-top:8px; }
        .logo { width:108px; margin:0 auto; display:block; border-radius:14px; box-shadow:0 8px 24px rgba(2,6,23,.15); }
        .hero-atmo { margin:10px 0 6px; }

        .note {
          display:inline-block; margin:10px auto 0; padding:10px 14px;
          background:#fff; border:1px solid rgba(15,23,42,.12); border-radius:12px;
          box-shadow:0 8px 20px rgba(2,6,23,.08); color:#334155; max-width:820px;
        }

        .tiles { max-width:1100px; margin:10px auto 6px; padding:0 16px; }
        .grid { display:grid; gap:14px; grid-template-columns:1fr; }
        @media (min-width:900px){ .grid { grid-template-columns:1fr 1fr; } }
        .card { background:#fff; border:1px solid rgba(15,23,42,.08); border-radius:20px; box-shadow:0 10px 30px rgba(2,6,23,.08); padding:18px; }
        .pill { display:inline-block; padding:6px 10px; border:1px solid #e2e8f0; border-radius:999px; background:#fff; color:#334155; font-weight:700; }
        h3 { margin:8px 0 4px; font-size:1.25rem; font-weight:800; color:#0f172a; }
        p { color:#475569; }
        .f { display:flex; flex-direction:column; gap:8px; margin-top:8px; }
        .btn { display:inline-block; padding:10px 16px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .disc { color:#64748b; font-size:.92rem; }
        .gate { max-width:1100px; margin:12px auto 20px; padding:0 16px; }
        .gatecard { text-align:center; }

        .footer-card{
          max-width:1100px; margin:14px auto 24px; padding:12px 16px;
          background:rgba(255,255,255,0.96); border:1px solid rgba(15,23,42,.12);
          border-radius:14px; box-shadow:0 8px 22px rgba(2,6,23,.12); backdrop-filter:blur(2px);
          color:#0f172a; text-align:center;
        }
        .footer-card :global(a){ color:#0f172a; text-decoration:underline; }
        .footer-card :global(a:hover){ color:#0b1220; }
      `}</style>

      {/* faith icon colors + Atmosphere hard overrides (GLOBAL) */}
      <style jsx global>{`
        .faith-icon { width:48px; height:48px; margin:8px auto 0; display:block; }
        .gold { fill: gold; filter: drop-shadow(0 0 2px gold); }
        .blue { fill: #0057b8; filter: drop-shadow(0 0 2px #0057b8); }

        /* --- FORCE the Atmosphere UI to be rounded, larger, spaced --- */
        /* Main trigger button (the one under the logo) */
        .hero-atmo > button {
          -webkit-appearance:none; appearance:none;
          padding:12px 20px !important; border-radius:9999px !important;
          border:0 !important; font-weight:800; font-size:15px;
          color:#fff !important; background:linear-gradient(135deg,#7c3aed,#14b8a6) !important;
          box-shadow:0 6px 18px rgba(2,6,23,.18); cursor:pointer;
        }
        .hero-atmo > button:hover { transform: translateY(-1px); box-shadow:0 10px 24px rgba(2,6,23,.22); }

        /* Options line: one row with spacing; scroll horizontally on narrow screens */
        .hero-atmo .atmo-menu {
          display:flex !important; flex-wrap:nowrap !important; gap:12px !important;
          justify-content:center; max-width:96vw; padding:6px 4px !important;
          background:transparent !important; overflow-x:auto; -webkit-overflow-scrolling:touch;
        }

        /* Each option pill (works even if old class names are used) */
        .hero-atmo .atmo-menu button,
        .hero-atmo .atmo-menu .atmo-opt,
        .hero-atmo .atmo-menu .atmo-pill {
          -webkit-appearance:none; appearance:none;
          display:inline-flex; align-items:center; gap:10px;
          padding:12px 16px !important; border-radius:9999px !important;
          border:0 !important; background:#ffffff !important; color:#0f172a !important;
          font-weight:800; font-size:15px; white-space:nowrap;
          box-shadow:0 6px 16px rgba(2,6,23,.15); cursor:pointer;
        }
        .hero-atmo .atmo-menu button.sel,
        .hero-atmo .atmo-menu .atmo-opt.sel,
        .hero-atmo .atmo-menu .atmo-pill.sel {
          color:#fff !important; background:linear-gradient(135deg,#7c3aed,#14b8a6) !important;
          box-shadow:0 8px 20px rgba(2,6,23,.22);
        }

        /* Make the page & body transparent so the chosen background photo shows */
        html.atmo-active, html.atmo-active body { background: transparent !important; }
        html.atmo-active .page { background: transparent !important; }
      `}</style>
    </div>
  );
}
