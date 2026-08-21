import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { acceptQuotation } from '@/src/application/rfqs/quotationService.js';

/**
 * POST /api/v1/quotations/:id/accept
 *
 * Buyer accepts a quotation.
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
    const quotation = await acceptQuotation(id, user.id);

    return jsonResponse(quotation, 'Quotation accepted successfully.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to accept quotation.',
      error.status || 500,
    );
  }
}
