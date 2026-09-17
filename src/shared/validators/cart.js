import { z } from 'zod';

export const cartQuantitySchema = z.object({
  quantity: z.coerce.number().int().min(1).max(100000),
});

export const cartAddSchema = cartQuantitySchema.extend({
  productId: z.string().trim().min(1).max(50),
});

export const directSaleCheckoutSchema = z.object({
  destination: z.string().trim().min(1).max(200),
  idempotencyKey: z.string().trim().min(8).max(200).optional(),
});

export const paymentInitializationSchema = z.object({
  orderId: z.string().trim().min(1).max(50),
  idempotencyKey: z.string().trim().min(8).max(200),
});
