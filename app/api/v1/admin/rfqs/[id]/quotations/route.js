import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { createQuotationSchema } from '@/src/shared/validators/quotation.js';
import { createQuotation } from '@/src/application/rfqs/quotationService.js';

/**
 * POST /api/v1/admin/rfqs/:id/quotations
 *
 * Creates a new quotation for a customer RFQ.
 * Auth: Required — admin role only.
 */
export async function POST(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const { id: rfqId } = await params;

    let body;
    try {
      body = await req.json();
    } catch {
      return errorResponse(
        'VALIDATION_ERROR',
        'Request body must be valid JSON.',
        422,
      );
    }

    const parsed = createQuotationSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Validation failed.',
        422,
        parsed.error.issues,
      );
    }

    const quotation = await createQuotation(rfqId, parsed.data);
    return jsonResponse(quotation, 'Draft quotation created.', 201);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to create quotation.',
      error.status || 500,
    );
  }
}
