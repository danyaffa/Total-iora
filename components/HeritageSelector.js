// FILE: /components/HeritageSelector.js
import { Crescent, Cross, StarOfDavid, Om, Candle } from "./Icons";

const PATHS = [
  { id: "Muslim", title: "Muslim", sub: "Quranic light • Sufi wisdom", c: "#16a34a", Icon: Crescent },
  { id: "Christian", title: "Christian", sub: "Gospels • Fathers • Saints", c: "#dc2626", Icon: Cross },
  { id: "Jewish", title: "Jewish", sub: "Kabbalah • Psalms • Sages", c: "#3b82f6", Icon: StarOfDavid },
  { id: "Eastern", title: "Eastern", sub: "Buddhist • Tao • Veda", c: "#ea580c", Icon: Om },
  { id: "Universal", title: "Universal", sub: "Humanist • Open • Gentle", c: "#6366f1", Icon: Candle },
];

export default function HeritageSelector({ path, onChange }) {
  return (
    <section className="paths">
      <p className="pick">Choose your spiritual heritage (optional)</p>
      <div className="grid">
        {PATHS.map(({ id, title, sub, c, Icon }) => (
          <button
            key={id}
            onClick={() => onChange(id)}
            className={`pill ${path === id ? "on" : ""}`}
            style={{ borderColor: c, background: `rgba(15,23,42,0.7)` }}
            type="button"
          >
            <div className="t">
              <span className="ico" style={{ color: c }}><Icon /></span>
              <span style={{ color: "#fff" }}>{title}</span>
            </div>
            <div className="s">{sub}</div>
          </button>
        ))}
      </div>

      <style jsx>{`
        .paths { max-width:980px; margin:14px auto 0; padding:0 16px; }
        .pick { font-weight:600; color:#fff; margin-bottom:8px; text-align:center; text-shadow:0 1px 4px rgba(0,0,0,.6); }
        .grid { display:grid; grid-template-columns:1fr; gap:10px; }
        @media (min-width:700px){ .grid { grid-template-columns:repeat(5,1fr); } }
        .pill { text-align:left; border:2px solid #e2e8f0; border-radius:16px; padding:12px 14px; background:rgba(15,23,42,0.7); backdrop-filter:blur(4px); transition:.15s; color:#fff; }
        .pill:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(2,6,23,.08); }
        .pill.on { box-shadow: 0 0 0 4px rgba(15,23,42,.06) inset; }
        .t { font-weight:800; display:flex; align-items:center; gap:8px; }
        .s { font-weight:500; color:rgba(255,255,255,0.85); margin-top:2px; font-size:.93rem; }
      `}</style>
    </section>
  );
}
