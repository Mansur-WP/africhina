# Africhina Connect — System Architecture

**Version:** 1.0
**Status:** Draft (Sprint 0)

---

## 1. Architecture Style

**Clean Architecture** with a **modular monolith** deployed on Vercel. The application is organized into concentric layers where dependencies point inward (domain → application → infrastructure → presentation).

> Rationale: A modular monolith keeps the MVP simple to ship while preserving the option to extract services (payments, notifications) later.

---

## 2. High-Level Architecture Diagram

```
                    ┌─────────────────────────────────────────────┐
                    │            Presentation Layer               │
                    │   Next.js App Router (React + shadcn/ui)    │
                    │   Server Components / Route Handlers        │
                    └──────────────────────┬──────────────────────┘
                                           │
                    ┌──────────────────────▼──────────────────────┐
                    │        Application Layer (use cases)        │
                    │   Services / UseCases / Repositories (iface)│
                    └──────────────────────┬──────────────────────┘
                                           │
                    ┌──────────────────────▼──────────────────────┐
                    │           Domain Layer (entities)           │
                    │   Pure business logic, no framework deps    │
                    └──────────────────────┬──────────────────────┘
                                           │
        ┌──────────────────┬───────────────┴───────────────┬──────────────────┐
        ▼                  ▼                               ▼                  ▼
┌───────────────┐  ┌───────────────┐  ┌──────────────────────────┐  ┌───────────────┐
│ Infrastructure│  │ Infrastructure│  │     Infrastructure        │  │ Infrastructure│
│  PostgreSQL   │  │  Cloudinary   │  │  Paystack / Flutterwave  │  │   Resend      │
│    (Prisma)   │  │   (Media)     │  │       (Payments)         │  │   (Email)     │
└───────────────┘  └───────────────┘  └──────────────────────────┘  └───────────────┘
```

---

## 3. Layer Responsibilities

### 3.1 Presentation Layer

- Next.js App Router pages & layouts.
- React Server Components for data fetching; Client Components for interactivity.
- shadcn/ui components + Tailwind CSS for UI.
- Route Handlers (`app/api/**`) expose the API to the frontend.

### 3.2 Application Layer

- Encapsulates **use cases** (e.g., `CreateOrder`, `InitiatePayment`).
- Orchestrates domain entities and calls infrastructure adapters.
- Defines repository _interfaces_ (not implementations).

### 3.3 Domain Layer

- Core business entities & rules (Order, Product, Supplier, Escrow).
- Pure JavaScript — no framework/3rd-party coupling.
- Enforces invariants (e.g., can't release escrow before shipment).

### 3.4 Infrastructure Layer

- Adapters for external services: Prisma (DB), Cloudinary, Paystack, Flutterwave, Resend, Better Auth.
- Implements repository interfaces defined in the application layer.

---

## 4. Key Cross-Cutting Concerns

| Concern              | Approach                                                    |
| -------------------- | ----------------------------------------------------------- |
| Auth & Sessions      | Better Auth middleware + server-side session checks.        |
| Authorization (RBAC) | Route/middleware guards + server-side permission checks.    |
| Configuration        | Environment variables via `process.env`, validated at boot. |
| Error Handling       | Central error boundary + structured API error responses.    |
| Logging              | Server-side logging (Vercel logs / optional observability). |
| Validation           | Zod schemas for request bodies & env.                       |
| Payments Idempotency | Idempotency keys + webhook signature verification.          |

---

## 5. Data Flow Example: Place Order & Pay

1. Buyer accepts a quotation → `POST /api/orders` (Application: `CreateOrder`).
2. Order created in DB with initial status + escrow record.
3. `POST /api/payments/initialize` → calls Paystack/Flutterwave.
4. Payment reference & status persisted.
5. Provider webhook → `POST /api/webhooks/payment` → verifies signature → marks paid → triggers email via Resend.
6. Buyer redirected back to order detail page.

---

## 6. Deployment Architecture (Vercel)

- **Frontend & API:** Next.js on Vercel (auto-scaling, edge/regions).
- **Database:** Vercel Postgres (Neon) — managed, with connection pooling.
- **Migrations:** Prisma Migrate run in CI before deploy.
- **Media:** Cloudinary CDN.
- **Environment secrets:** Vercel environment variables.
- **Cron (optional):** Vercel Cron for order status reminders.

---

## 7. Security Architecture

- HTTPS everywhere (enforced by Vercel).
- Session cookies (httpOnly, secure, sameSite).
- RBAC enforced at both UI and API layers.
- Input validation (Zod) on all routes.
- Webhook signature verification for payment providers.
- Rate limiting on auth & payment endpoints.
- Secrets never in client bundle.

---

## 8. Monitoring & Observability

- Vercel Analytics for performance.
- Structured JSON logs on server.
- Error tracking (e.g., sentry) — optional roadmap.
- Database query metrics via Prisma.

---

## 9. Future Evolution

- Extract payments & notifications into standalone services if load demands.
- Add caching (e.g., Redis) for hot catalog/search.
- Introduce queue (e.g., Inngest/BullMQ) for background jobs.
- Add i18n (zh) and multi-language content.
