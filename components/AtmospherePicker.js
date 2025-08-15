// FILE: /components/AtmospherePicker.js
import { useEffect, useMemo, useState } from "react";

function setCookie(name, value, maxAgeDays = 365) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 3600;
  const isHttps = typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${isHttps ? "; Secure" : ""}`;
}
function getCookie(name) {
  if (typeof document === "undefined") return "";
  return (document.cookie || "")
    .split("; ")
    .find((c) => c.startsWith(name + "="))
    ?.split("=")[1] || "";
}

const OPTIONS = [
  { key: "minimal", label: "Minimal", icon: "🎛️" },
  { key: "nature", label: "Nature", icon: "🌲" },
  { key: "beach", label: "Beach", icon: "🏖️" },
  { key: "library", label: "Library", icon: "📚" },
  { key: "church", label: "Church", icon: "⛪" },
  { key: "synagogue", label: "Synagogue", icon: "✡️" },
  { key: "mosque", label: "Mosque", icon: "🕌" },
  { key: "temple", label: "Temple", icon: "🛕" },
];

const BG_MAP = {
  minimal: {
    gradient: "linear-gradient(135deg, rgba(18,18,18,0.95), rgba(18,18,18,0.92))",
    usePhoto: false,
  },
  nature: {
    gradient: "linear-gradient(135deg, rgba(6,78,59,0.7), rgba(15,118,110,0.7))",
    photo: "/atmo/nature.jpg",
    usePhoto: false,
  },
  beach: {
    gradient: "linear-gradient(135deg, rgba(2,132,199,0.65), rgba(253,224,71,0.55))",
    photo: "/atmo/beach.jpg",
    usePhoto: false,
  },
  library: {
    gradient: "linear-gradient(135deg, rgba(68,64,60,0.75), rgba(120,113,108,0.6))",
    photo: "/atmo/library.jpg",
    usePhoto: false,
  },
  church: {
    gradient: "linear-gradient(135deg, rgba(100,116,139,0.7), rgba(30,27,75,0.7))",
    photo: "/atmo/church.jpg",
    usePhoto: false,
  },
  synagogue: {
    gradient: "linear-gradient(135deg, rgba(37,99,235,0.65), rgba(147,197,253,0.55))",
    photo: "/atmo/synagogue.jpg",
    usePhoto: false,
  },
  mosque: {
    gradient: "linear-gradient(135deg, rgba(16,185,129,0.65), rgba(34,197,94,0.55))",
    photo: "/atmo/mosque.jpg",
    usePhoto: false,
  },
  temple: {
    gradient: "linear-gradient(135deg, rgba(217,119,6,0.6), rgba(244,63,94,0.55))",
    photo: "/atmo/temple.jpg",
    usePhoto: false,
  },
};

export default function AtmospherePicker() {
  const initial = decodeURIComponent(getCookie("ac_atmo") || "") || "minimal";
  const [open, setOpen] = useState(false);
  const [atmo, setAtmo] = useState(BG_MAP[initial] ? initial : "minimal");

  useEffect(() => {
    setCookie("ac_atmo", atmo);
  }, [atmo]);

  const bgStyle = useMemo(() => {
    const cfg = BG_MAP[atmo] || BG_MAP.minimal;
    const layers = [];
    if (cfg.usePhoto && cfg.photo) layers.push(`url("${cfg.photo}")`);
    layers.push(cfg.gradient);
    return {
      backgroundImage: layers.join(", "),
      backgroundSize: cfg.usePhoto ? "cover, cover" : "cover",
      backgroundPosition: "center center",
    };
  }, [atmo]);

  return (
    <>
      <div className="atmo-bg" aria-hidden="true" />

      <div className="atmo-ctl">
        <button
          className="atmo-btn"
          onClick={() => setOpen((v) => !v)}
          aria-haspopup="listbox"
          aria-expanded={open ? "true" : "false"}
          title="Choose atmosphere"
        >
          🪄 Atmosphere
        </button>

        {open && (
          <div className="atmo-menu" role="listbox" tabIndex={-1}>
            {OPTIONS.map((opt) => (
              <button
                key={opt.key}
                role="option"
                aria-selected={atmo === opt.key}
                className={`atmo-opt ${atmo === opt.key ? "sel" : ""}`}
                onClick={() => {
                  setAtmo(opt.key);
                  setOpen(false);
                }}
              >
                <span className="ico">{opt.icon}</span>
                <span className="lbl">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <style jsx>{`
        .atmo-bg {
          position: fixed;
          inset: 0;
          z-index: -1;
        }
      `}</style>
      <style jsx>{`
        .atmo-bg {
          ${Object.entries(bgStyle)
            .map(([k, v]) => `${camelToKebab(k)}:${v};`)
            .join("")}
        }
        .atmo-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(circle at 20% 10%, rgba(0,0,0,.35), transparent 40%),
                      radial-gradient(circle at 80% 90%, rgba(0,0,0,.35), transparent 45%),
                      linear-gradient(rgba(0,0,0,.25), rgba(0,0,0,.25));
          pointer-events: none;
        }

        .atmo-ctl {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 1000;
        }
        .atmo-btn {
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.2);
          background: rgba(0,0,0,.55);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 14px;
          cursor: pointer;
        }
        .atmo-btn:hover { background: rgba(0,0,0,.7); }

        .atmo-menu {
          position: absolute;
          bottom: 48px;
          right: 0;
          width: 240px;
          max-height: 60vh;
          overflow: auto;
          padding: 8px;
          border-radius: 14px;
          background: rgba(0,0,0,.7);
          backdrop-filter: blur(10px);
          box-shadow: 0 10px 30px rgba(0,0,0,.45);
        }
        .atmo-opt {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          margin: 4px 0;
          border-radius: 10px;
          border: 1px solid rgba(255,255,255,.12);
          background: rgba(255,255,255,.04);
          color: #fff;
          cursor: pointer;
          text-align: left;
        }
        .atmo-opt.sel { border-color: rgba(255,255,255,.35); background: rgba(255,255,255,.08); }
        .atmo-opt:hover { background: rgba(255,255,255,.12); }
        .ico { width: 22px; text-align: center; }
        .lbl { flex: 1; font-size: 14px; }
        @media (max-width: 480px) {
          .atmo-btn { font-size: 13px; padding: 8px 12px; }
          .atmo-menu { width: 200px; }
        }
      `}</style>
    </>
  );
}

function camelToKebab(s) {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}
