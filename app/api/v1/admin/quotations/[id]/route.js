import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';
import { createQuotationSchema } from '@/src/shared/validators/quotation.js';
import {
  getAdminQuotationById,
  updateQuotation,
} from '@/src/application/rfqs/quotationService.js';

async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user)
    throw Object.assign(new Error('Authentication required.'), {
      code: 'UNAUTHORIZED',
      status: 401,
    });
  if (user.role?.code !== 'admin')
    throw Object.assign(new Error('Access denied.'), {
      code: 'FORBIDDEN',
      status: 403,
    });
}

export async function GET(_req, { params }) {
  try {
    await requireAdmin();
    const quotation = await getAdminQuotationById((await params).id);
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

export async function PATCH(req, { params }) {
  try {
    await requireAdmin();
    const parsed = createQuotationSchema.safeParse(await req.json());
    if (!parsed.success)
      return errorResponse(
        'VALIDATION_ERROR',
        'Validation failed.',
        422,
        parsed.error.issues,
      );
    const quotation = await updateQuotation((await params).id, parsed.data);
    if (!quotation)
      return errorResponse('NOT_FOUND', 'Quotation not found.', 404);
    return jsonResponse(quotation, 'Draft quotation updated.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to update quotation.',
      error.status || 500,
    );
  }
}
