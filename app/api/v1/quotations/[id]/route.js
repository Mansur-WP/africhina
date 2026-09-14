import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { getQuotationById } from '@/src/application/rfqs/quotationService.js';

export async function GET(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'buyer')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);
    const quotation = await getQuotationById((await params).id, user.id);
    if (!quotation)
      return errorResponse('NOT_FOUND', 'Quotation not found.', 404);
    return jsonResponse(quotation, 'Quotation loaded.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load quotation.',
      error.status || 500,
    );
  }
}
