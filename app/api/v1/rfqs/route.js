import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import {
  createRfqSchema,
  rfqListQuerySchema,
} from '@/src/shared/validators/rfq.js';
import { createRfq, listMyRfqs } from '@/src/application/rfqs/rfqService.js';

/**
 * GET /api/v1/rfqs
 *
 * Lists the authenticated buyer's own RFQs with pagination.
 * Auth: Required — buyer role only.
 */
export async function GET(req) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'buyer')
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

    const { rfqs, pagination } = await listMyRfqs(user.id, parsed.data);
    return jsonResponse(rfqs, 'RFQs loaded.', 200, pagination);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to load RFQs.',
      error.status || 500,
    );
  }
}

/**
 * POST /api/v1/rfqs
 *
 * Creates a new RFQ for the authenticated buyer.
 * Auth: Required — buyer role only.
 */
export async function POST(req) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'buyer')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

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

    const parsed = createRfqSchema.safeParse(body);
    if (!parsed.success) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Validation failed.',
        422,
        parsed.error.issues,
      );
    }

    // Require either a catalogued productId or a custom productDescription
    const { productId, productDescription } = parsed.data;
    if (!productId && !productDescription) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Please specify a product or describe what you need.',
        422,
      );
    }

    const rfq = await createRfq(user.id, parsed.data);
    return jsonResponse(rfq, 'RFQ submitted successfully.', 201);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to create RFQ.',
      error.status || 500,
    );
  }
}
