import { z } from 'zod';

/**
 * RFQ validation schemas.
 *
 * These schemas validate all inbound RFQ data: creation payload, list query
 * params, and cancel payload. Server-side validation is the authoritative
 * source of truth — client-side may duplicate these rules for UX but the
 * server ALWAYS re-validates before touching the database.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const RFQ_DESTINATION_MAX_LENGTH = 200;
export const RFQ_NOTES_MAX_LENGTH = 2000;
export const RFQ_TITLE_MAX_LENGTH = 200;
export const RFQ_QUANTITY_MAX = 100_000;
export const RFQ_PAGE_SIZE_DEFAULT = 20;
export const RFQ_PAGE_SIZE_MAX = 100;

// States in which a customer is permitted to cancel an RFQ.
export const CANCELLABLE_STATUSES = ['open'];

// RFQ reference prefix
export const RFQ_REF_PREFIX = 'RFQ';

// ---------------------------------------------------------------------------
// Create RFQ schema
// ---------------------------------------------------------------------------

export const createRfqSchema = z.object({
  // The product being requested — must reference an existing active product.
  // Null/absent for custom (non-catalogue) product requests.
  productId: z
    .preprocess(
      (v) => (v === '' || v === null ? null : v),
      z.string().trim().min(1).max(50).optional().nullable(),
    )
    .transform((v) => v || null),

  // Quantity of units requested (required when productId is present).
  quantity: z.coerce
    .number()
    .int('Quantity must be a whole number.')
    .min(1, 'Please enter a quantity of at least 1.')
    .max(
      RFQ_QUANTITY_MAX,
      `Quantity cannot exceed ${RFQ_QUANTITY_MAX.toLocaleString()}.`,
    ),

  // Human-readable destination (required). Stored as text per the schema.
  destination: z
    .string()
    .trim()
    .min(1, 'Please enter a delivery destination.')
    .max(
      RFQ_DESTINATION_MAX_LENGTH,
      `Destination must be ${RFQ_DESTINATION_MAX_LENGTH} characters or fewer.`,
    ),

  // Optional notes/specifications from the customer.
  notes: z
    .string()
    .trim()
    .max(
      RFQ_NOTES_MAX_LENGTH,
      `Notes must be ${RFQ_NOTES_MAX_LENGTH} characters or fewer.`,
    )
    .optional()
    .nullable()
    .transform((v) => v || null),

  // Optional free-text product description (used for custom product requests
  // where productId is absent).
  productDescription: z
    .string()
    .trim()
    .max(RFQ_TITLE_MAX_LENGTH)
    .optional()
    .nullable()
    .transform((v) => v || null),
});

// ---------------------------------------------------------------------------
// List RFQs query schema
// ---------------------------------------------------------------------------

const emptyToUndefined = (v) => (v === '' || v == null ? undefined : v);

export const rfqListQuerySchema = z.object({
  page: z.preprocess(
    emptyToUndefined,
    z.coerce.number().int().min(1).default(1),
  ),
  limit: z.preprocess(
    emptyToUndefined,
    z.coerce
      .number()
      .int()
      .min(1)
      .max(RFQ_PAGE_SIZE_MAX)
      .default(RFQ_PAGE_SIZE_DEFAULT),
  ),
  status: z.preprocess(
    emptyToUndefined,
    z.enum(['open', 'quoted', 'accepted', 'closed']).optional(),
  ),
});

// ---------------------------------------------------------------------------
// Cancel RFQ schema (no body needed, but validate ID format)
// ---------------------------------------------------------------------------

export const rfqIdSchema = z.object({
  id: z.string().trim().min(1).max(50),
});
