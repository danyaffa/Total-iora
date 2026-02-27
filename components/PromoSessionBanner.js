// FILE: /components/PromoSessionBanner.js
// Shows a timeout banner after free promo session expires (~3 minutes)
import { useEffect, useState } from "react";
import Link from "next/link";

const FREE_MINUTES = 3;
const FREE_MS = FREE_MINUTES * 60 * 1000;

function getCookie(name) {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp("(?:^|; )" + name + "=([^;]*)"));
  return m ? decodeURIComponent(m[1]) : null;
}

export default function PromoSessionBanner() {
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const isPromo = getCookie("ac_promo") === "1";
    if (!isPromo) return;

    const startStr = localStorage.getItem("ac_promo_start");
    if (!startStr) return;

    const start = Number(startStr);
    const elapsed = Date.now() - start;
    const remaining = FREE_MS - elapsed;

    if (remaining <= 0) {
      setExpired(true);
      return;
    }

    const timer = setTimeout(() => setExpired(true), remaining);
    return () => clearTimeout(timer);
  }, []);

  if (!expired) return null;

  return (
    <>
      <div className="promo-overlay" role="dialog" aria-modal="true" aria-label="Session expired">
        <div className="promo-panel">
          <div className="promo-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>

          <h2>Your free session has ended</h2>
          <p>
            You've enjoyed your complimentary preview of <strong>Total-iora</strong>.
            Upgrade now to unlock unlimited access to spiritual guidance, Sacred Notes,
            and voice conversations with your personal oracle.
          </p>

          <div className="promo-price">
            <span className="amount">$5</span>
            <span className="period">/month</span>
          </div>

          <Link href="/unlock" className="promo-cta">
            Upgrade Now
          </Link>

          <div className="promo-perks">
            <div className="perk">Unlimited voice guidance</div>
            <div className="perk">Sacred Notes &amp; candles</div>
            <div className="perk">Oracle Universe DNA</div>
            <div className="perk">All atmospheres &amp; faiths</div>
          </div>

          <Link href="/login" className="promo-dismiss">
            Log in with account
          </Link>
        </div>
      </div>

      <style jsx>{`
        .promo-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
          display: grid;
          place-items: center;
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(6px);
          padding: 24px 16px;
          animation: fadeIn 0.4s ease;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .promo-panel {
          width: 100%;
          max-width: 420px;
          background: #fff;
          border-radius: 24px;
          padding: 32px 24px;
          box-shadow: 0 20px 60px rgba(2, 6, 23, 0.25);
          text-align: center;
          animation: slideUp 0.4s ease;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .promo-icon {
          margin-bottom: 12px;
        }
        h2 {
          margin: 0 0 8px;
          font-size: 1.4rem;
          font-weight: 800;
          color: #0f172a;
        }
        p {
          color: #475569;
          font-size: 0.95rem;
          line-height: 1.5;
          margin: 0 0 16px;
        }
        .promo-price {
          margin-bottom: 16px;
        }
        .amount {
          font-size: 2.4rem;
          font-weight: 800;
          color: #7c3aed;
        }
        .period {
          font-size: 1rem;
          font-weight: 600;
          color: #64748b;
        }
        .promo-cta {
          display: block;
          padding: 16px 24px;
          border-radius: 14px;
          font-weight: 800;
          font-size: 1.1rem;
          color: #fff;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          text-decoration: none;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .promo-cta:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 30px rgba(124, 58, 237, 0.35);
        }
        .promo-perks {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
          margin: 16px 0;
        }
        .perk {
          padding: 8px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          color: #334155;
        }
        .promo-dismiss {
          display: inline-block;
          margin-top: 4px;
          color: #64748b;
          font-size: 0.88rem;
          font-weight: 600;
          text-decoration: underline;
        }
        .promo-dismiss:hover {
          color: #334155;
        }
        @media (max-width: 480px) {
          .promo-panel {
            padding: 24px 18px;
          }
          h2 {
            font-size: 1.2rem;
          }
          .amount {
            font-size: 2rem;
          }
        }
      `}</style>
    </>
  );
}
