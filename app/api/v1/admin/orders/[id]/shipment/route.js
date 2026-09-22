import { getCurrentUser } from '@/src/infrastructure/auth/sessionManager.js';
import { createOrUpdateShipment } from '@/src/application/orders/orderService.js';
import { errorResponse, jsonResponse } from '@/src/shared/lib/response.js';

// POST /api/v1/admin/orders/[id]/shipment — create or update shipment
// PATCH /api/v1/admin/orders/[id]/shipment — same handler; both create and update
export async function POST(req, { params }) {
  return handleShipmentUpsert(req, params);
}

export async function PATCH(req, { params }) {
  return handleShipmentUpsert(req, params);
}

async function handleShipmentUpsert(req, params) {
  try {
    const user = await getCurrentUser();
    if (!user)
      return errorResponse('UNAUTHORIZED', 'Authentication required.', 401);
    if (user.role?.code !== 'admin')
      return errorResponse('FORBIDDEN', 'Access denied.', 403);

    const orderId = (await params).id;
    const body = await req.json();
    const { carrier, trackingNumber, eventDescription, eventLocation } =
      body ?? {};

    if (!carrier && !trackingNumber && !eventDescription && !eventLocation) {
      return errorResponse(
        'VALIDATION_ERROR',
        'Provide at least one of: carrier, trackingNumber, eventDescription, eventLocation.',
        422,
      );
    }

    const shipment = await createOrUpdateShipment(orderId, user.id, {
      carrier,
      trackingNumber,
      eventDescription,
      eventLocation,
    });

    return jsonResponse(shipment, 'Shipment saved.', 200);
  } catch (error) {
    return errorResponse(
      error.code || 'INTERNAL_ERROR',
      error.message || 'Unable to save shipment.',
      error.status || 500,
    );
  }
}
