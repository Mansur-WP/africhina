import { z } from 'zod';

/**
 * Quotation validation schemas.
 *
 * Used by admin to submit quotations, and by backend to ensure correctness.
 * Prices and amounts are handled as integer minor units (kobo/cents).
 */

export const CURRENCIES = ['NGN', 'CNY', 'USD'];
export const MIN_DELIVERY_DAYS = 1;
export const MAX_DELIVERY_DAYS = 365;
export const MAX_QUOTATION_AMOUNT = 2_000_000_000;

const moneyField = (label) =>
  z.coerce
    .number()
    .int(`${label} must be a whole number in minor units.`)
    .min(0, `${label} cannot be negative.`)
    .max(MAX_QUOTATION_AMOUNT, `${label} is too large.`)
    .default(0);

export const createQuotationSchema = z
  .object({
    // Legacy complete amount. New clients should provide component fields.
    price: z.coerce
      .number()
      .int('Price must be a whole number in minor units (e.g. kobo).')
      .min(100, 'Price must be at least 1.00 unit (100 minor units).')
      .optional(),

    productCost: moneyField('Product cost'),
    chinaShippingCost: moneyField('China shipping cost'),
    inspectionCost: moneyField('Inspection cost'),
    internationalFreightCost: moneyField('International freight cost'),
    customsCost: moneyField('Customs cost'),
    serviceFee: moneyField('Service fee'),
    otherCharges: moneyField('Other charges'),

    // Currency (NGN, CNY, USD).
    currency: z.enum(['NGN', 'CNY', 'USD'], {
      errorMap: () => ({ message: 'Invalid currency selected.' }),
    }),

    // Delivery Estimate (e.g. "14 days", "30 days").
    deliveryEstimate: z
      .string()
      .trim()
      .min(1, 'Please enter a delivery estimate.')
      .max(100, 'Delivery estimate must be 100 characters or fewer.'),

    // Notes & terms (optional, can breakdown sourcing/shipping costs).
    notes: z
      .string()
      .trim()
      .max(2000, 'Notes must be 2000 characters or fewer.')
      .optional()
      .nullable()
      .transform((v) => v || null),

    expiresAt: z.coerce.date().optional().nullable(),

    status: z.enum(['draft', 'sent']).default('draft'),

    // Number of days until this quote expires (legacy compatibility).
    validDays: z.coerce
      .number()
      .int('Validity period must be a whole number of days.')
      .min(1, 'Validity must be at least 1 day.')
      .max(90, 'Validity period cannot exceed 90 days.')
      .default(14),
  })
  .superRefine((value, context) => {
    const hasComponents = [
      value.productCost,
      value.chinaShippingCost,
      value.inspectionCost,
      value.internationalFreightCost,
      value.customsCost,
      value.serviceFee,
      value.otherCharges,
    ].some((amount) => amount > 0);

    if (!hasComponents && value.price === undefined) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['productCost'],
        message: 'Provide quotation financial values.',
      });
    }

    if (value.expiresAt && Number.isNaN(value.expiresAt.getTime())) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['expiresAt'],
        message: 'Expiration date is invalid.',
      });
    }
  });
