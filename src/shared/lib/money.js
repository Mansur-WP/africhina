/**
 * Money formatting.
 *
 * Prices are stored as integers in the currency's MINOR units (e.g. kobo for
 * NGN, cents for USD) — see prisma/schema.prisma (Product.price). This helper
 * converts a minor-unit integer into a localised display string. Framework
 * agnostic (no React) so it can be reused on the server and in tests.
 */

const MINOR_UNITS_PER_MAJOR = 100;

/**
 * Format a minor-unit amount as a currency string.
 *
 * @param {number} minorAmount Integer amount in minor units (e.g. 4500000).
 * @param {'NGN'|'CNY'|'USD'} [currency='NGN'] ISO currency code.
 * @returns {string} e.g. "₦45,000.00".
 */
export function formatMoney(minorAmount, currency = 'NGN') {
  const amount = Number(minorAmount ?? 0) / MINOR_UNITS_PER_MAJOR;

  try {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency,
    }).format(amount);
  } catch {
    // Fallback if the runtime lacks the currency in its ICU data.
    const formatted = amount.toLocaleString('en-NG', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return `${currency} ${formatted}`;
  }
}
