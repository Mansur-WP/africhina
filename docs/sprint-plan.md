# Africhina Connect — Sprint Plan

**Version:** 1.0
**Status:** Draft (Sprint 0)
**Methodology:** Agile Scrum (2-week sprints)

---

## Sprint 0 — Planning & Setup (Current)

**Goal:** Project setup & architecture.
**Deliverables:**

- PRD, SRS, Architecture, DB schema, Roles, API structure, Folder structure, Coding standards, Backlog, Sprint plan.
- Initialize Next.js (App Router, JS) project scaffolding.
- Configure Tailwind, shadcn/ui, ESLint, Prettier, path aliases.
- Set up Prisma + PostgreSQL and base schema/migrations.
- Configure Better Auth, Cloudinary, Resend client stubs.
- CI + Vercel deployment pipeline.

**Do NOT write application feature code in this sprint.**

---

## Sprint 1 — Auth & Accounts Foundation

**Goal:** Authentication + user/supplier profiles.
**Stories:** US-01, US-02, US-03, US-04, US-06, US-07, US-08, US-09
**Tasks:**

- Better Auth setup (email/password + OAuth).
- Auth pages (login, signup, reset).
- Role-based middleware & session helpers.
- User profile management.
- Supplier onboarding & verification flow.
- Admin supplier verification UI.

---

## Sprint 2 — Product Catalog

**Goal:** Suppliers list products; buyers browse.
**Stories:** US-10, US-11, US-12, US-13
**Tasks:**

- Categories CRUD & seed.
- Product CRUD for suppliers.
- Cloudinary image upload.
- Product search/filter (catalog).
- Product detail page.

---

## Sprint 3 — RFQ & Orders

**Goal:** RFQ → quotation → order workflow.
**Stories:** US-14, US-15, US-16, US-17, US-18, US-19, US-20
**Tasks:**

- RFQ creation & listing.
- Quotation responses & acceptance.
- Order creation from quotation.
- Order status lifecycle & management.
- Buyer & supplier order dashboards.

---

## Sprint 4 — Payments & Escrow

**Goal:** Escrow-backed payments.
**Stories:** US-21, US-22, US-23, US-24, US-25
**Tasks:**

- Paystack & Flutterwave initialization/verification.
- Payment webhooks (idempotent, signature-verified).
- Escrow model: hold, release, refund.
- Payment status UI.
- Escrow milestone release workflow.

---

## Sprint 5 — Shipping, Notifications & Admin

**Goal:** Logistics, notifications, admin dashboard.
**Stories:** US-26, US-27, US-28, US-29, US-30, US-31, US-32, US-33, US-34
**Tasks:**

- Shipment milestone tracking (logistics role).
- Shipping document uploads.
- Email notifications (Resend) + in-app feed.
- Dispute raise & resolution.
- Admin dashboard (KPIs, moderation).

---

## Sprint 6 — Polishing & Hardening

**Goal:** Production readiness.
**Tasks:**

- Accessibility & responsive polish.
- Error boundaries & loading states.
- Performance (caching, image opt).
- Security audit (rate limits, RBAC).
- E2E testing & UAT.
- Deploy to Vercel production.

---

## Future / Deferred Sprints

- Reviews & ratings (US-35).
- i18n (zh), multi-currency FX engine.
- Advanced logistics scheduling.
- Buyer financing.
- AI-powered sourcing recommendations.

---

## Team Cadence

- **Sprint length:** 2 weeks.
- **Ceremonies:** Planning, Daily standup, Review, Retro.
- **Capacity:** ~20–25 story points per sprint (assumption).
- **Estimated MVP timeline:** ~6 sprints (~12 weeks).

---

## Release Plan

- **MVP (V1.0):** after Sprint 5.
- **Public beta:** Sprint 6.
- **GA:** after hardening + compliance review.
