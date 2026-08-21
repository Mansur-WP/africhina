# Africhina Connect — API Structure

**Version:** 1.0
**Status:** Draft (Sprint 0)

---

## 1. Conventions

- **RESTful** JSON API over Next.js Route Handlers in `app/api/**`.
- Base path: `/api`.
- Consistent response envelope:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

Error shape:

```json
{
  "success": false,
  "data": null,
  "error": { "code": "VALIDATION_ERROR", "message": "..." }
}
```

- Standard HTTP status codes: 200, 201, 400, 401, 403, 404, 409, 422, 500.
- Pagination: `?page=1&limit=20`, response includes `{ data, pagination: { page, limit, total, totalPages } }`.
- Auth: session cookie via Better Auth; role-based guards on protected routes.
- Validation: Zod schemas per endpoint.

---

## 2. Authentication

| Method | Endpoint                  | Description     | Roles |
| ------ | ------------------------- | --------------- | ----- |
| POST   | /api/auth/signup          | Register        | guest |
| POST   | /api/auth/signin          | Login           | guest |
| POST   | /api/auth/signout         | Logout          | all   |
| POST   | /api/auth/forgot-password | Send reset link | guest |
| POST   | /api/auth/reset-password  | Reset password  | guest |
| GET    | /api/auth/session         | Current session | all   |

_(Auth may also use Better Auth's built-in endpoints under `/api/auth/*`.)_

---

## 3. Supplier & Verification

| Method | Endpoint                              | Description               | Roles    |
| ------ | ------------------------------------- | ------------------------- | -------- |
| POST   | /api/suppliers/onboard                | Start onboarding          | supplier |
| GET    | /api/suppliers/me                     | Own supplier profile      | supplier |
| PUT    | /api/suppliers/me                     | Update own profile        | supplier |
| POST   | /api/suppliers/:id/documents          | Upload verification doc   | supplier |
| GET    | /api/suppliers                        | List suppliers (verified) | all      |
| GET    | /api/suppliers/:id                    | Supplier detail           | all      |
| PUT    | /api/admin/suppliers/:id/verification | Approve/reject            | admin    |

---

## 4. Categories & Products

| Method | Endpoint                 | Description          | Roles                |
| ------ | ------------------------ | -------------------- | -------------------- |
| GET    | /api/categories          | List categories      | all                  |
| GET    | /api/products            | Search/list products | all                  |
| GET    | /api/products/:id        | Product detail       | all                  |
| POST   | /api/products            | Create product       | supplier, admin      |
| PUT    | /api/products/:id        | Update product       | supplier(own), admin |
| DELETE | /api/products/:id        | Deactivate product   | supplier(own), admin |
| POST   | /api/products/:id/images | Add product image    | supplier(own), admin |

---

## 5. RFQ & Quotations

| Method | Endpoint                   | Description            | Roles               |
| ------ | -------------------------- | ---------------------- | ------------------- |
| POST   | /api/rfqs                  | Create RFQ             | buyer, agent        |
| GET    | /api/rfqs                  | List own RFQs          | buyer, agent        |
| GET    | /api/rfqs/:id              | RFQ detail             | buyer, agent, admin |
| POST   | /api/rfqs/:id/quotations   | Respond with quotation | supplier            |
| PUT    | /api/quotations/:id/accept | Accept quotation       | buyer, agent        |

---

## 6. Orders

| Method | Endpoint               | Description                 | Roles                         |
| ------ | ---------------------- | --------------------------- | ----------------------------- |
| POST   | /api/orders            | Create order from quotation | buyer, agent                  |
| GET    | /api/orders            | List own orders             | buyer, supplier, agent, admin |
| GET    | /api/orders/:id        | Order detail                | buyer, supplier, agent, admin |
| PUT    | /api/orders/:id/status | Advance/update status       | admin, supplier               |
| POST   | /api/orders/:id/cancel | Cancel order                | buyer, admin                  |

---

## 7. Payments & Escrow

| Method | Endpoint                      | Description               | Roles                  |
| ------ | ----------------------------- | ------------------------- | ---------------------- |
| POST   | /api/payments/initialize      | Initiate provider payment | buyer, agent, admin    |
| GET    | /api/payments/:ref/verify     | Verify payment            | buyer, agent, admin    |
| POST   | /api/escrows/:orderId/release | Request/release escrow    | buyer, supplier, admin |
| POST   | /api/escrows/:orderId/refund  | Refund                    | admin                  |
| POST   | /api/webhooks/paystack        | Paystack webhook          | provider               |
| POST   | /api/webhooks/flutterwave     | Flutterwave webhook       | provider               |

---

## 8. Shipping & Customs

| Method | Endpoint                     | Description            | Roles                         |
| ------ | ---------------------------- | ---------------------- | ----------------------------- |
| POST   | /api/orders/:id/shipments    | Create/create shipment | logistics, admin              |
| POST   | /api/shipments/:id/events    | Add milestone event    | logistics, admin              |
| GET    | /api/orders/:id/shipment     | Get shipment tracking  | buyer, supplier, agent, admin |
| POST   | /api/shipments/:id/documents | Upload shipping doc    | logistics, supplier, admin    |

---

## 9. Disputes

| Method | Endpoint                 | Description    | Roles                  |
| ------ | ------------------------ | -------------- | ---------------------- |
| POST   | /api/orders/:id/disputes | Raise dispute  | buyer, supplier, agent |
| GET    | /api/disputes            | List disputes  | admin                  |
| PUT    | /api/disputes/:id        | Resolve/reject | admin                  |

---

## 10. Notifications & Admin

| Method | Endpoint                    | Description            | Roles |
| ------ | --------------------------- | ---------------------- | ----- |
| GET    | /api/notifications          | List own notifications | all   |
| PUT    | /api/notifications/:id/read | Mark read              | all   |
| GET    | /api/admin/analytics        | Platform KPIs          | admin |
| GET    | /api/admin/users            | List users             | admin |
| PUT    | /api/admin/users/:id/status | Suspend/activate       | admin |

---

## 11. Webhook & Security Notes

- All webhooks verify provider signatures before processing.
- Payment webhooks are idempotent (keyed by providerRef).
- Sensitive endpoints enforce role guards + ownership scoping.
- Rate limiting applied to auth and payment routes.
