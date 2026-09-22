# Africhina Connect — Agile Product Backlog

**Version:** 1.0
**Status:** Draft (Sprint 0)

Prioritization: **P0** = must (MVP), **P1** = should, **P2** = could. **Story points** are relative estimates (1–13).

---

## Epic 1 — Authentication & Accounts

| ID    | User Story                                                                            | Priority | Points |
| ----- | ------------------------------------------------------------------------------------- | -------- | ------ |
| US-01 | As a user, I can register with email/password and OAuth so I can access the platform. | P0       | 5      |
| US-02 | As a user, I can log in and log out securely.                                         | P0       | 3      |
| US-03 | As a user, I can reset my password via email link.                                    | P0       | 3      |
| US-04 | As a user, I can manage my profile (name, phone, avatar).                             | P1       | 3      |
| US-05 | As an admin, I can suspend/activate user accounts.                                    | P1       | 3      |

## Epic 2 — Supplier Onboarding & Verification

| ID    | User Story                                                  | Priority | Points |
| ----- | ----------------------------------------------------------- | -------- | ------ |
| US-06 | As a supplier, I can complete an onboarding profile.        | P0       | 5      |
| US-07 | As a supplier, I can upload verification documents.         | P0       | 5      |
| US-08 | As an admin, I can approve or reject supplier verification. | P0       | 3      |
| US-09 | As a supplier, I can view my verification status.           | P1       | 2      |

## Epic 3 — Product Catalog

| ID    | User Story                                                               | Priority | Points |
| ----- | ------------------------------------------------------------------------ | -------- | ------ |
| US-10 | As a supplier, I can create/edit/delete product listings.                | P0       | 8      |
| US-11 | As a buyer, I can search and filter products by category/price/supplier. | P0       | 8      |
| US-12 | As a buyer, I can view rich product details with images.                 | P0       | 3      |
| US-13 | As a supplier, I can upload product images via Cloudinary.               | P1       | 5      |

## Epic 4 — RFQ & Quotations

| ID    | User Story                                                            | Priority | Points |
| ----- | --------------------------------------------------------------------- | -------- | ------ |
| US-14 | As a buyer, I can create an RFQ with product details and destination. | P0       | 5      |
| US-15 | As a supplier, I can respond to an RFQ with a quotation.              | P0       | 5      |
| US-16 | As a buyer, I can accept a quotation to create an order.              | P0       | 3      |

## Epic 5 — Order Management

| ID    | User Story                                                 | Priority | Points |
| ----- | ---------------------------------------------------------- | -------- | ------ |
| US-17 | As a buyer, I can place an order and view its status.      | P0       | 8      |
| US-18 | As a supplier, I can view and manage incoming orders.      | P0       | 5      |
| US-19 | As a user, I can view order history and details.           | P1       | 5      |
| US-20 | As a user, I can cancel an order under allowed conditions. | P1       | 3      |

## Epic 6 — Payments & Escrow

| ID    | User Story                                                      | Priority | Points |
| ----- | --------------------------------------------------------------- | -------- | ------ |
| US-21 | As a buyer, I can pay for an order via Paystack or Flutterwave. | P0       | 8      |
| US-22 | As a user, I can track payment status.                          | P0       | 3      |
| US-23 | As a buyer/supplier, I can request escrow milestone release.    | P0       | 8      |
| US-24 | As an admin, I can process refunds.                             | P1       | 5      |
| US-25 | As a system, I can process payment webhooks idempotently.       | P0       | 5      |

## Epic 7 — Shipping & Customs

| ID    | User Story                                                | Priority | Points |
| ----- | --------------------------------------------------------- | -------- | ------ |
| US-26 | As a logistics partner, I can update shipment milestones. | P0       | 5      |
| US-27 | As a buyer, I can track shipping & customs status.        | P1       | 5      |
| US-28 | As a logistics partner, I can upload shipping documents.  | P1       | 3      |

## Epic 8 — Notifications

| ID    | User Story                                              | Priority | Points |
| ----- | ------------------------------------------------------- | -------- | ------ |
| US-29 | As a user, I receive email notifications on key events. | P1       | 5      |
| US-30 | As a user, I have an in-app notification feed.          | P1       | 5      |

## Epic 9 — Disputes

| ID    | User Story                                              | Priority | Points |
| ----- | ------------------------------------------------------- | -------- | ------ |
| US-31 | As a buyer/supplier, I can raise a dispute on an order. | P1       | 5      |
| US-32 | As an admin, I can review and resolve disputes.         | P1       | 5      |

## Epic 10 — Admin Dashboard

| ID    | User Story                                           | Priority | Points |
| ----- | ---------------------------------------------------- | -------- | ------ |
| US-33 | As an admin, I can view platform KPIs and analytics. | P1       | 8      |
| US-34 | As an admin, I can moderate suppliers and products.  | P1       | 5      |

## Epic 11 — Reviews & Ratings (Deferred)

| ID    | User Story                                            | Priority | Points |
| ----- | ----------------------------------------------------- | -------- | ------ |
| US-35 | As a buyer, I can rate and review suppliers/products. | P2       | 5      |

---

## Backlog Summary

- **Total stories:** 35
- **P0 (MVP):** 18
- **P1:** 15
- **P2:** 2
- **Total points:** ~ 168

---

## Definition of Ready (DoR)

- Story has clear acceptance criteria.
- Dependencies identified.
- UI/API design agreed.
- Estimable (can be broken down).

## Definition of Done (DoD)

- Code written in JS, follows coding standards.
- Lint & tests pass.
- Prisma migrations applied.
- API role guards tested.
- Reviewed and merged via PR.
- Documented (if needed).
