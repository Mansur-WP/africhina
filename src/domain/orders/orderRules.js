export const ORDER_SNAPSHOT_FIELDS = [
  'productCost',
  'chinaShippingCost',
  'inspectionCost',
  'internationalFreightCost',
  'customsCost',
  'serviceFee',
  'otherCharges',
];

// ---------------------------------------------------------------------------
// Direct-sale fulfillment lifecycle
// ---------------------------------------------------------------------------
// DB status values used for direct-sale fulfillment steps.
// We reuse the existing OrderStatus enum values (no schema change needed).
//
//  paid  →  in_production  →  shipped  →  delivered  →  completed
//
// "in_production" is the DB value that maps to the user-facing label "Processing".
// ---------------------------------------------------------------------------

export const FULFILLMENT_TRANSITIONS = {
  paid: 'in_production',
  in_production: 'shipped',
  shipped: 'delivered',
  delivered: 'completed',
};

// Set of statuses that represent an order that is actively in fulfillment.
export const IN_FULFILLMENT_STATUSES = new Set([
  'paid',
  'in_production',
  'ready_to_ship',
  'shipped',
  'in_customs',
  'delivered',
  'completed',
]);

// Validate that `from` → `to` is an allowed fulfillment transition.
// Throws a typed CONFLICT error if the transition is illegal.
export function assertFulfillmentTransition(from, to) {
  const allowed = FULFILLMENT_TRANSITIONS[from];
  if (allowed !== to) {
    const err = new Error(
      `Cannot transition order from "${from}" to "${to}". ` +
        (allowed
          ? `Expected next status: "${allowed}".`
          : `"${from}" has no further fulfillment steps.`),
    );
    err.code = 'CONFLICT';
    err.status = 409;
    throw err;
  }
}

// Returns true only when an order with the given status can have a shipment
// created or updated (i.e., it has been paid and is not yet cancelled).
export function isShipmentEligible(status) {
  return IN_FULFILLMENT_STATUSES.has(status);
}

// ---------------------------------------------------------------------------
// Existing helpers — unchanged
// ---------------------------------------------------------------------------

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
