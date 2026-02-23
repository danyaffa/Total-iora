// FILE: /lib/monetization.js
// Monetization config for Total-iora — now powered by PayPal.

/**
 * When true, the product runs fully free (no pricing shown).
 * Flip to false when you're ready to show/enable PayPal plans.
 */
export const FREE_MODE = true;

/**
 * Pricing plans. Populate when you launch billing via PayPal.
 * Example:
 * { id: "monthly", name: "Monthly", priceLabel: "$9/mo", paypalPlanId: "P-XXXXXX" }
 * { id: "yearly",  name: "Yearly",  priceLabel: "$79/yr", paypalPlanId: "P-YYYYYY" }
 */
export const PLANS = [
  // add plan objects here when ready
];

/** True if site should behave as free (no paywall UI). */
export function isFree() {
  return FREE_MODE || getPlans().length === 0;
}

/** Return only well-formed plans. */
export function getPlans() {
  if (!Array.isArray(PLANS)) return [];
  return PLANS.filter(
    (p) => p && typeof p === "object" && p.id && p.name && p.priceLabel
  );
}
