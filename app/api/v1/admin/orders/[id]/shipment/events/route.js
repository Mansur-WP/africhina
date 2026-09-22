import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { addShipmentTrackingEvent } from '@/src/application/orders/orderService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

// POST /api/v1/admin/orders/[id]/shipment/events
export async function POST(req, { params }) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const orderId = (await params).id;
    const body = await req.json();
    const { description, location, shipmentStatus } = body ?? {};

    if (!description && !location) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Provide at least a description or location for the tracking event.',
        422,
      );
    }

    const event = await addShipmentTrackingEvent(orderId, user.id, {
      description,
      location,
      shipmentStatus,
    });

    return jsonResponse(event, 'Tracking event recorded.', 201);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to record tracking event.',
      error.status || 500,
    );
  }
}
