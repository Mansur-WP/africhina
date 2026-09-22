# Africhina Connect — Software Requirements Specification (SRS)

**Version:** 1.0
**Status:** Draft (Sprint 0)

---

## 1. Introduction

### 1.1 Purpose

This document specifies the software requirements for Africhina Connect, a China-to-Nigeria sourcing and import management platform. It details functional and non-functional requirements used to guide design, development, and testing.

### 1.2 Scope

The system is a web application (responsive) built with Next.js App Router (JavaScript), React, Tailwind CSS, shadcn/ui, PostgreSQL, Prisma ORM, Better Auth, Cloudinary, Paystack, Flutterwave, and Resend, deployed on Vercel.

### 1.3 Definitions

- **Buyer/Importer:** Nigerian user sourcing goods.
- **Supplier:** Verified Chinese seller.
- **RFQ:** Request for Quotation.
- **Escrow:** Milestone-based fund-holding.
- **Milestone:** A stage in order lifecycle.

---

## 2. Overall Description

### 2.1 Product Perspective

Africhina Connect is a new system. It integrates with external services:

- **Paystack** — NGN payment processing.
- **Flutterwave** — additional payment/collection rails.
- **Cloudinary** — media storage & optimization.
- **Resend** — transactional email.
- **Better Auth** — authentication/sessions.
- **Vercel Postgres (Neon)** — database.

### 2.2 User Characteristics

Admins, importers/buyers, suppliers, logistics partners, and configurator agents. Varying technical proficiency.

### 2.3 Operating Environment

- Modern evergreen browsers (Chrome, Edge, Firefox, Safari).
- Server runtime: Node.js 20+ on Vercel.
- Database: PostgreSQL 15+.

---

## 3. Functional Requirements

### 3.1 Authentication & Authorization (FR-AUTH)

| ID         | Requirement                                                |
| ---------- | ---------------------------------------------------------- |
| FR-AUTH-01 | Users can register with email/password and OAuth (Google). |
| FR-AUTH-02 | Users can log in/log out; sessions managed by Better Auth. |
| FR-AUTH-03 | Roles enforced: buyer, supplier, admin, logistics, agent.  |
| FR-AUTH-04 | Password reset via email link (Resend).                    |
| FR-AUTH-05 | Admin can suspend/activate accounts.                       |

### 3.2 Supplier Management (FR-SUP)

| ID        | Requirement                                                           |
| --------- | --------------------------------------------------------------------- |
| FR-SUP-01 | Supplier can complete onboarding profile.                             |
| FR-SUP-02 | Supplier submits verification documents (identity, business license). |
| FR-SUP-03 | Admin reviews & approves/rejects supplier verification.               |
| FR-SUP-04 | Supplier can manage product listings (CRUD).                          |

### 3.3 Product Catalog (FR-PROD)

| ID         | Requirement                                                                            |
| ---------- | -------------------------------------------------------------------------------------- |
| FR-PROD-01 | Products have title, description, images (Cloudinary), price, currency, category, MOQ. |
| FR-PROD-02 | Buyers can search & filter by category, price, supplier.                               |
| FR-PROD-03 | Product detail view with images & specs.                                               |

### 3.4 RFQ & Quotation (FR-RFQ)

| ID        | Requirement                                                    |
| --------- | -------------------------------------------------------------- |
| FR-RFQ-01 | Buyer creates RFQ with product details, quantity, destination. |
| FR-RFQ-02 | Suppliers respond with quotations (price, delivery estimate).  |
| FR-RFQ-03 | Buyer accepts a quotation to create an order.                  |

### 3.5 Order Management (FR-ORD)

| ID        | Requirement                                                 |
| --------- | ----------------------------------------------------------- |
| FR-ORD-01 | Orders capture buyer, supplier, products, totals, currency. |
| FR-ORD-02 | Order status lifecycle tracked (see section 5).             |
| FR-ORD-03 | Buyers & suppliers can view order details & history.        |
| FR-ORD-04 | Admin can mediate disputes.                                 |

### 3.6 Payments & Escrow (FR-PAY)

| ID        | Requirement                                       |
| --------- | ------------------------------------------------- |
| FR-PAY-01 | Buyer can pay via Paystack or Flutterwave in NGN. |
| FR-PAY-02 | Funds held in escrow until milestone release.     |
| FR-PAY-03 | Admin/supplier can request milestone release.     |
| FR-PAY-04 | Payment status & transaction references recorded. |
| FR-PAY-05 | Refunds supported via payment provider.           |

### 3.7 Shipping & Customs (FR-LOG)

| ID        | Requirement                                             |
| --------- | ------------------------------------------------------- |
| FR-LOG-01 | Logistics partner updates shipment milestones.          |
| FR-LOG-02 | Order tracks shipping & customs status in real time.    |
| FR-LOG-03 | Document uploads (invoice, packing list, B/L, customs). |

### 3.8 Notifications (FR-NOTIF)

| ID          | Requirement                                     |
| ----------- | ----------------------------------------------- |
| FR-NOTIF-01 | Email notifications on key events (via Resend). |
| FR-NOTIF-02 | In-app notification feed.                       |

### 3.9 Admin Dashboard (FR-ADMIN)

| ID          | Requirement                           |
| ----------- | ------------------------------------- |
| FR-ADMIN-01 | Moderate suppliers & products.        |
| FR-ADMIN-02 | View platform KPIs & order analytics. |
| FR-ADMIN-03 | Manage disputes & escrow releases.    |

---

## 4. Non-Functional Requirements

| Category        | Requirement                                                                                                     |
| --------------- | --------------------------------------------------------------------------------------------------------------- |
| Performance     | Page load < 2s (p95); API p95 < 300ms.                                                                          |
| Security        | HTTPS, bcrypt/argon password hashing, CSRF protection, rate limiting, input sanitization, least-privilege RBAC. |
| Data            | PostgreSQL; indexes on hot queries; backups.                                                                    |
| Reliability     | Idempotent payment webhooks; graceful degradation.                                                              |
| Scalability     | Horizontal scaling on Vercel; connection pooling.                                                               |
| Maintainability | Clean Architecture layering; modular components; linted & tested.                                               |
| Accessibility   | WCAG 2.1 AA.                                                                                                    |
| Compliance      | GDPR/NDPR awareness; secure handling of financial & personal data.                                              |

---

## 5. Order Status Lifecycle

```
DRAFT → PENDING_PAYMENT → PAID (ESCROW) → IN_PRODUCTION
      → READY_TO_SHIP → SHIPPED → IN_CUSTOMS → DELIVERED
      → COMPLETED
```

Branches: `CANCELLED`, `REFUNDED`, `DISPUTED` (from any active state).

---

## 6. External Interface Requirements

| Interface       | Purpose                                   |
| --------------- | ----------------------------------------- |
| Paystack API    | Initialize/verify NGN payments, webhooks. |
| Flutterwave API | Secondary payment/collection, webhooks.   |
| Cloudinary API  | Upload/deliver product & document images. |
| Resend API      | Transactional email delivery.             |
| Better Auth     | Auth flows & session management.          |

---

## 7. Acceptance Criteria (High-Level)

- Buyer can register, create RFQ, receive quotations, place order, and pay via Paystack/Flutterwave.
- Escrow holds funds and releases on milestone completion.
- Supplier can register, get verified, and manage products & orders.
- Admin can moderate suppliers/products and view analytics.
- Notifications are sent on order & payment events.
