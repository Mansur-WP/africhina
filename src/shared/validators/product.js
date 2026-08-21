import { z } from 'zod';

/**
 * Product catalogue query validation.
 *
 * These schemas validate the read-only query parameters accepted by
 * `GET /api/v1/products` (see docs/api-contract.md). All product reads are
 * public, so validation here is the first line of defence: it coerces and
 * bounds pagination, trims free-text search, and whitelists sort fields to
 * prevent unsafe/injected ordering. Prisma is always given typed values.
 */

// Sort fields a customer is allowed to order the catalogue by. Whitelisted to
// prevent arbitrary column ordering (docs/api-contract.md — Sorting Standard).
export const PRODUCT_SORT_FIELDS = ['createdAt', 'price', 'title'];

export const DEFAULT_PRODUCT_SORT = { field: 'createdAt', direction: 'desc' };

export const PRODUCT_PAGE_SIZE_DEFAULT = 20;
export const PRODUCT_PAGE_SIZE_MAX = 100;

// Treat empty-string / null query values as "absent" so `?q=` or `?page=`
// fall back to defaults instead of failing validation.
const emptyToUndefined = (value) =>
  value === '' || value === null ? undefined : value;

export const productListQuerySchema = z.object({
  // Free-text search across title/description. Bounded length to avoid abuse.
  q: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).max(100).optional(),
  ),
  // Category filter by id (structured param per api-contract example).
  categoryId: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).max(50).optional(),
  ),
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
      .max(PRODUCT_PAGE_SIZE_MAX)
      .default(PRODUCT_PAGE_SIZE_DEFAULT),
  ),
  // Raw sort string (e.g. "price:asc"); resolved/whitelisted separately.
  sort: z.preprocess(
    emptyToUndefined,
    z.string().trim().min(1).max(50).optional(),
  ),
});

/**
 * Resolve a `sort=<field>:<asc|desc>` string against the whitelist.
 *
 * @param {string|undefined|null} sortParam
 * @returns {{ field: string, direction: 'asc'|'desc' } | null}
 *   Default sort when absent; `null` when the field or direction is invalid
 *   (caller should respond 400 VALIDATION_ERROR).
 */
export function resolveProductSort(sortParam) {
  if (!sortParam) {
    return { ...DEFAULT_PRODUCT_SORT };
  }

  const [field, dir] = String(sortParam).split(':');

  if (!PRODUCT_SORT_FIELDS.includes(field)) {
    return null;
  }

  if (dir !== 'asc' && dir !== 'desc') {
    return null;
  }

  return { field, direction: dir };
}
