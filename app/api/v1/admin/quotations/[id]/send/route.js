import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { sendQuotation } from '@/src/application/rfqs/quotationService.js';

export async function POST(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);
    const quotation = await sendQuotation((await params).id);
    if (!quotation)
      return errorResponse('NOT_FOUND', 'Quotation not found.', 404);
    return jsonResponse(quotation, 'Quotation sent.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to send quotation.',
      error.status || 500,
    );
  }
}
