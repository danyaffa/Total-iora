// FILE: /components/AtmospherePicker.js
import { useEffect, useMemo, useState } from "react";

/* cookies */
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

/* option catalog */
const ALL_OPTIONS = [
  { key: "beach",     label: "Beach",     icon: "🏖️" },
  { key: "nature",    label: "Nature",    icon: "🌲" },
  { key: "library",   label: "Library",   icon: "📚" },
  { key: "sunrays",   label: "Sun Rays",  icon: "🌤️" },
  { key: "church",    label: "Church",    icon: "⛪" },
  { key: "synagogue", label: "Synagogue", icon: "✡️" },
  { key: "mosque",    label: "Mosque",    icon: "🕌" },
  { key: "temple",    label: "Temple",    icon: "🛕" },
];

/* photo map (photos preferred; graceful CSS fallback if missing) */
const BG_MAP = {
  beach:     { photo: "/atmo/beach.jpg",            gradient: "linear-gradient(135deg,#9bd7ff,#ffe9a3)" },
  nature:    { photo: "/atmo/nature.jpg",           gradient: "linear-gradient(135deg,#6fbf8f,#a7d8b7)" },
  library:   { photo: "/atmo/library.jpg",          gradient: "linear-gradient(135deg,#7b6f67,#b9b2ad)" },
  sunrays:   { photo: "/atmo/sunrays.jpg",          gradient: "radial-gradient(circle at 15% 10%, rgba(255,255,200,.85), rgba(255,255,255,0) 40%), linear-gradient(#e2f3ff,#fff4d6)" },
  church:    { photo: "/atmo/church-vatican.jpg",   gradient: "linear-gradient(135deg,#9fb0c7,#b3a9d8)" },
  synagogue: { photo: "/atmo/synagogue-kotel.jpg",  gradient: "linear-gradient(135deg,#b9a079,#e8d2ae)" },
  mosque:    { photo: "/atmo/mosque-mecca.jpg",     gradient: "linear-gradient(135deg,#8bd3b7,#bde5cf)" },
  temple:    { photo: "/atmo/temple.jpg",           gradient: "linear-gradient(135deg,#dcb08a,#f2c7b5)" },
};

/* faith filter */
function allowedKeysByFaith(faith) {
  const neutral = ["beach", "nature", "library", "sunrays"];
  switch ((faith || "Universal").toLowerCase()) {
    case "muslim":    return [...neutral, "mosque"];
    case "christian": return [...neutral, "church"];
    case "jewish":    return [...neutral, "synagogue"];
    case "eastern":   return [...neutral, "temple"];
    default:          return neutral;
  }
}

/**
 * Props:
 *  - mode: "inline" | "floating"
 *  - faith: "Muslim" | "Christian" | "Jewish" | "Eastern" | "Universal"
 */
export default function AtmospherePicker({ mode = "inline", faith = "Universal" }) {
  const allowed = allowedKeysByFaith(faith);
  const OPTIONS = ALL_OPTIONS.filter(o => allowed.includes(o.key));

  const cookieVal = decodeURIComponent(getCookie("ac_atmo") || "");
  const initial = allowed.includes(cookieVal) ? cookieVal : (OPTIONS[0]?.key || "nature");

  const [open, setOpen] = useState(false);
  const [atmo, setAtmo] = useState(initial);
  const [photoReady, setPhotoReady] = useState({}); // key -> boolean

  /* remember choice */
  useEffect(() => { setCookie("ac_atmo", atmo); }, [atmo]);

  /* ensure page can show full background */
  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.add("atmo-active");
    return () => root.classList.remove("atmo-active");
  }, []);

  /* preload images for allowed options; mark availability */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const updates = {};
    allowed.forEach((k) => {
      const url = BG_MAP[k]?.photo;
      if (!url) return (updates[k] = false);
      const img = new Image();
      img.onload = () => setPhotoReady(prev => ({ ...prev, [k]: true }));
      img.onerror = () => setPhotoReady(prev => ({ ...prev, [k]: false }));
      img.src = url;
    });
  }, [faith]);

  const bgStyle = useMemo(() => {
    const cfg = BG_MAP[atmo] || {};
    const usePhoto = photoReady[atmo] && cfg.photo;
    const layers = [];
    if (usePhoto) layers.push(`url("${cfg.photo}")`);
    layers.push(cfg.gradient || "linear-gradient(#e6eef6,#f7f9fc)");
    return {
      backgroundImage: layers.join(", "),
      backgroundSize: usePhoto ? "cover, cover" : "cover",
      backgroundPosition: "center center, center center",
      backgroundAttachment: "fixed, fixed",
    };
  }, [atmo, photoReady]);

  const ctlClass = mode === "inline" ? "atmo-ctl inline" : "atmo-ctl floating";

  return (
    <>
      {/* full-screen background */}
      <div className="atmo-bg" aria-hidden="true" />

      {/* picker */}
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

      {/* local/dynamic styles */}
      <style jsx>{`
        .atmo-bg { position: fixed; inset: 0; z-index: -1; }
      `}</style>
      <style jsx>{`
        .atmo-bg {
          ${Object.entries(bgStyle).map(([k,v]) => `${camelToKebab(k)}:${v};`).join("")}
        }
        .atmo-bg::after {
          content:"";
          position:absolute; inset:0;
          background:
            linear-gradient(rgba(0,0,0,.10), rgba(0,0,0,.10)); /* subtle for readability */
          pointer-events:none;
        }

        .atmo-ctl.floating { position: fixed; right:16px; bottom:16px; z-index:1000; }
        .atmo-ctl.inline { position: relative; display:flex; justify-content:center; margin-top:6px; z-index:2; }

        .atmo-btn {
          padding:10px 14px; border-radius:999px;
          border:1px solid rgba(255,255,255,.25);
          background: rgba(0,0,0,.55);
          backdrop-filter: blur(6px);
          color:#fff; font-size:14px; cursor:pointer;
        }
        .atmo-btn:hover { background: rgba(0,0,0,.7); }

        .atmo-menu {
          position:absolute;
          ${mode === "inline" ? "top:44px; left:50%; transform:translateX(-50%);" : "bottom:48px; right:0;"}
          width:260px; max-height:60vh; overflow:auto; padding:8px;
          border-radius:14px; background:rgba(0,0,0,.72);
          backdrop-filter: blur(10px); box-shadow:0 10px 30px rgba(0,0,0,.45);
        }
        .atmo-opt {
          display:flex; align-items:center; gap:10px; width:100%;
          padding:10px 12px; margin:4px 0; border-radius:10px;
          border:1px solid rgba(255,255,255,.12);
          background:rgba(255,255,255,.05); color:#fff; cursor:pointer; text-align:left;
        }
        .atmo-opt.sel { border-color:rgba(255,255,255,.35); background:rgba(255,255,255,.12); }
        .ico { width:22px; text-align:center; }
        .lbl { flex:1; font-size:14px; }
        @media (max-width:480px){ .atmo-btn{font-size:13px;padding:8px 12px;} .atmo-menu{width:220px;} }
      `}</style>

      {/* global: ensure the page itself is transparent so the photo is visible */}
      <style jsx global>{`
        html.atmo-active body { background: transparent !important; }
        html.atmo-active .page { background: transparent !important; }
      `}</style>
    </>
  );
}

/* utils */
function camelToKebab(s){ return s.replace(/[A-Z]/g, m => "-"+m.toLowerCase()); }
