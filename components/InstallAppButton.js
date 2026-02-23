// FILE: /components/InstallAppButton.js
// PWA Install prompt button — works on desktop and mobile
import { useState, useEffect } from "react";

export default function InstallAppButton({ variant = "default" }) {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detect iOS
    const ua = navigator.userAgent || "";
    const ios = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
    setIsIOS(ios);

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }
    if (navigator.standalone === true) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event (Chrome, Edge, Samsung, etc.)
    const handler = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);

    // Listen for app installed
    const installedHandler = () => setIsInstalled(true);
    window.addEventListener("appinstalled", installedHandler);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      window.removeEventListener("appinstalled", installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  };

  if (isInstalled) return null;

  // On iOS or when no prompt is available, show manual instructions
  const canInstall = deferredPrompt || isIOS;

  if (!canInstall) return null;

  const isCompact = variant === "compact";

  return (
    <>
      <button
        onClick={handleInstall}
        className={isCompact ? "install-btn-compact" : "install-btn"}
        aria-label="Install Total-iora App"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        <span>{isCompact ? "Install" : "Install App"}</span>
      </button>

      {/* iOS install guide modal */}
      {showIOSGuide && (
        <div className="ios-overlay" onClick={() => setShowIOSGuide(false)}>
          <div className="ios-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Install Total-iora</h3>
            <ol>
              <li>Tap the <strong>Share</strong> button <span style={{ fontSize: 18 }}>&#x2B06;&#xFE0F;</span> at the bottom of Safari</li>
              <li>Scroll down and tap <strong>"Add to Home Screen"</strong></li>
              <li>Tap <strong>"Add"</strong> to confirm</li>
            </ol>
            <button className="ios-close" onClick={() => setShowIOSGuide(false)}>Got it</button>
          </div>
        </div>
      )}

      <style jsx>{`
        .install-btn {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 12px 22px;
          border-radius: 999px;
          border: none;
          font-weight: 800;
          font-size: 15px;
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          box-shadow: 0 6px 18px rgba(124, 58, 237, 0.3);
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .install-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px rgba(124, 58, 237, 0.4);
        }
        .install-btn:active {
          transform: translateY(0);
        }

        .install-btn-compact {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          border-radius: 999px;
          border: 1px solid rgba(255,255,255,0.25);
          font-weight: 700;
          font-size: 13px;
          color: #fff;
          background: linear-gradient(135deg, #0ea5e9, #22c55e);
          cursor: pointer;
          transition: transform 0.2s;
        }
        .install-btn-compact:hover {
          transform: translateY(-1px);
        }

        .ios-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          background: rgba(0,0,0,0.5);
          display: grid;
          place-items: center;
          padding: 24px;
        }
        .ios-modal {
          background: #fff;
          border-radius: 20px;
          padding: 24px;
          max-width: 360px;
          width: 100%;
          box-shadow: 0 20px 50px rgba(0,0,0,0.3);
        }
        .ios-modal h3 {
          margin: 0 0 12px;
          font-size: 1.2rem;
          font-weight: 800;
          color: #0f172a;
        }
        .ios-modal ol {
          padding-left: 20px;
          color: #334155;
          line-height: 1.8;
          margin: 0 0 16px;
        }
        .ios-close {
          width: 100%;
          padding: 12px;
          border-radius: 12px;
          border: none;
          font-weight: 700;
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          cursor: pointer;
          font-size: 15px;
        }
      `}</style>
    </>
  );
}
