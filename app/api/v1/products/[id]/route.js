import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { getActiveProductById } from '@/src/application/products/productService.js';

/**
 * GET /api/v1/products/:id
 *
 * Public (Auth: No — docs/api-contract.md). Returns a single active product
 * with its images and category. Draft/inactive/deleted or unknown ids return
 * 404 so hidden products are not disclosed. No internal supplier data exposed.
 */
export async function GET(_req, { params }) {
  try {
    const { id } = await params;

    const product = await getActiveProductById(id);
    if (!product) {
      return errorResponse('NOT_FOUND', 'Product not found', 404);
    }

    return jsonResponse(product, 'Product loaded', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load product',
      error.status || 500,
    );
  }
}
