import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { createProductSchema } from '@/src/shared/validators/product.js';
import {
  createProduct,
  listAdminProducts,
} from '@/src/application/products/adminProductService.js';

/**
 * POST /api/v1/admin/products — Create a new Direct Sale product.
 * GET  /api/v1/admin/products — List all products for admin (with filters).
 *
 * Auth: Admin only.
 */

export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const body = await req.json();
    const parsed = createProductSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid product data.',
        422,
        parsed.error.issues,
      );
    }

    const product = await createProduct(parsed.data);
    return jsonResponse(product, 'Product created.', 201);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to create product.',
      error.status || 500,
    );
  }
}

export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const limit = Math.min(
      100,
      Math.max(1, Number(searchParams.get('limit') || 20)),
    );
    const search = searchParams.get('search') || undefined;
    const status = searchParams.get('status') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;

    const result = await listAdminProducts({
      page,
      limit,
      search,
      status,
      categoryId,
    });

    return jsonResponse(
      result.products,
      'Admin products loaded.',
      200,
      result.pagination,
    );
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load products.',
      error.status || 500,
    );
  }
}
