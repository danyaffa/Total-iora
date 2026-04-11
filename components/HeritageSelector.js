// FILE: /components/HeritageSelector.js
import { Crescent, Cross, StarOfDavid, Om, Candle } from "./Icons";

const PATHS = [
  { id: "Muslim", title: "Muslim", sub: "Quranic light • Sufi wisdom", c: "#16a34a", Icon: Crescent },
  { id: "Christian", title: "Christian", sub: "Gospels • Fathers • Saints", c: "#dc2626", Icon: Cross },
  { id: "Jewish", title: "Jewish", sub: "Kabbalah • Psalms • Sages", c: "#3b82f6", Icon: StarOfDavid },
  { id: "Eastern", title: "Eastern", sub: "Buddhist • Tao • Veda", c: "#ea580c", Icon: Om },
  { id: "Universal", title: "Universal", sub: "Humanist • Open • Gentle", c: "#6366f1", Icon: Candle },
];

function setFaithCookie(value) {
  if (typeof document === "undefined") return;
  const maxAge = 365 * 24 * 3600;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `faith=${encodeURIComponent(
    value
  )}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

export default function HeritageSelector({ path, onChange }) {
  function handleClick(id) {
    // Persist the choice so the middleware x-faith header is correct
    // on the next request (auracode-chat reads it).
    setFaithCookie(id);
    if (typeof onChange === "function") onChange(id);
  }

  return (
    <section className="paths">
      <p className="pick">Choose your spiritual heritage</p>
      <div className="grid">
        {PATHS.map(({ id, title, sub, c, Icon }) => (
          <button
            key={id}
            onClick={() => handleClick(id)}
            className={`pill ${path === id ? "on" : ""}`}
            style={{ borderColor: path === id ? c : "rgba(255,255,255,0.25)" }}
            type="button"
            aria-pressed={path === id}
          >
            <div className="t">
              <span className="ico" style={{ color: c }}>
                <Icon />
              </span>
              <span>{title}</span>
            </div>
            <div className="s">{sub}</div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .paths {
          max-width: 980px;
          margin: 14px auto 0;
          padding: 0 16px;
        }
        .pick {
          font-weight: 700;
          color: #fff;
          margin-bottom: 10px;
          text-align: center;
          text-shadow: 0 1px 4px rgba(0, 0, 0, 0.6);
          font-size: 0.95rem;
        }
        /* Mobile-first: single column */
        .grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 8px;
        }
        /* Small phones (≥375px) — 2 cols */
        @media (min-width: 420px) {
          .grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        /* Tablet — 3 cols */
        @media (min-width: 640px) {
          .grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        /* Desktop — 5 cols */
        @media (min-width: 900px) {
          .grid {
            grid-template-columns: repeat(5, 1fr);
          }
        }
        .pill {
          text-align: left;
          border: 2px solid rgba(255, 255, 255, 0.25);
          border-radius: 16px;
          padding: 12px 14px;
          background: rgba(15, 23, 42, 0.72);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(6px);
          transition: transform 0.15s, box-shadow 0.15s, border-color 0.15s,
            background 0.15s;
          color: #fff;
          min-height: 72px;
          cursor: pointer;
        }
        .pill:hover {
          transform: translateY(-1px);
          background: rgba(15, 23, 42, 0.85);
          box-shadow: 0 6px 20px rgba(2, 6, 23, 0.3);
        }
        .pill.on {
          background: rgba(15, 23, 42, 0.92);
          box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.2),
            0 10px 24px rgba(2, 6, 23, 0.4);
        }
        .t {
          font-weight: 800;
          display: flex;
          align-items: center;
          gap: 10px;
          color: #fff;
        }
        .ico {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(0, 0, 0, 0.45);
          flex-shrink: 0;
        }
        .s {
          font-weight: 500;
          color: rgba(255, 255, 255, 0.85);
          margin-top: 4px;
          font-size: 0.87rem;
        }
      `}</style>
    </section>
  );
}
