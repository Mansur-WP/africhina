import { prisma } from '../../../lib/prisma.js';

function validationError(message) {
  const error = new Error(message);
  error.code = 'VALIDATION_ERROR';
  error.status = 422;
  return error;
}

function notFound(message = 'Cart item not found.') {
  const error = new Error(message);
  error.code = 'NOT_FOUND';
  error.status = 404;
  return error;
}

function conflict(message) {
  const error = new Error(message);
  error.code = 'CONFLICT';
  error.status = 409;
  return error;
}

function cartInclude() {
  return {
    items: {
      orderBy: { createdAt: 'asc' },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            price: true,
            currency: true,
            minimumOrderQty: true,
            stock: true,
            purchaseMode: true,
            status: true,
            deletedAt: true,
            images: {
              orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
              take: 1,
              select: { url: true, alt: true },
            },
          },
        },
      },
    },
  };
}

function toPublicCart(cart) {
  return {
    id: cart.id,
    items: cart.items.map((item) => ({
      id: item.id,
      productId: item.productId,
      quantity: item.quantity,
      product: {
        id: item.product.id,
        title: item.product.title,
        price: item.product.price,
        currency: item.product.currency,
        minimumOrderQty: item.product.minimumOrderQty,
        stock: item.product.stock,
        purchaseMode: item.product.purchaseMode,
        status: item.product.status,
        image: item.product.images[0] ?? null,
      },
    })),
    updatedAt: cart.updatedAt.toISOString(),
  };
}

async function getOrCreateCart(buyerId, client = prisma) {
  return client.cart.upsert({
    where: { buyerId },
    create: { buyerId },
    update: {},
    include: cartInclude(),
  });
}

async function getDirectSaleProduct(productId, client = prisma) {
  const product = await client.product.findFirst({
    where: {
      id: productId,
      status: 'active',
      deletedAt: null,
    },
    select: {
      id: true,
      title: true,
      price: true,
      currency: true,
      minimumOrderQty: true,
      stock: true,
      purchaseMode: true,
      status: true,
      deletedAt: true,
      images: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        take: 1,
        select: { url: true, alt: true },
      },
    },
  });

  if (!product) throw notFound('Product not found.');
  if (product.purchaseMode !== 'DIRECT_SALE') {
    throw conflict('This product requires a sourcing request.');
  }
  if (!Number.isInteger(product.stock) || product.stock < 0) {
    throw conflict('This product is not available for direct sale.');
  }
  return product;
}

function validateQuantity(product, quantity) {
  if (!Number.isInteger(quantity) || quantity < 1) {
    throw validationError('Quantity must be at least 1.');
  }
  if (product.minimumOrderQty && quantity < product.minimumOrderQty) {
    throw validationError(
      `Quantity must be at least ${product.minimumOrderQty}.`,
    );
  }
  if (quantity > product.stock) {
    throw conflict('Requested quantity exceeds available stock.');
  }
}

export async function getCart(buyerId) {
  return toPublicCart(await getOrCreateCart(buyerId));
}

export async function addCartItem(buyerId, productId, quantity) {
  const itemId = await prisma.$transaction(
    async (tx) => {
      const product = await getDirectSaleProduct(productId, tx);
      validateQuantity(product, quantity);
      const cart = await getOrCreateCart(buyerId, tx);
      const existing = cart.items.find((item) => item.productId === productId);
      const nextQuantity = (existing?.quantity ?? 0) + quantity;
      validateQuantity(product, nextQuantity);

      const item = await tx.cartItem.upsert({
        where: { cartId_productId: { cartId: cart.id, productId } },
        create: { cartId: cart.id, productId, quantity },
        update: { quantity: nextQuantity },
      });
      return item.id;
    },
    { isolationLevel: 'Serializable', maxWait: 15000, timeout: 30000 },
  );

  return getCart(buyerId).then((result) => ({ ...result, itemId }));
}

export async function updateCartItem(buyerId, itemId, quantity) {
  const cart = await getOrCreateCart(buyerId);
  const item = cart.items.find((entry) => entry.id === itemId);
  if (!item) throw notFound();
  const product = await getDirectSaleProduct(item.productId);
  validateQuantity(product, quantity);
  await prisma.cartItem.update({ where: { id: itemId }, data: { quantity } });
  return getCart(buyerId);
}

export async function removeCartItem(buyerId, itemId) {
  const cart = await getOrCreateCart(buyerId);
  if (!cart.items.some((item) => item.id === itemId)) throw notFound();
  await prisma.cartItem.delete({ where: { id: itemId } });
  return getCart(buyerId);
}

export async function clearCart(buyerId) {
  const cart = await getOrCreateCart(buyerId);
  await prisma.cartItem.deleteMany({ where: { cartId: cart.id } });
  return getCart(buyerId);
}

export { cartInclude, getDirectSaleProduct, validateQuantity, conflict };
