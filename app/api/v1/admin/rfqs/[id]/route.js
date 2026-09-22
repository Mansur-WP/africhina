import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { getAdminRfqById } from '@/src/application/rfqs/rfqService.js';

/**
 * GET /api/v1/admin/rfqs/:id
 *
 * Retrieves a single RFQ details, including buyer contact info and quotations list.
 * Auth: Required — admin role only.
 */
export async function GET(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const { id } = await params;
    const rfq = await getAdminRfqById(id);

    if (!rfq) {
      return errorResponse('NOT_FOUND', 'RFQ not found.', 404);
    }

    return jsonResponse(rfq, 'RFQ details loaded.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load RFQ.',
      error.status || 500,
    );
  }
}
