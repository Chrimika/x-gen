import type { Plan, PricingConfig } from "./types";

export const DEFAULT_PRICING: PricingConfig = {
  baseCostFCFA: 18500,
  marginFCFA: 2000,
  notchPayFeePercent: 0.02,
  fullPriceFCFA: 21000, // (18500+2000)*1.02 ≈ 20910 → arrondi 21000
  currency: "XAF",
};

/**
 * Calculates the number of days in a plan cycle.
 */
export function getCycleDays(plan: Plan): number {
  const start = new Date(plan.startDate);
  const end = new Date(plan.endDate);
  return Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
}

/**
 * Calculates days elapsed since plan start.
 */
export function getDaysElapsed(plan: Plan, now: Date = new Date()): number {
  const start = new Date(plan.startDate);
  const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, Math.min(elapsed, getCycleDays(plan)));
}

/**
 * Calculates days remaining in the plan cycle.
 */
export function getDaysRemaining(plan: Plan, now: Date = new Date()): number {
  const end = new Date(plan.endDate);
  const remaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  return Math.max(0, remaining);
}

/**
 * Calculates the percentage of the cycle that has been consumed.
 */
export function getCycleProgress(plan: Plan, now: Date = new Date()): number {
  const total = getCycleDays(plan);
  const elapsed = getDaysElapsed(plan, now);
  return Math.round((elapsed / total) * 100);
}

/**
 * Calculates the prorated price for joining a plan mid-cycle.
 * Formula: (remaining_days/total_days × baseCost + margin) × (1 + notchPayFee)
 * Rounded to nearest 500 FCFA.
 */
export function getProratedPrice(
  plan: Plan,
  pricing: PricingConfig = DEFAULT_PRICING,
  now: Date = new Date()
): number {
  const totalDays = getCycleDays(plan);
  const remaining = getDaysRemaining(plan, now);

  if (remaining <= 0) return 0;
  if (remaining >= totalDays) return pricing.fullPriceFCFA;

  const proratedBase = (remaining / totalDays) * pricing.baseCostFCFA;
  const rawPrice = (proratedBase + pricing.marginFCFA) * (1 + pricing.notchPayFeePercent);

  // Round to nearest 500
  return Math.round(rawPrice / 500) * 500;
}

/**
 * Calculates the margin from a prorated payment.
 */
export function getMarginFromPrice(
  plan: Plan,
  pricing: PricingConfig = DEFAULT_PRICING,
  now: Date = new Date()
): number {
  const price = getProratedPrice(plan, pricing, now);
  const totalDays = getCycleDays(plan);
  const remaining = getDaysRemaining(plan, now);
  const proratedCost = (remaining / totalDays) * pricing.baseCostFCFA;
  return Math.round(price - proratedCost);
}

/**
 * Returns available seats for a plan.
 */
export function getAvailableSeats(plan: Plan): number {
  return Math.max(0, plan.totalSeats - plan.occupiedSeats);
}

/**
 * Formats FCFA price with thousand separators.
 */
export function formatPrice(amount: number): string {
  // fr-FR groups with U+202F, which the display font has no glyph for.
  return amount.toLocaleString("fr-FR").replace(/ /g, " ");
}

/**
 * Formats a date to French locale.
 */
export function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Returns the J-X countdown label.
 */
export function getCountdownLabel(plan: Plan, now: Date = new Date()): string {
  const remaining = getDaysRemaining(plan, now);
  return `J-${remaining}`;
}
