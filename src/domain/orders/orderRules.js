export const ORDER_SNAPSHOT_FIELDS = [
  'productCost',
  'chinaShippingCost',
  'inspectionCost',
  'internationalFreightCost',
  'customsCost',
  'serviceFee',
  'otherCharges',
];

export function isAcceptedQuotation(quotation) {
  return (
    quotation?.status === 'accepted' &&
    (!quotation.expiresAt || new Date(quotation.expiresAt) >= new Date())
  );
}

export function isCheckoutEligible(status) {
  return status === 'draft';
}

export function quotationSnapshot(quotation) {
  return Object.fromEntries(
    ORDER_SNAPSHOT_FIELDS.map((field) => [field, quotation[field]]),
  );
}
