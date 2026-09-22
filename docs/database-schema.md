# Africhina Connect — Database Schema Design

**Version:** 1.0
**Status:** Draft (Sprint 0)
**Engine:** PostgreSQL via Prisma ORM

---

## 1. Conventions

- Primary keys: `cuid()` (or `uuid`).
- Timestamps: `createdAt`, `updatedAt` (UTC).
- Soft deletes where required using `deletedAt` (optional).
- Enums stored as PostgreSQL enums.
- Money stored as `Int` cents (or `Decimal`) to avoid float issues.
- Multi-currency: store amount + currency code.

---

## 2. Entity Relationships Overview

```
User 1───* Supplier
User 1───* Order
Supplier 1───* Product
Category 1───* Product
Product 1───* ProductImage
User 1───* RFQ
RFQ 1───* Quotation
Order 1───1 Escrow
Order 1───* OrderItem
Order 1───* Shipment
Shipment 1───* ShipmentEvent
Order 1───* Payment
Order 1───* Dispute
User 1───* Notification
```

---

## 3. Tables

### users

| Column                | Type       | Notes                                    |
| --------------------- | ---------- | ---------------------------------------- |
| id                    | cuid       | PK                                       |
| email                 | text       | unique                                   |
| name                  | text       |                                          |
| passwordHash          | text       | nullable (OAuth)                         |
| role                  | enum       | buyer, supplier, admin, logistics, agent |
| status                | enum       | active, suspended, pending               |
| phone                 | text       |                                          |
| avatarUrl             | text       |                                          |
| emailVerified         | boolean    |                                          |
| createdAt / updatedAt | timestamps |                                          |

### suppliers

| Column                | Type       | Notes                       |
| --------------------- | ---------- | --------------------------- |
| id                    | cuid       | PK                          |
| userId                | fk         | -> users                    |
| companyName           | text       |                             |
| country               | text       |                             |
| verificationStatus    | enum       | pending, verified, rejected |
| rating                | decimal    |                             |
| createdAt / updatedAt | timestamps |                             |

### supplier_documents

| Column                | Type       | Notes                            |
| --------------------- | ---------- | -------------------------------- |
| id                    | cuid       | PK                               |
| supplierId            | fk         | -> suppliers                     |
| type                  | enum       | businessLicense, identity, other |
| url                   | text       | Cloudinary URL                   |
| status                | enum       | pending, approved, rejected      |
| createdAt / updatedAt | timestamps |                                  |

### categories

| Column   | Type | Notes             |
| -------- | ---- | ----------------- |
| id       | cuid | PK                |
| name     | text |                   |
| slug     | text | unique            |
| parentId | fk   | nullable self-ref |

### products

| Column                | Type       | Notes                   |
| --------------------- | ---------- | ----------------------- |
| id                    | cuid       | PK                      |
| supplierId            | fk         | -> suppliers            |
| categoryId            | fk         | -> categories           |
| title                 | text       |                         |
| description           | text       |                         |
| price                 | decimal    |                         |
| currency              | enum       | CNY, USD, NGN           |
| minimumOrderQty       | int        |                         |
| stock                 | int        |                         |
| status                | enum       | draft, active, inactive |
| createdAt / updatedAt | timestamps |                         |

### product_images

| Column    | Type | Notes          |
| --------- | ---- | -------------- |
| id        | cuid | PK             |
| productId | fk   | -> products    |
| url       | text | Cloudinary URL |
| alt       | text |                |
| sortOrder | int  |                |

### rfqs

| Column                | Type       | Notes                          |
| --------------------- | ---------- | ------------------------------ |
| id                    | cuid       | PK                             |
| buyerId               | fk         | -> users                       |
| title                 | text       |                                |
| description           | text       |                                |
| quantity              | int        |                                |
| destination           | text       | (Nigeria)                      |
| status                | enum       | open, quoted, accepted, closed |
| createdAt / updatedAt | timestamps |                                |

### quotations

| Column                | Type       | Notes                       |
| --------------------- | ---------- | --------------------------- |
| id                    | cuid       | PK                          |
| rfqId                 | fk         | -> rfqs                     |
| supplierId            | fk         | -> suppliers                |
| price                 | decimal    |                             |
| currency              | enum       |                             |
| deliveryEstimate      | text       |                             |
| notes                 | text       |                             |
| status                | enum       | pending, accepted, rejected |
| createdAt / updatedAt | timestamps |                             |

### orders

| Column                | Type       | Notes                  |
| --------------------- | ---------- | ---------------------- |
| id                    | cuid       | PK                     |
| orderNumber           | text       | unique human-readable  |
| buyerId               | fk         | -> users               |
| supplierId            | fk         | -> suppliers           |
| quotationId           | fk         | nullable -> quotations |
| status                | enum       | see lifecycle          |
| totalAmount           | decimal    |                        |
| currency              | enum       |                        |
| shippingAddress       | text       |                        |
| createdAt / updatedAt | timestamps |                        |

### order_items

| Column    | Type    | Notes       |
| --------- | ------- | ----------- |
| id        | cuid    | PK          |
| orderId   | fk      | -> orders   |
| productId | fk      | -> products |
| quantity  | int     |             |
| unitPrice | decimal |             |
| subtotal  | decimal |             |

### escrows

| Column                | Type       | Notes                    |
| --------------------- | ---------- | ------------------------ |
| id                    | cuid       | PK                       |
| orderId               | fk         | unique -> orders         |
| amount                | decimal    |                          |
| currency              | enum       |                          |
| status                | enum       | held, released, refunded |
| releasedAt            | timestamp  |                          |
| createdAt / updatedAt | timestamps |                          |

### payments

| Column                | Type       | Notes                              |
| --------------------- | ---------- | ---------------------------------- |
| id                    | cuid       | PK                                 |
| orderId               | fk         | -> orders                          |
| provider              | enum       | paystack, flutterwave              |
| providerRef           | text       | unique                             |
| amount                | decimal    |                                    |
| currency              | enum       |                                    |
| status                | enum       | pending, success, failed, refunded |
| webhookPayload        | json       |                                    |
| createdAt / updatedAt | timestamps |                                    |

### shipments

| Column                | Type       | Notes                                      |
| --------------------- | ---------- | ------------------------------------------ |
| id                    | cuid       | PK                                         |
| orderId               | fk         | -> orders                                  |
| carrier               | text       |                                            |
| trackingNumber        | text       |                                            |
| status                | enum       | preparing, inTransit, inCustoms, delivered |
| createdAt / updatedAt | timestamps |                                            |

### shipment_events

| Column      | Type      | Notes        |
| ----------- | --------- | ------------ |
| id          | cuid      | PK           |
| shipmentId  | fk        | -> shipments |
| status      | enum      |              |
| description | text      |              |
| location    | text      |              |
| occurredAt  | timestamp |              |

### disputes

| Column                | Type       | Notes                    |
| --------------------- | ---------- | ------------------------ |
| id                    | cuid       | PK                       |
| orderId               | fk         | -> orders                |
| raisedBy              | fk         | -> users                 |
| reason                | text       |                          |
| status                | enum       | open, resolved, rejected |
| resolution            | text       |                          |
| createdAt / updatedAt | timestamps |                          |

### notifications

| Column    | Type      | Notes                            |
| --------- | --------- | -------------------------------- |
| id        | cuid      | PK                               |
| userId    | fk        | -> users                         |
| type      | enum      | order, payment, shipping, system |
| title     | text      |                                  |
| body      | text      |                                  |
| read      | boolean   |                                  |
| createdAt | timestamp |                                  |

---

## 4. Indexes

- `orders(userId)`, `orders(supplierId)`, `orders(status)`.
- `products(categoryId)`, `products(supplierId)`, `products(status)`.
- `payments(providerRef)` unique.
- `quotations(rfqId)`, `quotations(supplierId)`.
- `notifications(userId, read)`.
- `shipment_events(shipmentId, occurredAt)`.

---

## 5. Prisma Model Mapping

Each table above maps to a Prisma model in `prisma/schema.prisma`. Enums map to Prisma enums. Relations map to `@relation` with appropriate `onDelete` behavior (e.g., `ReferentialAction.Cascade` for dependent children).

---

## 6. Data Integrity Notes

- Escrow is 1:1 with Order.
- Order total derived from order_items (validated at creation).
- Payment providerRef unique to prevent double-processing (idempotency).
- Soft delete recommended for products (status) rather than hard delete to preserve order history.
