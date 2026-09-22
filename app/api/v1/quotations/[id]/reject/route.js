import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { rejectQuotation } from '@/src/application/rfqs/quotationService.js';

/**
 * POST /api/v1/quotations/:id/reject
 *
 * Buyer rejects a quotation.
 * Auth: Required — buyer role only.
 */
export async function POST(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'buyer')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const { id } = await params;
    const quotation = await rejectQuotation(id, user.id);

    return jsonResponse(quotation, 'Quotation rejected successfully.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to reject quotation.',
      error.status || 500,
    );
  }
}
