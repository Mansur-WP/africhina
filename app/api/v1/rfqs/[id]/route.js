import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import {
  getMyRfqById,
  cancelMyRfq,
} from '@/src/application/rfqs/rfqService.js';

/**
 * GET /api/v1/rfqs/:id
 *
 * Returns the detail of a single RFQ. Enforces ownership — a buyer can only
 * view their own RFQs. Returns 404 for missing, soft-deleted, or other
 * customers' RFQs to avoid leaking existence information.
 *
 * Auth: Required — buyer only.
 */
export async function GET(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'buyer')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const { id } = await params;
    const rfq = await getMyRfqById(id, user.id);

    if (!rfq) {
      return errorResponse('NOT_FOUND', 'RFQ not found.', 404);
    }

    return jsonResponse(rfq, 'RFQ loaded.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load RFQ.',
      error.status || 500,
    );
  }
}

/**
 * DELETE /api/v1/rfqs/:id  (used for cancel)
 *
 * Cancels an eligible RFQ. Enforces:
 *   - Ownership (buyer can only cancel their own RFQ)
 *   - Status rule (only `open` RFQs can be cancelled)
 *
 * Auth: Required — buyer only.
 */
export async function DELETE(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'buyer')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const { id } = await params;
    const rfq = await cancelMyRfq(id, user.id);

    return jsonResponse(rfq, 'RFQ cancelled.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to cancel RFQ.',
      error.status || 500,
    );
  }
}
