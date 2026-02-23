// FILE: /lib/paypal.js
// PayPal payment configuration for Total-iora

// PayPal Client ID from environment
export const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "";

// PayPal subscription plan IDs (set these in Vercel env vars)
export const PAYPAL_MONTHLY_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID || "";
export const PAYPAL_YEARLY_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_YEARLY_PLAN_ID || "";

// One-time payment amount (used if no subscription plans are configured)
export const PAYPAL_AMOUNT = process.env.NEXT_PUBLIC_PAYPAL_AMOUNT || "9.00";
export const PAYPAL_CURRENCY = process.env.NEXT_PUBLIC_PAYPAL_CURRENCY || "USD";

// PayPal mode: "sandbox" for testing, "live" for production
export const PAYPAL_MODE = process.env.NEXT_PUBLIC_PAYPAL_MODE || "sandbox";
