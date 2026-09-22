#!/usr/bin/env node

/**
 * Africhina Connect — Safe Development Database Reset Script
 *
 * Resets the database to a clean acceptance-testing state:
 *
 * PRESERVED:
 *  - System Roles (guest, buyer, supplier, logistics, agent, admin)
 *  - Baseline Product Categories (electronics, phone-accessories, fashion, beauty, home-kitchen, business-equipment)
 *  - Development Platform Supplier (sourcing.dev@africhinaconnect.test / Sample Supplier (Development))
 *  - Primary Admin Account (e.g. admin@africhina.com / non-test admin)
 *
 * PURGED (Target: ZERO):
 *  - ZERO products (all demo/seeded products like Earbuds/Power Bank and test products deleted)
 *  - ZERO product images
 *  - ZERO customer/buyer accounts
 *  - ZERO test admin accounts (e2e_admin_*)
 *  - ZERO carts and cart items
 *  - ZERO purchase intents
 *  - ZERO orders and order items
 *  - ZERO payments
 *  - ZERO invoices
 *  - ZERO shipments and shipment events
 *  - ZERO shipping documents
 *  - ZERO notifications
 *  - ZERO RFQs, RFQ items, and quotations
 *  - ZERO reviews, escrows, tickets, and attachments
 *  - ZERO test sessions and verification tokens
 *
 * Usage:
 *  Dry run / preview mode (SAFE - does not modify database):
 *    npm run db:reset-data
 *
 *  Execute destructive reset:
 *    npm run db:reset-data -- --confirm
 */

import { PrismaClient } from '@prisma/client';

if (typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch {
    // Process env file may not exist or already loaded
  }
}

const prisma = new PrismaClient();

const DEV_SUPPLIER_EMAIL = 'sourcing.dev@africhinaconnect.test';

const BASELINE_CATEGORY_SLUGS = [
  'electronics',
  'phone-accessories',
  'fashion',
  'beauty',
  'home-kitchen',
  'business-equipment',
];

// Helper to extract safe host identifier without credentials
function getSafeDbHost(url) {
  if (!url) return 'UNKNOWN';
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return url.replace(/:[^:@]+@/, ':***@');
  }
}

// Safety guards
function enforceSafetyGuards(dbUrl) {
  // 1. Production NODE_ENV check
  const env = (process.env.NODE_ENV || 'development').toLowerCase();
  if (env === 'production') {
    console.error(
      '\n❌ SAFETY VIOLATION: Cannot reset database when NODE_ENV is "production".',
    );
    process.exit(1);
  }

  // 2. Production database URL check
  if (!dbUrl) {
    console.error(
      '\n❌ CONFIGURATION ERROR: DATABASE_URL environment variable is missing.',
    );
    process.exit(1);
  }

  const lowerUrl = dbUrl.toLowerCase();
  const dangerousPatterns = ['prod.', 'production', '-prod', '_prod', 'live.'];
  for (const pattern of dangerousPatterns) {
    if (lowerUrl.includes(pattern)) {
      console.error(
        `\n❌ SAFETY VIOLATION: DATABASE_URL appears to point to a production database ("${pattern}" detected).`,
      );
      console.error(`Target: ${getSafeDbHost(dbUrl)}`);
      process.exit(1);
    }
  }
}

async function collectCurrentCounts() {
  const [
    roles,
    baselineCategories,
    nonBaselineCategories,
    devSupplier,
    devSupplierDocs,
    preservedUsers,
    purgedUsers,
    products,
    productImages,
    sessions,
    verificationTokens,
    carts,
    cartItems,
    purchaseIntents,
    rfqs,
    rfqItems,
    quotations,
    orders,
    orderItems,
    payments,
    invoices,
    escrows,
    shipments,
    shipmentEvents,
    shippingDocuments,
    tickets,
    ticketReplies,
    notifications,
    reviews,
    attachments,
  ] = await Promise.all([
    prisma.role.count(),
    prisma.category.count({
      where: { slug: { in: BASELINE_CATEGORY_SLUGS } },
    }),
    prisma.category.count({
      where: { slug: { notIn: BASELINE_CATEGORY_SLUGS } },
    }),
    prisma.supplier.count({
      where: { user: { email: DEV_SUPPLIER_EMAIL } },
    }),
    prisma.supplierDocument.count({
      where: { supplier: { user: { email: DEV_SUPPLIER_EMAIL } } },
    }),
    prisma.user.count({
      where: {
        NOT: {
          OR: [{ role: { code: 'buyer' } }, { email: { startsWith: 'e2e_' } }],
        },
      },
    }),
    prisma.user.count({
      where: {
        OR: [{ role: { code: 'buyer' } }, { email: { startsWith: 'e2e_' } }],
      },
    }),
    prisma.product.count(),
    prisma.productImage.count(),
    prisma.session.count({
      where: {
        user: {
          OR: [{ role: { code: 'buyer' } }, { email: { startsWith: 'e2e_' } }],
        },
      },
    }),
    prisma.verificationToken.count({
      where: {
        user: {
          OR: [{ role: { code: 'buyer' } }, { email: { startsWith: 'e2e_' } }],
        },
      },
    }),
    prisma.cart.count(),
    prisma.cartItem.count(),
    prisma.purchaseIntent.count(),
    prisma.rFQ.count(),
    prisma.rFQItem.count(),
    prisma.quotation.count(),
    prisma.order.count(),
    prisma.orderItem.count(),
    prisma.payment.count(),
    prisma.invoice.count(),
    prisma.escrow.count(),
    prisma.shipment.count(),
    prisma.shipmentEvent.count(),
    prisma.shippingDocument.count(),
    prisma.ticket.count(),
    prisma.ticketReply.count(),
    prisma.notification.count(),
    prisma.review.count(),
    prisma.attachment.count(),
  ]);

  return {
    preserved: {
      'System Roles': roles,
      'Baseline Product Categories': baselineCategories,
      'Development Platform Supplier': devSupplier,
      'Platform Supplier Documents': devSupplierDocs,
      'Primary Admin & Operational Accounts': preservedUsers,
    },
    toBeDeleted: {
      'ALL Products (Target: 0)': products,
      'ALL Product Images (Target: 0)': productImages,
      'Customer & Test Accounts (Target: 0)': purgedUsers,
      'Test Sessions': sessions,
      'Test Verification Tokens': verificationTokens,
      'Test / Non-Baseline Categories': nonBaselineCategories,
      Orders: orders,
      'Order Items': orderItems,
      Payments: payments,
      Invoices: invoices,
      'Purchase Intents': purchaseIntents,
      'Cart Items': cartItems,
      Carts: carts,
      Shipments: shipments,
      'Shipment Events': shipmentEvents,
      'Shipping Documents': shippingDocuments,
      Quotations: quotations,
      'RFQ Items': rfqItems,
      RFQs: rfqs,
      Notifications: notifications,
      Reviews: reviews,
      Escrows: escrows,
      Tickets: tickets,
      'Ticket Replies': ticketReplies,
      Attachments: attachments,
    },
  };
}

async function main() {
  const dbUrl = process.env.DATABASE_URL;
  enforceSafetyGuards(dbUrl);

  const hasConfirmFlag =
    process.argv.includes('--confirm') ||
    process.env.RESET_DATA_CONFIRMED === 'true';

  console.log('='.repeat(70));
  console.log(' AFRICHINA CONNECT — DEVELOPMENT DATABASE RESET');
  console.log('='.repeat(70));
  console.log(` Target Host  : ${getSafeDbHost(dbUrl)}`);
  console.log(` Environment  : ${process.env.NODE_ENV || 'development'}`);
  console.log(
    ` Mode         : ${hasConfirmFlag ? '⚠️  EXECUTION (DESTRUCTIVE RESET)' : '🔍 DRY-RUN / PREVIEW ONLY'}`,
  );
  console.log('='.repeat(70));

  console.log('\nAnalyzing database state...');
  const counts = await collectCurrentCounts();

  console.log('\n📋 RECORDS TO PRESERVE (Untouched):');
  console.table(
    Object.entries(counts.preserved).map(([model, count]) => ({
      'Model / Group': model,
      'Current Records': count,
      Action: 'PRESERVE',
    })),
  );

  console.log('\n🗑️  RECORDS TO PURGE (Reset to 0):');
  console.table(
    Object.entries(counts.toBeDeleted).map(([model, count]) => ({
      'Model / Group': model,
      'Current Records': count,
      Action: 'DELETE',
    })),
  );

  if (!hasConfirmFlag) {
    console.log('\n' + '-'.repeat(70));
    console.log(
      'ℹ️  DRY RUN COMPLETE — NO CHANGES HAVE BEEN MADE TO THE DATABASE.',
    );
    console.log('To execute this reset, run:');
    console.log('  npm run db:reset-data -- --confirm');
    console.log('-'.repeat(70) + '\n');
    await prisma.$disconnect();
    return;
  }

  console.log(
    '\n⚠️  Confirmed flag detected. Commencing FK-safe deletion in transaction...',
  );

  const startTime = Date.now();
  const deletionResults = {};

  try {
    await prisma.$transaction(
      async (tx) => {
        // Step 1: Shipment events
        const delShipmentEvents = await tx.shipmentEvent.deleteMany({});
        deletionResults['ShipmentEvent'] = delShipmentEvents.count;

        // Step 2: Shipping documents
        const delShippingDocs = await tx.shippingDocument.deleteMany({});
        deletionResults['ShippingDocument'] = delShippingDocs.count;

        // Step 3: Shipments (Restrict on Order)
        const delShipments = await tx.shipment.deleteMany({});
        deletionResults['Shipment'] = delShipments.count;

        // Step 4: Invoices (Restrict on Order)
        const delInvoices = await tx.invoice.deleteMany({});
        deletionResults['Invoice'] = delInvoices.count;

        // Step 5: Escrows (Restrict on Order)
        const delEscrows = await tx.escrow.deleteMany({});
        deletionResults['Escrow'] = delEscrows.count;

        // Step 6: Payments (Restrict on Order)
        const delPayments = await tx.payment.deleteMany({});
        deletionResults['Payment'] = delPayments.count;

        // Step 7: Reviews (Restrict on Order & User & Product)
        const delReviews = await tx.review.deleteMany({});
        deletionResults['Review'] = delReviews.count;

        // Step 8: Ticket replies (Restrict on User)
        const delReplies = await tx.ticketReply.deleteMany({});
        deletionResults['TicketReply'] = delReplies.count;

        // Step 9: Tickets (Restrict on User)
        const delTickets = await tx.ticket.deleteMany({});
        deletionResults['Ticket'] = delTickets.count;

        // Step 10: Order items (Restrict on Product)
        const delOrderItems = await tx.orderItem.deleteMany({});
        deletionResults['OrderItem'] = delOrderItems.count;

        // Step 11: Orders (Restrict on User)
        const delOrders = await tx.order.deleteMany({});
        deletionResults['Order'] = delOrders.count;

        // Step 12: Quotations (Restrict on Supplier)
        const delQuotations = await tx.quotation.deleteMany({});
        deletionResults['Quotation'] = delQuotations.count;

        // Step 13: RFQ items (Restrict on Product)
        const delRfqItems = await tx.rFQItem.deleteMany({});
        deletionResults['RFQItem'] = delRfqItems.count;

        // Step 14: RFQs (Restrict on User)
        const delRfqs = await tx.rFQ.deleteMany({});
        deletionResults['RFQ'] = delRfqs.count;

        // Step 15: Purchase intents (Restrict on User)
        const delPurchaseIntents = await tx.purchaseIntent.deleteMany({});
        deletionResults['PurchaseIntent'] = delPurchaseIntents.count;

        // Step 16: Cart items (Restrict on Product)
        const delCartItems = await tx.cartItem.deleteMany({});
        deletionResults['CartItem'] = delCartItems.count;

        // Step 17: Carts (Restrict on User)
        const delCarts = await tx.cart.deleteMany({});
        deletionResults['Cart'] = delCarts.count;

        // Step 18: Notifications (Restrict on User)
        const delNotifications = await tx.notification.deleteMany({});
        deletionResults['Notification'] = delNotifications.count;

        // Step 19: Attachments
        const delAttachments = await tx.attachment.deleteMany({});
        deletionResults['Attachment'] = delAttachments.count;

        // Step 20: Purge ALL Product Images and ALL Products (Target: ZERO products, ZERO product images)
        const delAllImages = await tx.productImage.deleteMany({});
        deletionResults['ProductImage (ALL)'] = delAllImages.count;

        const delAllProducts = await tx.product.deleteMany({});
        deletionResults['Product (ALL)'] = delAllProducts.count;

        // Step 21: Purge non-baseline categories (preserving standard catalogue categories)
        const delTestCategories = await tx.category.deleteMany({
          where: { slug: { notIn: BASELINE_CATEGORY_SLUGS } },
        });
        deletionResults['Non-Baseline Categories'] = delTestCategories.count;

        // Step 22: Purge any non-platform test suppliers if created during tests
        const delTestSuppliers = await tx.supplier.deleteMany({
          where: {
            NOT: { user: { email: DEV_SUPPLIER_EMAIL } },
          },
        });
        deletionResults['Test Suppliers'] = delTestSuppliers.count;

        // Step 23: Purge sessions and verification tokens for buyer and E2E test users
        const purgeUsersList = await tx.user.findMany({
          where: {
            OR: [
              { role: { code: 'buyer' } },
              { email: { startsWith: 'e2e_' } },
            ],
          },
          select: { id: true },
        });
        const purgeUserIds = purgeUsersList.map((u) => u.id);

        const delTestSessions = await tx.session.deleteMany({
          where: { userId: { in: purgeUserIds } },
        });
        deletionResults['Test User Sessions'] = delTestSessions.count;

        const delTestTokens = await tx.verificationToken.deleteMany({
          where: { userId: { in: purgeUserIds } },
        });
        deletionResults['Test User Verification Tokens'] = delTestTokens.count;

        // Step 24: Purge customer/buyer accounts & test users (preserving primary admin & platform supplier)
        const delTestUsers = await tx.user.deleteMany({
          where: { id: { in: purgeUserIds } },
        });
        deletionResults['Purged Users (Buyers & Test Accounts)'] =
          delTestUsers.count;
      },
      {
        maxWait: 15000,
        timeout: 60000,
      },
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `\n✅ DATABASE RESET COMPLETED SUCCESSFULLY in ${duration}s!\n`,
    );

    console.log('📊 DELETION SUMMARY:');
    console.table(
      Object.entries(deletionResults).map(([model, deletedCount]) => ({
        Model: model,
        'Records Deleted': deletedCount,
      })),
    );

    // Post-reset verification
    const [
      remainingBuyers,
      remainingTestUsers,
      remainingOrders,
      remainingCarts,
      remainingRfqs,
      remainingProducts,
      remainingProductImages,
      remainingCategories,
      remainingSuppliers,
      remainingOperationalUsers,
    ] = await Promise.all([
      prisma.user.count({ where: { role: { code: 'buyer' } } }),
      prisma.user.count({ where: { email: { startsWith: 'e2e_' } } }),
      prisma.order.count(),
      prisma.cart.count(),
      prisma.rFQ.count(),
      prisma.product.count(),
      prisma.productImage.count(),
      prisma.category.count(),
      prisma.supplier.count(),
      prisma.user.count({
        where: {
          NOT: {
            OR: [
              { role: { code: 'buyer' } },
              { email: { startsWith: 'e2e_' } },
            ],
          },
        },
      }),
    ]);

    console.log('🔍 POST-RESET INTEGRITY VERIFICATION:');
    console.table([
      {
        Target: 'Buyer Users Remaining',
        Count: remainingBuyers,
        Status: remainingBuyers === 0 ? '✅ PASS' : '❌ FAIL',
      },
      {
        Target: 'Test Users Remaining (e2e_*)',
        Count: remainingTestUsers,
        Status: remainingTestUsers === 0 ? '✅ PASS' : '❌ FAIL',
      },
      {
        Target: 'Products Remaining (ZERO)',
        Count: remainingProducts,
        Status: remainingProducts === 0 ? '✅ PASS' : '❌ FAIL',
      },
      {
        Target: 'Product Images Remaining (ZERO)',
        Count: remainingProductImages,
        Status: remainingProductImages === 0 ? '✅ PASS' : '❌ FAIL',
      },
      {
        Target: 'Orders Remaining (ZERO)',
        Count: remainingOrders,
        Status: remainingOrders === 0 ? '✅ PASS' : '❌ FAIL',
      },
      {
        Target: 'Carts Remaining (ZERO)',
        Count: remainingCarts,
        Status: remainingCarts === 0 ? '✅ PASS' : '❌ FAIL',
      },
      {
        Target: 'RFQs Remaining (ZERO)',
        Count: remainingRfqs,
        Status: remainingRfqs === 0 ? '✅ PASS' : '❌ FAIL',
      },
      {
        Target: 'Baseline Categories Intact',
        Count: remainingCategories,
        Status: remainingCategories >= 6 ? '✅ PASS' : '⚠️ WARNING',
      },
      {
        Target: 'Platform Supplier Intact',
        Count: remainingSuppliers,
        Status: remainingSuppliers >= 1 ? '✅ PASS' : '⚠️ WARNING',
      },
      {
        Target: 'Primary Admin & Staff Intact',
        Count: remainingOperationalUsers,
        Status: remainingOperationalUsers >= 1 ? '✅ PASS' : '⚠️ WARNING',
      },
    ]);
  } catch (error) {
    console.error(
      '\n❌ ERROR OCCURRED DURING RESET TRANSACTION. ALL CHANGES ROLLED BACK.\n',
    );
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch(async (e) => {
  console.error('Fatal error during execution:', e);
  await prisma.$disconnect();
  process.exit(1);
});
