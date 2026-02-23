// FILE: /pages/unlock.js
// PayPal-powered upgrade page (replaces Stripe)
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import Script from "next/script";
import { PAYPAL_CLIENT_ID, PAYPAL_AMOUNT, PAYPAL_CURRENCY } from "../lib/paypal";

const FREE_MODE = true;
const PLANS = [];
const isFree = () => FREE_MODE || PLANS.length === 0;

export default function Unlock() {
  const router = useRouter();
  const [paid, setPaid] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isFree()) router.replace("/register");
  }, [router]);

  if (isFree()) return null;

  return (
    <div className="wrap">
      <Head>
        <title>Upgrade — Total-iora</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <header className="hero">
        <h1>Choose a Plan</h1>
        <p>Secure payment via PayPal. Cancel anytime.</p>
      </header>

      {paid ? (
        <div className="success">
          <h2>Payment Successful!</h2>
          <p>Your access has been unlocked. Redirecting...</p>
        </div>
      ) : (
        <main className="paypal-container">
          {PAYPAL_CLIENT_ID && (
            <Script
              src={`https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=${PAYPAL_CURRENCY}`}
              onLoad={() => {
                if (window.paypal) {
                  window.paypal
                    .Buttons({
                      style: {
                        layout: "vertical",
                        color: "blue",
                        shape: "pill",
                        label: "pay",
                      },
                      createOrder: (data, actions) => {
                        return actions.order.create({
                          purchase_units: [
                            {
                              amount: {
                                value: PAYPAL_AMOUNT,
                                currency_code: PAYPAL_CURRENCY,
                              },
                              description: "Total-iora Premium Access",
                            },
                          ],
                        });
                      },
                      onApprove: async (data, actions) => {
                        const order = await actions.order.capture();
                        console.log("PayPal payment captured:", order);
                        setPaid(true);
                        // Set session cookies
                        const secure =
                          typeof window !== "undefined" &&
                          window.location.protocol === "https:";
                        document.cookie = `ac_session=1; Max-Age=${30 * 24 * 3600}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
                        document.cookie = `ac_registered=1; Max-Age=${365 * 24 * 3600}; Path=/; SameSite=Lax${secure ? "; Secure" : ""}`;
                        setTimeout(() => router.push("/homepage"), 2000);
                      },
                      onError: (err) => {
                        console.error("PayPal error:", err);
                        setError(
                          "Payment failed. Please try again or contact support."
                        );
                      },
                    })
                    .render("#paypal-button-container");
                }
              }}
            />
          )}

          <div id="paypal-button-container" />
          {error && <p className="err">{error}</p>}

          {!PAYPAL_CLIENT_ID && (
            <p className="muted">
              Payment is not configured yet. Please contact support.
            </p>
          )}
        </main>
      )}

      <style jsx>{`
        .wrap {
          min-height: 100vh;
          background: linear-gradient(#fff, #f8fafc);
          padding: 28px 16px 40px;
        }
        .hero {
          text-align: center;
        }
        h1 {
          font-size: 1.8rem;
          font-weight: 800;
          color: #0f172a;
        }
        .hero p {
          color: #475569;
          margin-top: 4px;
        }
        .paypal-container {
          max-width: 440px;
          margin: 24px auto 0;
          padding: 20px;
          background: #fff;
          border: 1px solid rgba(15, 23, 42, 0.08);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(2, 6, 23, 0.08);
        }
        .success {
          text-align: center;
          padding: 40px 16px;
        }
        .success h2 {
          color: #16a34a;
          font-weight: 800;
        }
        .err {
          color: #b91c1c;
          font-weight: 700;
          text-align: center;
          margin-top: 12px;
        }
        .muted {
          color: #94a3b8;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
