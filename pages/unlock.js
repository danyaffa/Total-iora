// FILE: /pages/unlock.js
// Upgrade page — $5/month via PayPal
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Link from "next/link";
import Script from "next/script";
import {
  PAYPAL_CLIENT_ID,
  PAYPAL_MONTHLY_PLAN_ID,
  PAYPAL_CURRENCY,
} from "../lib/paypal";

function setCookie(name, value, maxAgeDays = 30) {
  if (typeof document === "undefined") return;
  const maxAge = maxAgeDays * 24 * 3600;
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
}

function clearCookie(name) {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; Path=/`;
}

const MONTHLY_PRICE = "5.00";

export default function Unlock() {
  const router = useRouter();
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");
  const [sdkReady, setSdkReady] = useState(false);

  useEffect(() => {
    // Clear promo session state so the banner won't reappear after upgrade
    if (paid) {
      clearCookie("ac_promo");
      localStorage.removeItem("ac_promo_start");
    }
  }, [paid]);

  const handlePaymentSuccess = async () => {
    setPaid(true);
    setCookie("ac_session", "1", 30);
    setCookie("ac_registered", "1", 365);
    clearCookie("ac_promo");
    localStorage.removeItem("ac_promo_start");
    localStorage.setItem("ac_is_paid", "1");

    // Persist payment status to Firestore
    const email = localStorage.getItem("ac_email");
    if (email) {
      try {
        await fetch("/api/mark-paid", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
          credentials: "include",
        });
      } catch (err) {
        console.error("Failed to persist payment status:", err);
      }
    }

    setTimeout(() => router.push("/homepage"), 2000);
  };

  return (
    <div className="wrap">
      <Head>
        <title>Upgrade — Total-iora</title>
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
        <meta
          name="description"
          content="Upgrade to Total-iora Premium for unlimited spiritual guidance, Sacred Notes, and voice oracle access."
        />
      </Head>

      <nav className="topnav">
        <Link href="/homepage" className="back-link">
          &larr; Back
        </Link>
      </nav>

      <header className="hero">
        <img
          src="/TotalIora_Logo.png"
          alt="Total-iora"
          className="logo"
        />
        <h1>Unlock Total-iora</h1>
        <p className="subtitle">
          Unlimited access to your personal spiritual sanctuary
        </p>
      </header>

      {paid ? (
        <div className="success-card">
          <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          <h2>Payment Successful!</h2>
          <p>Welcome to Total-iora Premium. Redirecting to your dashboard...</p>
        </div>
      ) : (
        <>
          <div className="plan-card">
            <div className="plan-badge">Most Popular</div>
            <div className="plan-header">
              <span className="plan-price">${MONTHLY_PRICE}</span>
              <span className="plan-period">/month</span>
            </div>
            <p className="plan-desc">
              Full access to everything Total-iora offers
            </p>

            <ul className="features">
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Unlimited voice guidance sessions
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Sacred Notes &amp; virtual candles
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Oracle Universe DNA reports
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                All atmospheres &amp; faith traditions
              </li>
              <li>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                Cancel anytime — no commitments
              </li>
            </ul>

            {PAYPAL_CLIENT_ID ? (
              <>
                <Script
                  src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${PAYPAL_CURRENCY}${PAYPAL_MONTHLY_PLAN_ID ? "&vault=true&intent=subscription" : "&intent=capture"}`}
                  onLoad={() => setSdkReady(true)}
                />
                {sdkReady && PAYPAL_MONTHLY_PLAN_ID ? (
                  <PayPalSubscription
                    planId={PAYPAL_MONTHLY_PLAN_ID}
                    onSuccess={handlePaymentSuccess}
                    onError={(err) => {
                      console.error("PayPal error:", err);
                      setError("Payment failed. Please try again.");
                    }}
                  />
                ) : sdkReady ? (
                  <PayPalOneTime
                    amount={MONTHLY_PRICE}
                    currency={PAYPAL_CURRENCY}
                    onSuccess={handlePaymentSuccess}
                    onError={(err) => {
                      console.error("PayPal error:", err);
                      setError("Payment failed. Please try again.");
                    }}
                  />
                ) : (
                  <div className="loading">Loading payment...</div>
                )}
              </>
            ) : (
              <p className="muted">
                Payment is being set up. Please check back soon or visit our <a href="/#faq">FAQ</a> for help.
              </p>
            )}

            {error && <p className="err">{error}</p>}
          </div>

          <p className="secure-note">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0110 0v4"/>
            </svg>
            Secure payment via PayPal. Cancel anytime.
          </p>
        </>
      )}

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          background: linear-gradient(#fff, #f8fafc);
          padding: 0 16px 40px;
        }
        .topnav {
          padding: 16px 0;
        }
        .back-link {
          color: #7c3aed;
          font-weight: 700;
          font-size: 0.95rem;
          text-decoration: none;
        }
        .back-link:hover {
          text-decoration: underline;
        }
        .hero {
          text-align: center;
          padding-top: 8px;
        }
        .logo {
          width: 72px;
          height: 72px;
          border-radius: 14px;
          box-shadow: 0 6px 18px rgba(2, 6, 23, 0.12);
        }
        h1 {
          margin: 12px 0 4px;
          font-size: 1.8rem;
          font-weight: 800;
          color: #0f172a;
        }
        .subtitle {
          color: #475569;
          font-size: 0.95rem;
          margin: 0 0 20px;
        }
        .plan-card {
          position: relative;
          max-width: 420px;
          margin: 0 auto;
          background: #fff;
          border: 2px solid #7c3aed;
          border-radius: 24px;
          padding: 32px 24px 24px;
          box-shadow: 0 10px 40px rgba(124, 58, 237, 0.12);
        }
        .plan-badge {
          position: absolute;
          top: -12px;
          left: 50%;
          transform: translateX(-50%);
          padding: 4px 16px;
          background: linear-gradient(135deg, #7c3aed, #14b8a6);
          color: #fff;
          font-weight: 700;
          font-size: 0.8rem;
          border-radius: 999px;
          white-space: nowrap;
        }
        .plan-header {
          text-align: center;
          margin-bottom: 4px;
        }
        .plan-price {
          font-size: 3rem;
          font-weight: 800;
          color: #0f172a;
        }
        .plan-period {
          font-size: 1.1rem;
          font-weight: 600;
          color: #64748b;
        }
        .plan-desc {
          text-align: center;
          color: #475569;
          margin: 0 0 16px;
        }
        .features {
          list-style: none;
          padding: 0;
          margin: 0 0 20px;
          display: grid;
          gap: 10px;
        }
        .features li {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 0.95rem;
          color: #334155;
          font-weight: 600;
        }
        .loading {
          text-align: center;
          color: #64748b;
          padding: 16px;
        }
        .muted {
          text-align: center;
          color: #94a3b8;
          font-size: 0.9rem;
        }
        .err {
          color: #b91c1c;
          font-weight: 700;
          text-align: center;
          margin-top: 12px;
        }
        .success-card {
          max-width: 420px;
          margin: 40px auto;
          background: #fff;
          border-radius: 24px;
          padding: 40px 24px;
          box-shadow: 0 10px 40px rgba(2, 6, 23, 0.1);
          text-align: center;
        }
        .success-card h2 {
          color: #16a34a;
          font-weight: 800;
          margin: 12px 0 8px;
        }
        .success-card p {
          color: #475569;
        }
        .secure-note {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #94a3b8;
          font-size: 0.85rem;
          margin-top: 16px;
          text-align: center;
        }
        @media (max-width: 480px) {
          .wrap {
            padding: 0 12px 32px;
          }
          h1 {
            font-size: 1.5rem;
          }
          .plan-card {
            padding: 28px 18px 20px;
          }
          .plan-price {
            font-size: 2.4rem;
          }
        }
      `}</style>
    </div>
  );
}

/* PayPal subscription button (when plan ID is configured) */
function PayPalSubscription({ planId, onSuccess, onError }) {
  useEffect(() => {
    if (!window.paypal) return;
    window.paypal
      .Buttons({
        style: { layout: "vertical", color: "gold", shape: "pill", label: "subscribe" },
        createSubscription: async () => {
          const response = await fetch("/api/paypal/create-subscription", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ planId }),
          });

          if (!response.ok) {
            throw new Error("Unable to create subscription");
          }

          const payload = await response.json();
          return payload.id;
        },
        onApprove: async (data) => {
          const response = await fetch(`/api/paypal/get-subscription?subscriptionId=${data.subscriptionID}`);
          if (!response.ok) {
            throw new Error("Unable to verify subscription");
          }
          const payload = await response.json();
          if (payload.status === "ACTIVE" || payload.status === "APPROVAL_PENDING") {
            onSuccess();
            return;
          }
          throw new Error("Subscription was not activated");
        },
        onError,
      })
      .render("#paypal-btn");
  }, [planId, onSuccess, onError]);

  return <div id="paypal-btn" />;
}

/* PayPal one-time payment fallback (when no subscription plan is configured) */
function PayPalOneTime({ amount, currency, onSuccess, onError }) {
  useEffect(() => {
    if (!window.paypal) return;
    window.paypal
      .Buttons({
        style: { layout: "vertical", color: "gold", shape: "pill", label: "pay" },
        createOrder: async () => {
          const response = await fetch("/api/paypal/create-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount, currency }),
          });
          if (!response.ok) {
            throw new Error("Unable to create order");
          }
          const payload = await response.json();
          return payload.id;
        },
        onApprove: async (data) => {
          const response = await fetch("/api/paypal/capture-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ orderId: data.orderID }),
          });
          if (!response.ok) {
            throw new Error("Unable to capture order");
          }
          onSuccess();
        },
        onError,
      })
      .render("#paypal-btn");
  }, [amount, currency, onSuccess, onError]);

  return <div id="paypal-btn" />;
}
