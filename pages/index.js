// FILE: /pages/index.js
import Link from "next/link";
import Footer from "../components/Footer";
import HeritageSelector from "../components/HeritageSelector";
import OracleVoice from "../components/OracleVoice";

export default function Home({ unlocked }) {
  const locked = !unlocked;

  return (
    <div className="page">
      <nav className="topnav">
        <Link href="/register" className="btn cta">Register — Free Access</Link>
        <Link href="/login" className="btn ghost">Log in</Link>
      </nav>

      <section className="hero">
        <img src="/TotalIora_Logo.png" alt="Total-Iora Logo" className="logo" />
        <p className="note">
          Advanced Voice is now <strong>Total-Iora Voice</strong>. Choose your spiritual heritage,
          or start with Sacred Notes.
        </p>
      </section>

      <section className="tiles">
        <div className="grid">
          <article className="card">
            <header className="h">
              <div className="pill">Sacred Notes</div>
              <h3>Leave a private note • Light a candle</h3>
              <p>Your quiet place. We don’t read or judge. <strong>Nothing is stored or kept.</strong></p>
            </header>
            <footer className="f">
              {locked
                ? <Link href="/register" className="btn accent">Register to Open</Link>
                : <Link href="/sacred-space" className="btn accent">Open Sacred Notes</Link>}
              <div className="disc">This is your space.</div>
            </footer>
          </article>

          <article className="card">
            <header className="h">
              <div className="pill">Oracle Universe DNA</div>
              <h3>Your personal map • Downloadable guidance</h3>
              <p>Ask for a future outlook and gentle advice.</p>
            </header>
            <footer className="f">
              {locked
                ? <Link href="/register" className="btn accent">Register to Get Yours</Link>
                : <Link href="/oracle-universe-dna" className="btn accent">Get Your Oracle Universe DNA</Link>}
              <div className="disc">Spiritual guidance only.</div>
            </footer>
          </article>
        </div>
      </section>

      {unlocked ? (
        <>
          <HeritageSelector />
          <OracleVoice />
        </>
      ) : (
        <section className="gate">
          <div className="card gatecard">
            <h3>Speak to the Oracle</h3>
            <p>Register (free) and then log in to start a one-to-one voice conversation.</p>
            <Link href="/register" className="btn accent">Register — Free Access</Link>
          </div>
        </section>
      )}

      <Footer />

      <style jsx>{`
        .page { min-height:100vh; background:linear-gradient(#fff,#f8fafc); }
        .topnav { display:flex; gap:10px; justify-content:center; padding:14px; flex-wrap:wrap; }
        .btn { padding:10px 16px; border-radius:14px; font-weight:800; border:1px solid rgba(15,23,42,.12); background:#fff; }
        .btn.cta, .btn.accent { color:#fff; background:linear-gradient(135deg,#7c3aed,#14b8a6); border:none; }
        .btn.ghost { background:#fff; }
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
        .disc { color:#64748b; font-size:.92rem; }
        .gate { max-width:1100px; margin:12px auto 20px; padding:0 16px; }
        .gatecard { text-align:center; }
      `}</style>
    </div>
  );
}

// SSR gate: only session cookie unlocks; also clears old cookies.
export async function getServerSideProps({ req, res }) {
  const c = req.cookies || {};
  const session = c.ac_session === "1";
  const cookiesToClear = ["ac_registered", "ac_dev"];
  if (c.ac_registered || c.ac_dev) {
    res.setHeader("Set-Cookie", cookiesToClear.map(n => `${n}=; Max-Age=0; Path=/; SameSite=Lax; Secure`));
  }
  return { props: { unlocked: session } };
}
