# Africhina Connect — API Contract

**Version:** 1.0
**Status:** Definitive (Sprint 0.5 — Final Planning Task)
**Author:** Lead Backend Architect / API Designer
**Audience:** Frontend Developers, Backend Developers, Testers, DevOps Engineers, AI Coding Assistants

> **This document is the single source of truth between frontend and backend developers.**

**Base URL:** `/api/v1`
**Format:** REST + JSON
**Content-Type:** `application/json`
**Auth:** Session cookie (Better Auth) or Bearer token (JWT). All writable endpoints require CSRF protection.

---

## Standard Response Format

Every endpoint returns one envelope:

```json
{
  "success": true,
  "message": "OK",
  "data": {},
  "meta": {}
}
```

- `success`: boolean — `true` on 2xx, `false` on 4xx/5xx.
- `message`: human-readable string.
- `data`: payload (object or array). `null` on error.
- `meta`: pagination/sorting/context (optional).

**List responses** include pagination in `meta`:

```json
{
  "success": true,
  "message": "OK",
  "data": [],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 120,
    "totalPages": 6,
    "hasNextPage": true,
    "hasPrevPage": false
  }
}
```

---

## Standard Error Format

Every error returns one object:

```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": [{ "field": "email", "message": "Email is invalid" }]
  }
}
```

- `error.code`: machine-readable code.
- `error.details`: optional field-level errors.

**Common error codes:**

| Code               | Meaning                              |
| ------------------ | ------------------------------------ |
| `VALIDATION_ERROR` | Request body failed validation (422) |
| `UNAUTHORIZED`     | Not authenticated (401)              |
| `FORBIDDEN`        | Authenticated but not allowed (403)  |
| `NOT_FOUND`        | Resource not found (404)             |
| `CONFLICT`         | Duplicate/state conflict (409)       |
| `RATE_LIMITED`     | Too many requests (429)              |
| `PAYMENT_REQUIRED` | Payment needed (402)                 |
| `INTERNAL_ERROR`   | Server error (500)                   |

---

## Pagination Standard

- Query params: `?page=1&limit=20`.
- `page` starts at 1; `limit` default 20, max 100.
- Response pagination in `meta` (see above).
- Use **cursor-based** pagination for large/time-ordered lists (payments, notifications) via `?cursor=<id>&limit=20`; response `meta.nextCursor`.

---

## Filtering Standard

- Query param `filters` as URL-encoded JSON, or structured params.
- Structured form: `?status=paid&currency=NGN`.
- Operators in `filters` JSON: `eq`, `neq`, `gt`, `gte`, `lt`, `lte`, `in`, `contains`.
- Example: `filters={"status":{"eq":"paid"},"amount":{"gte":1000}}`.

---

## Sorting Standard

- Query param `sort=<field>:<asc|desc>`.
- Multiple: comma-separated `sort=createdAt:desc,amount:desc`.
- Whitelist allowed fields per endpoint to prevent injection.
- Default sort: `createdAt:desc`.

---

## Search Standard

- Query param `q=<term>` for full-text search.
- Applies to searchable fields (e.g., product title/description, order number).
- Combined with filtering/sorting.
- Example: `GET /api/v1/products?q=phone&status=active&sort=price:asc`.

---

## Rate Limiting

- **Auth endpoints:** 10 req/min per IP (register, login, reset).
- **General API:** 100 req/min per user.
- **Payment init:** 20 req/min per user.
- **Search:** 60 req/min per user.
- Return `429` with code `RATE_LIMITED` and `Retry-After` header when exceeded.

---

## Versioning Strategy

- All routes prefixed `/api/v1/`.
- Backward-compatible additive changes within `v1`.
- Breaking changes → new `/api/v2/`; keep `v1` running until migration.
- Deprecation headers: `Deprecation: true`, `Sunset: <date>`.

---

## Roles & Access Mapping

| Role code   | Description         |
| ----------- | ------------------- |
| `guest`     | Unauthenticated     |
| `buyer`     | Customer / Importer |
| `supplier`  | Supplier            |
| `admin`     | Administrator       |
| `logistics` | Logistics Officer   |
| `support`   | Support Staff       |

---

## AUTHENTICATION

### Register

- **Endpoint:** `POST /api/v1/auth/register`
- **Method:** POST
- **Purpose:** Create a new account.
- **Auth:** No
- **Roles:** guest
- **Request Body:**

```json
{
  "name": "Ada Obi",
  "email": "ada@example.com",
  "password": "secret123",
  "role": "buyer"
}
```

- **Validation:** name required; email valid+unique; password min 8 chars; role in [buyer, supplier].
- **Response:** 201 — user object + verification required.
- **Errors:** 409 (email exists), 422 (validation).
- **Notes:** Sends verification email via Resend.

### Login

- **Endpoint:** `POST /api/v1/auth/login`
- **Method:** POST
- **Purpose:** Authenticate and start a session.
- **Auth:** No
- **Roles:** guest
- **Request Body:** `{ "email": "...", "password": "..." }`
- **Validation:** valid email, required password.
- **Response:** 200 — `{ user, accessToken, refreshToken }` (or session cookie).
- **Errors:** 401 (invalid credentials), 403 (suspended).

### Logout

- **Endpoint:** `POST /api/v1/auth/logout`
- **Method:** POST
- **Purpose:** Invalidate session.
- **Auth:** Yes
- **Roles:** all authenticated
- **Response:** 200.
- **Notes:** Revokes refresh token.

### Refresh Token

- **Endpoint:** `POST /api/v1/auth/refresh`
- **Method:** POST
- **Purpose:** Obtain new access token.
- **Auth:** Refresh token
- **Request Body:** `{ "refreshToken": "..." }`
- **Response:** 200 — new access token.
- **Errors:** 401 (expired/invalid).

### Forgot Password

- **Endpoint:** `POST /api/v1/auth/forgot-password`
- **Method:** POST
- **Purpose:** Send reset link.
- **Auth:** No
- **Request Body:** `{ "email": "..." }`
- **Response:** 200 (always, to avoid enumeration).
- **Notes:** Rate-limited.

### Reset Password

- **Endpoint:** `POST /api/v1/auth/reset-password`
- **Method:** POST
- **Purpose:** Set new password with token.
- **Auth:** No
- **Request Body:** `{ "token": "...", "password": "..." }`
- **Validation:** token required, password min 8.
- **Response:** 200.
- **Errors:** 400 (invalid/expired token).

### Verify Email

- **Endpoint:** `POST /api/v1/auth/verify-email`
- **Method:** POST
- **Purpose:** Confirm email with token.
- **Auth:** No
- **Request Body:** `{ "token": "..." }`
- **Response:** 200.
- **Errors:** 400 (invalid/expired).

### Get Current User

- **Endpoint:** `GET /api/v1/auth/me`
- **Method:** GET
- **Purpose:** Return logged-in user.
- **Auth:** Yes
- **Roles:** all authenticated
- **Response:** 200 — user object.
- **Errors:** 401.

---

## PRODUCTS

### List Products

- **Endpoint:** `GET /api/v1/products`
- **Method:** GET
- **Purpose:** List active products.
- **Auth:** No
- **Roles:** guest, all
- **Response:** 200 — array of products + pagination.
- **Notes:** Only `status=active` for guests.

### Search Products

- **Endpoint:** `GET /api/v1/products?q=term`
- **Purpose:** Full-text search.
- **Auth:** No
- **Response:** 200 — matching products.
- **Errors:** 400 (invalid query).

### Filter Products

- **Endpoint:** `GET /api/v1/products?filters=...&categoryId=...`
- **Purpose:** Filter by category/price/status/supplier.
- **Auth:** No
- **Response:** 200 — filtered products.
- **Errors:** 400 (invalid filter).

### Product Details

- **Endpoint:** `GET /api/v1/products/:id`
- **Method:** GET
- **Purpose:** Single product with images & supplier.
- **Auth:** No
- **Response:** 200 — product object.
- **Errors:** 404.

### Categories

- **Endpoint:** `GET /api/v1/categories`
- **Method:** GET
- **Purpose:** List categories.
- **Auth:** No
- **Response:** 200 — category tree.

---

## RFQs

### Create RFQ

- **Endpoint:** `POST /api/v1/rfqs`
- **Method:** POST
- **Purpose:** Create a request for quotation.
- **Auth:** Yes
- **Roles:** buyer, agent, admin
- **Request Body:**

```json
{
  "title": "LED bulbs",
  "description": "5000 pcs",
  "items": [{ "productId": "p1", "quantity": 5000 }],
  "destination": "Lagos, Nigeria"
}
```

- **Validation:** title required; items non-empty; positive quantity; destination required.
- **Response:** 201 — RFQ object.
- **Errors:** 422, 401.

### List RFQs

- **Endpoint:** `GET /api/v1/rfqs`
- **Method:** GET
- **Purpose:** List own RFQs.
- **Auth:** Yes
- **Roles:** buyer, agent, admin
- **Response:** 200 — array + pagination.
- **Notes:** Scoped to owner (admin sees all).

### View RFQ

- **Endpoint:** `GET /api/v1/rfqs/:id`
- **Method:** GET
- **Purpose:** RFQ detail + quotations.
- **Auth:** Yes
- **Roles:** buyer, agent, admin
- **Response:** 200 — RFQ with quotations.
- **Errors:** 404, 403.

### Cancel RFQ

- **Endpoint:** `POST /api/v1/rfqs/:id/cancel`
- **Purpose:** Cancel an open RFQ.
- **Auth:** Yes
- **Roles:** buyer, agent, admin
- **Response:** 200.
- **Errors:** 409 (not cancellable state).

### Approve RFQ

- **Endpoint:** `POST /api/v1/rfqs/:id/approve`
- **Purpose:** Admin approves an RFQ for quoting.
- **Auth:** Yes
- **Roles:** admin
- **Response:** 200.
- **Notes:** Moves RFQ to `open`.

### Reject RFQ

- **Endpoint:** `POST /api/v1/rfqs/:id/reject`
- **Purpose:** Admin rejects an RFQ.
- **Auth:** Yes
- **Roles:** admin
- **Request Body:** optional `{ "reason": "..." }`
- **Response:** 200.

### Generate Quotation

- **Endpoint:** `POST /api/v1/rfqs/:id/quotations`
- **Method:** POST
- **Purpose:** Supplier/admin submits a quotation.
- **Auth:** Yes
- **Roles:** supplier, admin
- **Request Body:**

```json
{
  "supplierId": "s1",
  "price": 250000,
  "currency": "NGN",
  "deliveryEstimate": "30 days",
  "notes": "..."
}
```

- **Validation:** price positive; currency required; deliveryEstimate required.
- **Response:** 201 — quotation.
- **Errors:** 422, 403.

### Accept Quote

- **Endpoint:** `POST /api/v1/quotations/:id/accept`
- **Method:** POST
- **Purpose:** Buyer accepts a quotation → create order flow.
- **Auth:** Yes
- **Roles:** buyer, agent, admin
- **Response:** 200 — accepted quotation + order link.
- **Errors:** 409 (quote expired), 403.

### Reject Quote

- **Endpoint:** `POST /api/v1/quotations/:id/reject`
- **Method:** POST
- **Purpose:** Buyer rejects a quotation.
- **Auth:** Yes
- **Roles:** buyer, agent, admin
- **Response:** 200.

---

## ORDERS

### Create Order

- **Endpoint:** `POST /api/v1/orders`
- **Method:** POST
- **Purpose:** Create an order from an accepted quotation.
- **Auth:** Yes
- **Roles:** buyer, agent, admin
- **Request Body:** `{ "quotationId": "q1", "shippingAddressId": "a1" }`
- **Validation:** quotationId required; shipping address required.
- **Response:** 201 — order object.
- **Errors:** 422, 409 (no active quotation).

### List Orders

- **Endpoint:** `GET /api/v1/orders`
- **Method:** GET
- **Purpose:** List orders (own or all for admin).
- **Auth:** Yes
- **Roles:** buyer, supplier, agent, admin, logistics
- **Response:** 200 — array + pagination.
- **Notes:** Role-scoped.

### Order Details

- **Endpoint:** `GET /api/v1/orders/:id`
- **Method:** GET
- **Purpose:** Full order detail.
- **Auth:** Yes
- **Roles:** buyer, supplier, agent, admin
- **Response:** 200 — order with items, payment, shipment.
- **Errors:** 404, 403.

### Cancel Order

- **Endpoint:** `POST /api/v1/orders/:id/cancel`
- **Method:** POST
- **Purpose:** Cancel an eligible order.
- **Auth:** Yes
- **Roles:** buyer, admin
- **Request Body:** `{ "reason": "..." }`
- **Response:** 200.
- **Errors:** 409 (status not cancellable).

---

## PAYMENTS

### Initialize Payment

- **Endpoint:** `POST /api/v1/payments/initialize`
- **Method:** POST
- **Purpose:** Start a Paystack/Flutterwave payment.
- **Auth:** Yes
- **Roles:** buyer, agent, admin
- **Request Body:**

```json
{
  "orderId": "o1",
  "provider": "paystack",
  "amount": 250000,
  "currency": "NGN",
  "idempotencyKey": "uuid"
}
```

- **Validation:** orderId required; provider in [paystack, flutterwave]; idempotencyKey required.
- **Response:** 200 — `{ reference, authorizationUrl }`.
- **Errors:** 422, 409 (duplicate idempotency key).

### Verify Payment

- **Endpoint:** `GET /api/v1/payments/:reference/verify`
- **Method:** GET
- **Purpose:** Confirm payment status.
- **Auth:** Yes
- **Roles:** buyer, agent, admin
- **Response:** 200 — payment status.
- **Errors:** 404.

### Payment History

- **Endpoint:** `GET /api/v1/payments`
- **Method:** GET
- **Purpose:** List an order/user's payments.
- **Auth:** Yes
- **Roles:** buyer, supplier, agent, admin
- **Response:** 200 — array + pagination.

### Invoices

- **Endpoint:** `GET /api/v1/invoices/:orderId`
- **Method:** GET
- **Purpose:** Fetch invoice for an order.
- **Auth:** Yes
- **Roles:** buyer, supplier, admin
- **Response:** 200 — invoice object.

---

## SHIPMENTS

### Shipment Details

- **Endpoint:** `GET /api/v1/shipments/:id`
- **Method:** GET
- **Purpose:** Shipment detail.
- **Auth:** Yes
- **Roles:** buyer, supplier, logistics, admin
- **Response:** 200 — shipment object.
- **Errors:** 404, 403.

### Shipment Timeline

- **Endpoint:** `GET /api/v1/shipments/:id/timeline`
- **Method:** GET
- **Purpose:** Ordered shipment events.
- **Auth:** Yes
- **Roles:** buyer, supplier, logistics, admin
- **Response:** 200 — array of events.

### Update Shipment

- **Endpoint:** `POST /api/v1/shipments/:id/events`
- **Method:** POST
- **Purpose:** Add a shipment status event.
- **Auth:** Yes
- **Roles:** logistics, admin
- **Request Body:** `{ "status": "in_transit", "location": "...", "description": "..." }`
- **Validation:** valid status transition.
- **Response:** 201 — event.
- **Errors:** 422, 409 (invalid transition).

### Upload Shipping Documents

- **Endpoint:** `POST /api/v1/shipments/:id/documents`
- **Method:** POST
- **Purpose:** Attach a shipping document.
- **Auth:** Yes
- **Roles:** logistics, supplier, admin
- **Request Body:** multipart `{ "file":..., "type": "bill_of_lading" }`
- **Validation:** allowed file type/size.
- **Response:** 201 — document.
- **Errors:** 422, 413 (too large).

---

## NOTIFICATIONS

### List Notifications

- **Endpoint:** `GET /api/v1/notifications`
- **Method:** GET
- **Purpose:** List own notifications.
- **Auth:** Yes
- **Roles:** all authenticated
- **Response:** 200 — array + pagination.

### Mark Read

- **Endpoint:** `PUT /api/v1/notifications/:id/read`
- **Method:** PUT
- **Purpose:** Mark one notification read.
- **Auth:** Yes
- **Roles:** all authenticated
- **Response:** 200.

### Delete Notification

- **Endpoint:** `DELETE /api/v1/notifications/:id`
- **Method:** DELETE
- **Purpose:** Remove a notification.
- **Auth:** Yes
- **Roles:** all authenticated
- **Response:** 204.
- **Errors:** 404.

---

## SUPPORT

### Create Ticket

- **Endpoint:** `POST /api/v1/support/tickets`
- **Method:** POST
- **Purpose:** Open a support ticket.
- **Auth:** Yes
- **Roles:** buyer, supplier, agent, admin
- **Request Body:**

```json
{
  "category": "order",
  "priority": "medium",
  "subject": "...",
  "description": "...",
  "orderId": "o1"
}
```

- **Validation:** category required; description min 10 chars.
- **Response:** 201 — ticket.
- **Errors:** 422.

### Reply Ticket

- **Endpoint:** `POST /api/v1/support/tickets/:id/replies`
- **Method:** POST
- **Purpose:** Add a reply to a ticket.
- **Auth:** Yes
- **Roles:** buyer, support, admin
- **Request Body:** `{ "body": "..." }`
- **Validation:** body required.
- **Response:** 201 — reply.

### Close Ticket

- **Endpoint:** `POST /api/v1/support/tickets/:id/close`
- **Method:** POST
- **Purpose:** Mark a ticket resolved/closed.
- **Auth:** Yes
- **Roles:** support, admin
- **Response:** 200.

---

## ADMIN

### Dashboard Stats

- **Endpoint:** `GET /api/v1/admin/stats`
- **Method:** GET
- **Purpose:** Platform KPIs.
- **Auth:** Yes
- **Roles:** admin
- **Response:** 200 — metrics object.
- **Errors:** 403.

### Manage Products

- **Endpoint:** `GET/POST /api/v1/admin/products`, `PUT/DELETE /api/v1/admin/products/:id`
- **Purpose:** CRUD & moderation of products.
- **Auth:** Yes
- **Roles:** admin
- **Response:** 2xx accordingly.

### Manage Categories

- **Endpoint:** `GET/POST /api/v1/admin/categories`, `PUT/DELETE /api/v1/admin/categories/:id`
- **Purpose:** CRUD categories.
- **Auth:** Yes
- **Roles:** admin
- **Response:** 2xx accordingly.

### Manage Users

- **Endpoint:** `GET /api/v1/admin/users`, `PUT /api/v1/admin/users/:id/status`
- **Purpose:** List & manage users.
- **Auth:** Yes
- **Roles:** admin
- **Response:** 200; 403.

### Manage Orders

- **Endpoint:** `GET /api/v1/admin/orders`, `PUT /api/v1/admin/orders/:id/status`
- **Purpose:** Oversee & update orders.
- **Auth:** Yes
- **Roles:** admin
- **Response:** 200.

### Reports

- **Endpoint:** `GET /api/v1/admin/reports`
- **Method:** GET
- **Purpose:** Generate platform reports.
- **Auth:** Yes
- **Roles:** admin
- **Query:** `?type=sales&from=...&to=...`
- **Response:** 200 — report data.

---

## File Upload Standard (Cloudinary)

- **Endpoint:** `POST /api/v1/uploads` (or direct signed upload).
- Flow: client requests a signed upload URL → uploads to Cloudinary → stores returned URL/metadata.
- Validate file type (images: jpg/png/webp; docs: pdf) and max size (images 5MB, docs 20MB).
- Persist `{ url, publicId, format, size }` in the `Attachment` entity.
- Never trust client URLs; verify Cloudinary signature.

---

## Webhook Standards

### Paystack

- **Endpoint:** `POST /api/v1/webhooks/paystack`
- **Purpose:** Receive payment events.
- **Security:** Verify signature header `x-paystack-signature` with secret key.
- **Events:** `charge.success`, `charge.failed`, `refund.processed`.
- **Response:** Always `200` (with `{ "status": true }`) to acknowledge; process async.
- **Idempotency:** dedupe by `event.id` / payment reference.

### Flutterwave

- **Endpoint:** `POST /api/v1/webhooks/flutterwave`
- **Purpose:** Receive payment events.
- **Security:** Verify `verif-hash` header against secret hash.
- **Events:** `charge.completed`, `charge.failed`, `refund.completed`.
- **Response:** Always `200`; process async.
- **Idempotency:** dedupe by event id.

---

## Idempotency Rules

- **Payments:** require `idempotencyKey` on initialize; reject duplicate keys with `409`.
- **Webhooks:** dedupe by `event.id` / `providerRef` (unique DB constraint).
- **Orders:** idempotency key on order creation prevents duplicate orders.
- Store keys in a `idempotency`/payment record with unique constraint.
- Returns same response for a repeated key (replay-safe).

---

## Security

### Authentication

- Session cookies: `httpOnly`, `secure`, `sameSite=lax/strict`.
- Short-lived access tokens + refresh tokens.
- Logout revokes tokens.

### Authorization

- RBAC enforced server-side on every route; check role + resource ownership.
- Never trust client role/state.

### Validation

- Zod schemas on all request bodies/query params.
- Return `422 VALIDATION_ERROR` with field details.

### Input Sanitization

- Trim strings; validate types; whitelist allowed values.
- Normalize email/phone.

### SQL Injection

- Use Prisma ORM (parameterized queries). Never string-concatenate SQL.

### CSRF

- Verify CSRF token for state-changing requests; same-site cookies; custom headers.

### XSS

- Escape all output; use React auto-escaping; validate/sanitize HTML; `Content-Security-Policy` headers.

---

## API Implementation Priority (Sprints 1–6)

### Sprint 1 — Auth & Accounts

1. `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`
2. `POST /auth/refresh`, `GET /auth/me`
3. `POST /auth/forgot-password`, `POST /auth/reset-password`, `POST /auth/verify-email`
4. Role guards & session helpers.

### Sprint 2 — Catalogue

5. `GET /categories`
6. `GET /products`, `GET /products/:id`, `GET /products?q=&filters=&sort=`
7. Admin product/category CRUD.

### Sprint 3 — RFQ & Orders

8. `POST /rfqs`, `GET /rfqs`, `GET /rfqs/:id`
9. `POST /rfqs/:id/quotations`, `POST /quotations/:id/accept`, `POST /quotations/:id/reject`
10. `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /orders/:id/cancel`

### Sprint 4 — Payments & Escrow

11. `POST /payments/initialize`, `GET /payments/:ref/verify`, `GET /payments`
12. `GET /invoices/:orderId`
13. Paystack & Flutterwave webhooks.
14. Idempotency + escrow release.

### Sprint 5 — Shipping, Notifications, Admin & Support

15. `POST /shipments/:id/events`, `GET /shipments/:id`, `GET /shipments/:id/timeline`, upload documents.
16. `GET/PUT/DELETE /notifications`, mark read.
17. Admin: `GET /admin/stats`, manage users/orders/products/categories.
18. Support: create/reply/close tickets.
19. `GET /admin/reports`.

### Sprint 6 — Hardening

20. Rate limiting, CSRF, security headers.
21. Full error-mapping, pagination/cursor, search/filter/sort polish.
22. E2E API tests & UAT.

---

_End of API Contract — Sprint 0.5._
