import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import {
  productListQuerySchema,
  resolveProductSort,
} from '@/src/shared/validators/product.js';
import { listProducts } from '@/src/application/products/productService.js';

/**
 * GET /api/v1/products
 *
 * Public (Auth: No — docs/api-contract.md). Lists active products with
 * pagination, and supports search (`?q=`), category filter (`?categoryId=`)
 * and whitelisted sort (`?sort=field:dir`). Query params are validated before
 * touching the database.
 */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);

    const parsed = productListQuerySchema.safeParse({
      q: searchParams.get('q') ?? undefined,
      categoryId: searchParams.get('categoryId') ?? undefined,
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      sort: searchParams.get('sort') ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid query parameters',
        422,
        parsed.error.issues,
      );
    }

    const sort = resolveProductSort(parsed.data.sort);
    if (sort === null) {
      return errorResponse('VALIDATION_ERROR', 'Invalid sort parameter', 400, [
        { field: 'sort', message: 'Unsupported sort field or direction' },
      ]);
    }

    const { products, pagination } = await listProducts({
      q: parsed.data.q,
      categoryId: parsed.data.categoryId,
      page: parsed.data.page,
      limit: parsed.data.limit,
      sort,
    });

    return jsonResponse(products, 'Products loaded', 200, pagination);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load products',
      error.status || 500,
    );
  }
}
