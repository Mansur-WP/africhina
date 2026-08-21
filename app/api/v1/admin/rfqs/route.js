import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { listAllRfqsAdmin } from '@/src/application/rfqs/rfqService.js';
import { rfqListQuerySchema } from '@/src/shared/validators/rfq.js';

/**
 * GET /api/v1/admin/rfqs
 *
 * Lists all RFQs across the platform with pagination.
 * Auth: Required — admin role only.
 */
export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const { searchParams } = new URL(req.url);
    const parsed = rfqListQuerySchema.safeParse({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    });

    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Invalid query parameters.',
        422,
        parsed.error.issues,
      );
    }

    const { rfqs, pagination } = await listAllRfqsAdmin(parsed.data);
    return jsonResponse(rfqs, 'All RFQs loaded.', 200, pagination);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load RFQs.',
      error.status || 500,
    );
  }
}
