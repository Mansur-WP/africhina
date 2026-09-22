export const QUOTATION_FINANCIAL_FIELDS = [
  'productCost',
  'chinaShippingCost',
  'inspectionCost',
  'internationalFreightCost',
  'customsCost',
  'serviceFee',
  'otherCharges',
];

export function calculateQuotationTotal(input) {
  return QUOTATION_FINANCIAL_FIELDS.reduce(
    (total, field) => total + (input[field] ?? 0),
    0,
  );
}

export function isQuotationExpired(quotation, now = new Date()) {
  return Boolean(quotation.expiresAt && quotation.expiresAt < now);
}

export function canTransitionQuotation(from, to) {
  return (
    (from === 'draft' && to === 'sent') ||
    (from === 'sent' && ['accepted', 'rejected'].includes(to))
  );
}
