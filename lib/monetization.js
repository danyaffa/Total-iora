// FILE: /lib/monetization.js
// Simple, toggleable monetization config for AuraCode.
// No external deps. Import anywhere with:  import { FREE_MODE, PLANS, isFree, getPlans } from "../lib/monetization";

/** 
 * When true, the product runs fully free (no pricing shown; unlock routes can redirect).
 * Flip to false when you’re ready to show/enable plans.
 */
export const FREE_MODE = true;

/**
 * Pricing plans (empty while free). Populate when you launch billing.
 * Example:
 * { id: "monthly", name: "Monthly", priceLabel: "$9/mo", href: "https://your-checkout-link" }
 * { id: "yearly",  name: "Yearly",  priceLabel: "$79/yr", href: "https://your-checkout-link" }
 */
export const PLANS = [
  // add plan objects here when ready
];

/** True if site should behave as free (no paywall UI). */
export function isFree() {
  return FREE_MODE || getPlans().length === 0;
}

/** Return only well-formed plans (safeguards against partial config). */
export function getPlans() {
  if (!Array.isArray(PLANS)) return [];
  return PLANS.filter(
    (p) => p && typeof p === "object" && p.id && p.name && p.priceLabel && p.href
  );
}
