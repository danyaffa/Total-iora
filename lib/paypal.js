// FILE: /lib/paypal.js
// PayPal payment configuration for Total-iora

export const PAYPAL_CLIENT_ID = process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID;

export const PAYPAL_MONTHLY_PLAN_ID = process.env.NEXT_PUBLIC_PAYPAL_MONTHLY_PLAN_ID || "";
export const PAYPAL_YEARLY_PLAN_ID = "";

export const PAYPAL_AMOUNT = "5.00";
export const PAYPAL_CURRENCY = "USD";

export const PAYPAL_MODE = "live";
