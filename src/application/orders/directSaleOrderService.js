import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import {
  cartInclude,
  conflict,
  getDirectSaleProduct,
  validateQuantity,
} from '@/src/application/cart/cartService.js';

function validationError(message) {
  const error = new Error(message);
  error.code = 'VALIDATION_ERROR';
  error.status = 422;
  return error;
}

function orderReference() {
  const year = new Date().getFullYear();
  return `AC-O-${year}-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
}

function toOrder(order) {
  return {
    id: order.id,
    orderNumber: order.orderNumber,
    buyerId: order.buyerId,
    supplierId: order.supplierId,
    purchaseIntentId: order.purchaseIntentId,
    purchaseMode: order.purchaseMode,
    status: order.status,
    productCost: order.productCost,
    totalAmount: order.totalAmount,
    currency: order.currency,
    shippingAddress: order.shippingAddress,
    items: order.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      productTitle: item.productTitle,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      currency: item.currency,
      subtotal: item.subtotal,
    })),
    createdAt: order.createdAt.toISOString(),
  };
}

function orderInclude() {
  return {
    items: { orderBy: { id: 'asc' } },
  };
}

export async function prepareDirectSaleOrder(
  buyerId,
  { destination, idempotencyKey } = {},
) {
  if (!destination?.trim()) {
    throw validationError('Destination is required.');
  }

  try {
    return await prisma
      .$transaction(
        async (tx) => {
          if (idempotencyKey) {
            const existingIntent = await tx.purchaseIntent.findUnique({
              where: {
                buyerId_idempotencyKey: { buyerId, idempotencyKey },
              },
              include: { order: { include: orderInclude() } },
            });
            if (existingIntent?.order) return { order: existingIntent.order };
          }

          const cart = await tx.cart.findUnique({
            where: { buyerId },
            include: cartInclude(),
          });
          if (!cart || cart.items.length === 0) {
            throw conflict('Your cart is empty.');
          }

          const items = [];
          let total = 0;
          let currency = null;

          for (const cartItem of cart.items) {
            const product = await getDirectSaleProduct(cartItem.productId, tx);
            validateQuantity(product, cartItem.quantity);
            if (currency && currency !== product.currency) {
              throw conflict(
                'All direct-sale cart items must use one currency.',
              );
            }
            currency = product.currency;
            const subtotal = product.price * cartItem.quantity;
            total += subtotal;
            items.push({ product, quantity: cartItem.quantity, subtotal });
          }

          for (const item of items) {
            const reserved = await tx.product.updateMany({
              where: {
                id: item.product.id,
                purchaseMode: 'DIRECT_SALE',
                status: 'active',
                deletedAt: null,
                stock: { gte: item.quantity },
              },
              data: { stock: { decrement: item.quantity } },
            });
            if (reserved.count !== 1) {
              throw conflict('Stock changed. Review your cart and try again.');
            }
          }

          const intent = await tx.purchaseIntent.create({
            data: {
              buyerId,
              cartId: cart.id,
              idempotencyKey: idempotencyKey ?? null,
              purchaseMode: 'DIRECT_SALE',
              status: 'CONVERTED',
              destination: destination.trim(),
            },
            select: { id: true },
          });

          const order = await tx.order.create({
            data: {
              orderNumber: orderReference(),
              buyerId,
              supplierId: null,
              purchaseIntentId: intent.id,
              purchaseMode: 'DIRECT_SALE',
              stockReservationStatus: 'ACTIVE',
              stockReservationExpiresAt: new Date(Date.now() + 30 * 60 * 1000),
              status: 'pending_payment',
              productCost: total,
              chinaShippingCost: 0,
              inspectionCost: 0,
              internationalFreightCost: 0,
              customsCost: 0,
              serviceFee: 0,
              otherCharges: 0,
              totalAmount: total,
              currency,
              shippingAddress: destination.trim(),
              items: {
                create: items.map(({ product, quantity, subtotal }) => ({
                  productId: product.id,
                  productTitle: product.title,
                  quantity,
                  unitPrice: product.price,
                  currency: product.currency,
                  subtotal,
                })),
              },
            },
            include: orderInclude(),
          });

          await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
          return { order };
        },
        { isolationLevel: 'Serializable' },
      )
      .then(({ order }) => toOrder(order));
  } catch (error) {
    if (error?.code === 'P2034') {
      throw conflict(
        'Checkout conflicted with another stock update. Try again.',
      );
    }
    throw error;
  }
}

export async function releaseDirectSaleStock(orderId) {
  return prisma.$transaction(
    async (tx) => {
      const order = await tx.order.findFirst({
        where: {
          id: orderId,
          purchaseMode: 'DIRECT_SALE',
          stockReservationStatus: 'ACTIVE',
        },
        select: {
          id: true,
          items: { select: { productId: true, quantity: true } },
        },
      });

      if (!order) return false;

      const updated = await tx.order.updateMany({
        where: {
          id: order.id,
          stockReservationStatus: 'ACTIVE',
        },
        data: {
          stockReservationStatus: 'RELEASED',
          stockReservationReleasedAt: new Date(),
          status: 'cancelled',
        },
      });

      if (updated.count !== 1) return false;

      for (const item of order.items) {
        if (!item.productId) continue;
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }

      return true;
    },
    { isolationLevel: 'Serializable' },
  );
}

export async function commitDirectSaleStock(orderId) {
  const result = await prisma.order.updateMany({
    where: {
      id: orderId,
      purchaseMode: 'DIRECT_SALE',
      stockReservationStatus: 'ACTIVE',
    },
    data: {
      stockReservationStatus: 'COMMITTED',
      stockReservationCommittedAt: new Date(),
    },
  });

  if (result.count === 1) return true;

  const existing = await prisma.order.findFirst({
    where: {
      id: orderId,
      purchaseMode: 'DIRECT_SALE',
      stockReservationStatus: 'COMMITTED',
    },
    select: { id: true },
  });
  return Boolean(existing);
}
