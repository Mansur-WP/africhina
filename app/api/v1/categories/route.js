import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { listCategories } from '@/src/application/products/productService.js';

/**
 * GET /api/v1/categories
 *
 * Public (Auth: No — docs/api-contract.md). Lists categories for browsing and
 * filtering the catalogue.
 */
export async function GET() {
  try {
    const categories = await listCategories();
    return jsonResponse(categories, 'Categories loaded', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load categories',
      error.status || 500,
    );
  }
}
