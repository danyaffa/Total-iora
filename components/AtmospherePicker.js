// FILE: /components/AtmospherePicker.js
import { useEffect, useMemo, useState } from "react";

/* ---------------- cookie helpers ---------------- */
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

/* ---------------- base options ---------------- */
const ALL_OPTIONS = [
  { key: "minimal",   label: "Minimal",   icon: "🎛️" },
  { key: "nature",    label: "Nature",    icon: "🌲" },
  { key: "beach",     label: "Beach",     icon: "🏖️" },
  { key: "library",   label: "Library",   icon: "📚" },
  { key: "church",    label: "Church",    icon: "⛪" },
  { key: "synagogue", label: "Synagogue", icon: "✡️" },
  { key: "mosque",    label: "Mosque",    icon: "🕌" },
  { key: "temple",    label: "Temple",    icon: "🛕" },
];

/* 
  Backgrounds: use a photo if present at /public/atmo/<key>.jpg
  and fall back to a tasteful gradient. This produces a TRUE page background.
*/
const BG_MAP = {
  minimal:   { photo: "/atmo/minimal.jpg",   gradient: "linear-gradient(135deg, #0f172a, #111827)" },
  nature:    { photo: "/atmo/nature.jpg",    gradient: "linear-gradient(135deg, rgba(6,78,59,.7), rgba(15,118,110,.7))" },
  beach:     { photo: "/atmo/beach.jpg",     gradient: "linear-gradient(135deg, rgba(2,132,199,.65), rgba(253,224,71,.55))" },
  library:   { photo: "/atmo/library.jpg",   gradient: "linear-gradient(135deg, rgba(68,64,60,.75), rgba(120,113,108,.6))" },
  church:    { photo: "/atmo/church.jpg",    gradient: "linear-gradient(135deg, rgba(100,116,139,.7), rgba(30,27,75,.7))" },
  synagogue: { photo: "/atmo/synagogue.jpg", gradient: "linear-gradient(135deg, rgba(37,99,235,.65), rgba(147,197,253,.55))" },
  mosque:    { photo: "/atmo/mosque.jpg",    gradient: "linear-gradient(135deg, rgba(16,185,129,.65), rgba(34,197,94,.55))" },
  temple:    { photo: "/atmo/temple.jpg",    gradient: "linear-gradient(135deg, rgba(217,119,6,.6), rgba(244,63,94,.55))" },
};

/* filter by faith */
function allowedKeysByFaith(faith) {
  const neutral = ["minimal", "nature", "beach", "library"];
  switch ((faith || "Universal").toLowerCase()) {
    case "muslim":    return [...neutral, "mosque"];
    case "christian": return [...neutral, "church"];
    case "jewish":    return [...neutral, "synagogue"];
    case "eastern":   return [...neutral, "temple"];
    case "universal":
    default:          return neutral; // no religious buildings in Universal
  }
}

/**
 * Props:
 *  - mode: "inline" (button sits in flow) | "floating" (bottom-right). Default "floating".
 *  - faith: "Muslim" | "Christian" | "Jewish" | "Eastern" | "Universal"
 */
export default function AtmospherePicker({ mode = "floating", faith = "Universal" }) {
  const allowed = allowedKeysByFaith(faith);
  const OPTIONS = ALL_OPTIONS.filter(o => allowed.includes(o.key));

  const initial = decodeURIComponent(getCookie("ac_atmo") || "") || OPTIONS[0]?.key || "minimal";
  const [open, setOpen] = useState(false);
  const [atmo, setAtmo] = useState(allowed.includes(initial) ? initial : OPTIONS[0]?.key || "minimal");

  /* remember choice */
  useEffect(() => { setCookie("ac_atmo", atmo); }, [atmo]);

  /* make the underlying page truly transparent so the background shows FULL PAGE */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.add("atmo-active");
    return () => root.classList.remove("atmo-active");
  }, []);

  /* prepare background layers */
  const bgStyle = useMemo(() => {
    const cfg = BG_MAP[atmo] || BG_MAP.minimal;
    const photoLayer = `url("${cfg.photo}")`;
    const layers = [photoLayer, cfg.gradient];
    return {
      backgroundImage: layers.join(", "),
      backgroundSize: "cover, cover",
      backgroundPosition: "center center, center center",
      backgroundAttachment: "fixed, fixed"
    };
  }, [atmo]);

  /* inline vs floating control container */
  const ctlClass = mode === "inline" ? "atmo-ctl inline" : "atmo-ctl floating";

  return (
    <>
      {/* full-screen background */}
      <div className="atmo-bg" aria-hidden="true" />

      {/* control */}
      <div className={ctlClass}>
        <button
          className="atmo-btn"
          onClick={() => setOpen(v => !v)}
          aria-haspopup="listbox"
          aria-expanded={open ? "true" : "false"}
          title="Choose atmosphere"
        >
          🪄 Atmosphere
        </button>

        {open && (
          <div className="atmo-menu" role="listbox" tabIndex={-1}>
            {OPTIONS.map(opt => (
              <button
                key={opt.key}
                role="option"
                aria-selected={atmo === opt.key}
                className={`atmo-opt ${atmo === opt.key ? "sel" : ""}`}
                onClick={() => { setAtmo(opt.key); setOpen(false); }}
              >
                <span className="ico">{opt.icon}</span>
                <span className="lbl">{opt.label}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* local styles */}
      <style jsx>{`
        .atmo-bg {
          position: fixed;
          inset: 0;
          z-index: -1;
        }
      `}</style>

      {/* dynamic background injection */}
      <style jsx>{`
        .atmo-bg {
          ${Object.entries(bgStyle).map(([k, v]) => `${camelToKebab(k)}:${v};`).join("")}
        }
        .atmo-bg::after {
          content: "";
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 20% 10%, rgba(0,0,0,.35), transparent 40%),
            radial-gradient(circle at 80% 90%, rgba(0,0,0,.35), transparent 45%),
            linear-gradient(rgba(0,0,0,.18), rgba(0,0,0,.18));
          pointer-events: none;
        }

        .atmo-ctl.floating {
          position: fixed;
          right: 16px;
          bottom: 16px;
          z-index: 1000;
        }
        .atmo-ctl.inline {
          position: relative;
          display: flex;
          justify-content: center;
          margin-top: 6px;
          z-index: 2;
        }
        .atmo-btn {
          padding: 10px 14px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,.25);
          background: rgba(0,0,0,.55);
          backdrop-filter: blur(6px);
          color: #fff;
          font-size: 14px;
          cursor: pointer;
        }
        .atmo-btn:hover { background: rgba(0,0,0,.7); }

        .atmo-menu {
          position: absolute;
          ${mode === "inline" ? "top: 44px; left: 50%; transform: translateX(-50%);" : "bottom: 48px; right: 0;"}
          width: 240px;
          max-height: 60vh;
          overflow: auto;
          padding: 8px;
          border-radius: 14px;
          background: rgba(0,0,0,.72);
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
          background: rgba(255,255,255,.05);
          color: #fff;
          cursor: pointer;
          text-align: left;
        }
        .atmo-opt.sel { border-color: rgba(255,255,255,.35); background: rgba(255,255,255,.12); }
        .ico { width: 22px; text-align: center; }
        .lbl { flex: 1; font-size: 14px; }
        @media (max-width: 480px) {
          .atmo-btn { font-size: 13px; padding: 8px 12px; }
          .atmo-menu { width: 200px; }
        }
      `}</style>

      {/* global overrides to ensure FULL-PAGE background is visible */}
      <style jsx global>{`
        html.atmo-active body { background: transparent !important; }
        html.atmo-active .page { background: transparent !important; }
      `}</style>
    </>
  );
}

/* utils */
function camelToKebab(s) {
  return s.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());
}
