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

export const createQuotationSchema = z.object({
  // Price in minor units (positive integer).
  price: z.coerce
    .number()
    .int('Price must be a whole number in minor units (e.g. kobo).')
    .min(100, 'Price must be at least 1.00 unit (100 minor units).'),

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

  // Number of days until this quote expires (optional, defaults to 14).
  validDays: z.coerce
    .number()
    .int('Validity period must be a whole number of days.')
    .min(1, 'Validity must be at least 1 day.')
    .max(90, 'Validity period cannot exceed 90 days.')
    .default(14),
});
