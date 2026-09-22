import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { getOrderInvoice } from '@/src/application/invoices/invoiceService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

export async function GET(_req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    }

    const { id } = await params;
    const invoice = await getOrderInvoice(id, user);

    return jsonResponse(invoice, 'Invoice retrieved successfully.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to retrieve invoice.',
      error.status || 500,
    );
  }
}
