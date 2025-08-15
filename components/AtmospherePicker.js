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

/* filenames to try (first existing wins) */
const PHOTO_CANDIDATES = {
  beach: ["/atmo/beach.jpg"],
  nature: ["/atmo/nature-meadow.jpg", "/atmo/nature.jpg"],
  library: ["/atmo/library.jpg"],
  sunrays: ["/atmo/sunrays.jpg"],
  church: [
    "/atmo/church-vatican.jpg",
    "/atmo/Interior_view_of_Saint_Peter_s_Basilica_04.jpg",
    "/atmo/Interior_view_of_Saint_Peter's_Basilica_04.jpg",
  ],
  synagogue: ["/atmo/synagogue-kotel.jpg"],
  mosque: ["/atmo/mosque-mecca.jpg"],
  temple: ["/atmo/temple.jpg"],
};

/* soft fallbacks if photo missing */
const GRADIENTS = {
  beach:     "linear-gradient(135deg,#9bd7ff,#ffe9a3)",
  nature:    "linear-gradient(135deg,#a6e3b3,#e8f7cf)",
  library:   "linear-gradient(135deg,#7b6f67,#b9b2ad)",
  sunrays:   "radial-gradient(circle at 15% 10%, rgba(255,255,210,.85), rgba(255,255,255,0) 40%), linear-gradient(#e2f3ff,#fff4d6)",
  church:    "linear-gradient(135deg,#9fb0c7,#b3a9d8)",
  synagogue: "linear-gradient(135deg,#b9a079,#e8d2ae)",
  mosque:    "linear-gradient(135deg,#8bd3b7,#bde5cf)",
  temple:    "linear-gradient(135deg,#dcb08a,#f2c7b5)",
};

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

function findFirstExistingPhoto(key, onFound) {
  const list = PHOTO_CANDIDATES[key] || [];
  let i = 0;
  const tryNext = () => {
    if (i >= list.length) return onFound(null);
    const candidate = list[i++];
    const img = new Image();
    img.onload = () => onFound(candidate);
    img.onerror = tryNext;
    img.src = candidate;
  };
  tryNext();
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
  const [photoFor, setPhotoFor] = useState({});

  useEffect(() => { setCookie("ac_atmo", atmo); }, [atmo]);

  useEffect(() => {
    if (typeof document === "undefined") return;
    const root = document.documentElement;
    root.classList.add("atmo-active");
    return () => root.classList.remove("atmo-active");
  }, []);

  useEffect(() => {
    allowed.forEach((key) => {
      findFirstExistingPhoto(key, (url) =>
        setPhotoFor((prev) => (prev[key] === url ? prev : { ...prev, [key]: url }))
      );
    });
  }, [faith]);

  const bgStyle = useMemo(() => {
    const photo = photoFor[atmo];
    const layers = [];
    if (photo) layers.push(`url("${encodeURI(photo)}")`);
    layers.push(GRADIENTS[atmo] || "linear-gradient(#e6eef6,#f7f9fc)");
    return {
      backgroundImage: layers.join(", "),
      backgroundSize: photo ? "cover, cover" : "cover",
      backgroundPosition: "center center, center center",
      backgroundAttachment: "fixed, fixed",
    };
  }, [atmo, photoFor]);

  const ctlClass = mode === "inline" ? "atmo-ctl inline" : "atmo-ctl floating";

  return (
    <>
      {/* full-screen bg */}
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
                className={`atmo-pill atmo-opt ${atmo === opt.key ? "sel" : ""}`}
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
        .atmo-bg { position: fixed; inset: 0; z-index: -1; }
      `}</style>

      {/* strong, defensive styles so globals can't override */}
      <style jsx>{`
        .atmo-bg {
          ${Object.entries(bgStyle).map(([k,v]) => `${camelToKebab(k)}:${v};`).join("")}
        }
        .atmo-bg::after {
          content:"";
          position:absolute; inset:0;
          background: linear-gradient(rgba(0,0,0,.08), rgba(0,0,0,.08));
          pointer-events:none;
        }

        .atmo-ctl.floating { position: fixed; right:16px; bottom:16px; z-index:1000; }
        .atmo-ctl.inline { position: relative; display:flex; justify-content:center; margin-top:8px; z-index:2; }

        /* MAIN CTA */
        .atmo-btn {
          -webkit-appearance: none; appearance: none;
          padding: 12px 20px !important;
          border-radius: 9999px !important;
          border: 0 !important;
          font-weight: 800;
          font-size: 15px;
          color: #fff !important;
          background: linear-gradient(135deg,#7c3aed,#14b8a6) !important;
          box-shadow: 0 6px 18px rgba(2,6,23,.18);
          cursor: pointer;
        }
        .atmo-btn:hover { transform: translateY(-1px); box-shadow:0 10px 24px rgba(2,6,23,.22); }

        /* MENU: one long row, pills separated; scrolls horizontally on small screens */
        .atmo-menu {
          position:absolute;
          ${mode === "inline" ? "top:56px; left:50%; transform:translateX(-50%);" : "bottom:56px; right:0;"}
          display:flex;
          flex-wrap: nowrap;              /* keep in one row */
          gap: 12px;
          justify-content:center;
          max-width: 96vw;
          padding: 6px 4px;
          background: transparent;
          overflow-x: auto;               /* allow horizontal scroll if needed */
          -webkit-overflow-scrolling: touch;
        }

        /* OPTION PILLS — also target .atmo-opt to catch older markup */
        .atmo-pill, .atmo-opt {
          -webkit-appearance: none; appearance: none;
          display:inline-flex; align-items:center; gap:10px;
          padding:12px 16px !important;
          border-radius: 9999px !important;
          border: 0 !important;
          background: #ffffff !important;
          color: #0f172a !important;
          font-weight: 800;
          font-size: 15px;
          box-shadow: 0 6px 16px rgba(2,6,23,.15);
          cursor: pointer;
          white-space: nowrap;
        }
        .atmo-pill.sel, .atmo-opt.sel {
          color:#fff !important;
          background: linear-gradient(135deg,#7c3aed,#14b8a6) !important;
          box-shadow:0 8px 20px rgba(2,6,23,.22);
        }
        .ico { width:20px; text-align:center; }
        .lbl { font-size:15px; }
        @media (max-width:480px){
          .atmo-btn{ font-size:14px; padding:10px 18px !important; }
          .atmo-pill, .atmo-opt{ font-size:14px; padding:10px 14px !important; }
        }
      `}</style>

      {/* global override so the full photo shows through */}
      <style jsx global>{`
        html.atmo-active body { background: transparent !important; }
        html.atmo-active .page { background: transparent !important; }
      `}</style>
    </>
  );
}

/* utils */
function camelToKebab(s){ return s.replace(/[A-Z]/g, m => "-" + m.toLowerCase()); }
