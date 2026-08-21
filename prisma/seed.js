import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Local placeholder used for every seeded product image. Stored as a real,
// structured URL so it can be swapped for a Cloudinary URL later without any
// schema or code change.
const PLACEHOLDER_IMAGE = '/images/products/placeholder.svg';

// Development supplier. This is NOT a real, verified, or partnered supplier —
// it exists only so seeded products satisfy the required supplier relation.
// verificationStatus is intentionally left as the default `pending`.
const DEV_SUPPLIER_EMAIL = 'sourcing.dev@africhinaconnect.test';

// Milestone 4 catalogue categories (docs + Milestone 4 brief). Upserted by
// slug so re-running is idempotent and does not disturb any other categories.
const categories = [
  { name: 'Electronics', slug: 'electronics' },
  { name: 'Phone Accessories', slug: 'phone-accessories' },
  { name: 'Fashion', slug: 'fashion' },
  { name: 'Beauty', slug: 'beauty' },
  { name: 'Home & Kitchen', slug: 'home-kitchen' },
  { name: 'Business Equipment', slug: 'business-equipment' },
];

// Realistic China-sourced product *types* for a development catalogue.
// Prices are in NGN minor units (kobo). Descriptions are generic and factual —
// no brand names, certifications, authenticity or guarantee claims.
// A few non-active items exercise status filtering (only `active` is public).
const productDefs = [
  // Electronics
  {
    title: 'Wireless Bluetooth Earbuds (TWS)',
    categorySlug: 'electronics',
    price: 1_850_000,
    minimumOrderQty: 50,
    status: 'active',
    images: 3,
    description:
      'True wireless stereo earbuds with charging case, touch controls and USB-C charging. Typical battery life 4–5 hours per charge. Bulk sourcing available.',
  },
  {
    title: '20000mAh Power Bank (USB-C PD)',
    categorySlug: 'electronics',
    price: 2_200_000,
    minimumOrderQty: 30,
    status: 'active',
    description:
      'High-capacity power bank with USB-C Power Delivery and dual USB-A outputs. Suitable for phones, tablets and small devices.',
  },
  {
    title: '1080p Webcam with Microphone',
    categorySlug: 'electronics',
    price: 1_500_000,
    minimumOrderQty: 40,
    status: 'active',
    description:
      'Plug-and-play 1080p USB webcam with built-in microphone and clip mount. Compatible with common video-conferencing software.',
  },
  {
    title: '10-inch LED Ring Light with Tripod',
    categorySlug: 'electronics',
    price: 1_250_000,
    minimumOrderQty: 60,
    status: 'active',
    images: 3,
    description:
      'Adjustable colour-temperature ring light with phone holder and extendable tripod. USB powered.',
  },

  // Phone Accessories
  {
    title: 'USB-C Fast Charging Cable (1m)',
    categorySlug: 'phone-accessories',
    price: 280_000,
    minimumOrderQty: 200,
    status: 'active',
    description:
      'Braided USB-C to USB-C cable supporting fast charging and data transfer. 1 metre length. Sold in bulk cartons.',
  },
  {
    title: 'Tempered Glass Screen Protector (Pack of 10)',
    categorySlug: 'phone-accessories',
    price: 650_000,
    minimumOrderQty: 100,
    status: 'active',
    description:
      'Pack of ten 9H tempered glass protectors with cleaning kit. Assorted popular phone sizes available on request.',
  },
  {
    title: 'Silicone Phone Case (Assorted Colours)',
    categorySlug: 'phone-accessories',
    price: 320_000,
    minimumOrderQty: 150,
    status: 'active',
    description:
      'Soft-touch silicone protective case with microfibre lining. Assorted colours; model range confirmed at quotation.',
  },
  {
    title: '3-in-1 Wireless Charging Stand',
    categorySlug: 'phone-accessories',
    price: 1_400_000,
    minimumOrderQty: 40,
    status: 'active',
    images: 3,
    description:
      'Wireless charging stand for phone, earbuds and smartwatch. Includes power adapter. Qi-compatible devices.',
  },

  // Fashion
  {
    title: 'Unisex Canvas Sneakers',
    categorySlug: 'fashion',
    price: 1_600_000,
    minimumOrderQty: 50,
    status: 'active',
    description:
      'Lace-up canvas sneakers with rubber sole. Full size range and assorted colours available. Sold per carton.',
  },
  {
    title: 'Adjustable Baseball Cap',
    categorySlug: 'fashion',
    price: 450_000,
    minimumOrderQty: 120,
    status: 'active',
    description:
      'Cotton-blend baseball cap with adjustable strap. Plain or custom embroidery available on request.',
  },
  {
    title: 'Leatherette Crossbody Bag',
    categorySlug: 'fashion',
    price: 1_900_000,
    minimumOrderQty: 40,
    status: 'active',
    description:
      'Compact crossbody bag in synthetic leather with adjustable strap and zip compartments. Assorted colours.',
  },
  {
    title: 'Stainless Steel Wristwatch',
    categorySlug: 'fashion',
    price: 2_100_000,
    minimumOrderQty: 30,
    status: 'active',
    description:
      'Quartz wristwatch with stainless steel strap and mineral glass face. Unisex design.',
  },

  // Beauty
  {
    title: 'Electric Facial Cleansing Brush',
    categorySlug: 'beauty',
    price: 1_100_000,
    minimumOrderQty: 60,
    status: 'active',
    description:
      'Rechargeable facial cleansing brush with silicone bristles and multiple speed settings. USB charging.',
  },
  {
    title: 'Makeup Brush Set (12 Pieces)',
    categorySlug: 'beauty',
    price: 850_000,
    minimumOrderQty: 80,
    status: 'active',
    images: 3,
    description:
      'Twelve-piece synthetic-bristle makeup brush set with storage pouch. Assorted handle colours.',
  },
  {
    title: 'LED Vanity Mirror',
    categorySlug: 'beauty',
    price: 1_750_000,
    minimumOrderQty: 30,
    status: 'active',
    description:
      'Desktop vanity mirror with dimmable LED lighting and touch control. USB powered.',
  },
  {
    title: 'Hair Styling Comb Set',
    categorySlug: 'beauty',
    price: 390_000,
    minimumOrderQty: 150,
    status: 'active',
    description:
      'Assorted styling comb set in durable plastic. Sold in bulk packs.',
  },

  // Home & Kitchen
  {
    title: 'Stainless Steel Vacuum Flask (500ml)',
    categorySlug: 'home-kitchen',
    price: 950_000,
    minimumOrderQty: 80,
    status: 'active',
    description:
      'Double-walled vacuum flask, 500ml, keeps drinks hot or cold for hours. Leak-resistant lid.',
  },
  {
    title: 'Silicone Kitchen Utensil Set (10 Pieces)',
    categorySlug: 'home-kitchen',
    price: 1_200_000,
    minimumOrderQty: 60,
    status: 'active',
    description:
      'Heat-resistant silicone utensil set with wooden handles and stand. Ten pieces per set.',
  },
  {
    title: 'Collapsible Food Storage Containers (Set)',
    categorySlug: 'home-kitchen',
    price: 1_050_000,
    minimumOrderQty: 70,
    status: 'active',
    description:
      'Space-saving collapsible silicone containers with airtight lids. Assorted sizes per set.',
  },
  {
    title: 'Handheld Electric Milk Frother',
    categorySlug: 'home-kitchen',
    price: 680_000,
    minimumOrderQty: 100,
    status: 'active',
    description:
      'Battery-powered handheld frother with stainless steel whisk. For coffee, milk and beverages.',
  },

  // Business Equipment
  {
    title: 'Thermal Receipt Printer (58mm)',
    categorySlug: 'business-equipment',
    price: 2_800_000,
    minimumOrderQty: 20,
    status: 'active',
    description:
      '58mm thermal receipt printer with USB connectivity. Compatible with common point-of-sale software.',
  },
  {
    title: 'Wireless Barcode Scanner',
    categorySlug: 'business-equipment',
    price: 3_400_000,
    minimumOrderQty: 15,
    status: 'active',
    images: 3,
    description:
      'Wireless 1D/2D barcode scanner with USB receiver and rechargeable battery. Includes stand.',
  },
  {
    title: 'A4 Laminating Machine',
    categorySlug: 'business-equipment',
    price: 3_100_000,
    minimumOrderQty: 20,
    status: 'active',
    description:
      'Desktop A4 laminator with hot and cold modes. Warm-up indicator and jam release.',
  },
  {
    title: 'Desktop Label Maker',
    categorySlug: 'business-equipment',
    price: 2_450_000,
    minimumOrderQty: 25,
    status: 'active',
    description:
      'Compact label maker with keypad and multiple font sizes. Uses standard label tape cartridges.',
  },

  // Non-active items — hidden from the public catalogue (verify status filter).
  {
    title: 'Prototype Smart Watch (Sampling)',
    categorySlug: 'electronics',
    price: 3_900_000,
    minimumOrderQty: 10,
    status: 'draft',
    description:
      'Sample-stage smartwatch under evaluation. Not yet available for sourcing.',
  },
  {
    title: 'Discontinued Bluetooth Speaker',
    categorySlug: 'electronics',
    price: 900_000,
    minimumOrderQty: 40,
    status: 'inactive',
    description: 'Previous-generation speaker, no longer offered for sourcing.',
  },
];

async function main() {
  const roles = [
    { code: 'guest', name: 'Guest' },
    { code: 'buyer', name: 'Buyer' },
    { code: 'supplier', name: 'Supplier' },
    { code: 'logistics', name: 'Logistics' },
    { code: 'agent', name: 'Agent' },
    { code: 'admin', name: 'Admin' },
  ];

  await prisma.role.createMany({
    data: roles,
    skipDuplicates: true,
  });

  // Categories — idempotent upsert by unique slug.
  for (const category of categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: { name: category.name },
      create: category,
    });
  }

  const categoryRecords = await prisma.category.findMany({
    where: { slug: { in: categories.map((c) => c.slug) } },
  });
  const categoryIdBySlug = new Map(categoryRecords.map((c) => [c.slug, c.id]));

  // Development supplier user + supplier profile (idempotent).
  const supplierRole = await prisma.role.findUnique({
    where: { code: 'supplier' },
  });
  const passwordHash = await bcrypt.hash('DevSupplier#2026', 12);

  const supplierUser = await prisma.user.upsert({
    where: { email: DEV_SUPPLIER_EMAIL },
    update: {},
    create: {
      email: DEV_SUPPLIER_EMAIL,
      name: 'Sample Supplier (Development)',
      passwordHash,
      roleId: supplierRole.id,
      emailVerified: true,
    },
  });

  const supplier = await prisma.supplier.upsert({
    where: { userId: supplierUser.id },
    update: {},
    create: {
      userId: supplierUser.id,
      companyName: 'Sample Supplier (Development)',
      country: 'China',
      // Left as default `pending` — never seed a fake "verified" supplier.
      verificationStatus: 'pending',
    },
  });

  // Products — only seed when this supplier has none, so re-runs don't
  // duplicate the catalogue or delete existing data.
  const existingCount = await prisma.product.count({
    where: { supplierId: supplier.id },
  });

  if (existingCount === 0) {
    for (const def of productDefs) {
      const categoryId = categoryIdBySlug.get(def.categorySlug);
      if (!categoryId) continue;

      const imageCount = def.images ?? 1;
      const images = Array.from({ length: imageCount }).map((_, index) => ({
        url: PLACEHOLDER_IMAGE,
        alt: imageCount > 1 ? `${def.title} — view ${index + 1}` : def.title,
        sortOrder: index,
      }));

      await prisma.product.create({
        data: {
          supplierId: supplier.id,
          categoryId,
          title: def.title,
          description: def.description,
          price: def.price,
          currency: 'NGN',
          minimumOrderQty: def.minimumOrderQty,
          status: def.status,
          images: { create: images },
        },
      });
    }
    console.log(`Seeded ${productDefs.length} development products.`);
  } else {
    console.log(
      `Skipped product seeding — supplier already has ${existingCount} products.`,
    );
  }

  console.log('Seed data has been created.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
