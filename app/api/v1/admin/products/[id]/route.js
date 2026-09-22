import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { updateProductSchema } from '@/src/shared/validators/product.js';
import {
  getAdminProductById,
  updateProduct,
  archiveProduct,
} from '@/src/application/products/adminProductService.js';

/**
 * GET    /api/v1/admin/products/[id] — Fetch single product for editing.
 * PATCH  /api/v1/admin/products/[id] — Update product fields (price, stock, status, etc.).
 * DELETE /api/v1/admin/products/[id] — Archive product (soft delete).
 *
 * Auth: Admin only.
 */

export async function GET(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const { id } = await params;
    const product = await getAdminProductById(id);

    if (!product) {
      return errorResponse('NOT_FOUND', 'Product not found.', 404);
    }

    return jsonResponse(product, 'Product loaded.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load product.',
      error.status || 500,
    );
  }
}

export async function PATCH(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const { id } = await params;
    const body = await req.json();
    const parsed = updateProductSchema.safeParse(body);

    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid product data.',
        422,
        parsed.error.issues,
      );
    }

    const updated = await updateProduct(id, parsed.data);
    return jsonResponse(updated, 'Product updated.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to update product.',
      error.status || 500,
    );
  }
}

export async function DELETE(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const { id } = await params;
    const archived = await archiveProduct(id);
    return jsonResponse(archived, 'Product archived.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to archive product.',
      error.status || 500,
    );
  }
}
