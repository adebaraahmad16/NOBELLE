// NOBELLE Currency Utility
// The store trades in Nigerian Naira (₦). All amounts stored in the
// application data layer are plain numbers in Naira.

export const CURRENCY_SYMBOL = '₦';

/**
 * Format an amount in Naira.
 * e.g. 247500 → "₦247,500"  |  1250.5 → "₦1,250.50"
 */
export function formatNaira(amount, options = {}) {
  const { compact = false, decimals } = options;
  if (amount === null || amount === undefined || isNaN(amount)) return '₦0';

  const hasFraction = Number(amount) % 1 !== 0;
  const min = decimals !== undefined ? decimals : hasFraction ? 2 : 0;

  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: min,
    maximumFractionDigits: min,
    notation: compact ? 'compact' : 'standard',
  })
    .format(amount)
    .replace('NGN', '₦');
}

/**
 * Alias kept for existing imports — Naira is the store currency.
 */
export const formatCurrency = formatNaira;

/**
 * Plain number formatting without the symbol (e.g. table cells that
 * already have a currency header).
 */
export function formatAmount(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) return '0';
  return new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2 }).format(amount);
}

/**
 * Generate a transaction-style reference, e.g. "NBL-7F3K9Q2X".
 * Used when a real payment gateway reference is not available.
 */
export function generateReference(prefix = 'NBL') {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `${prefix}-${rand}`;
}
