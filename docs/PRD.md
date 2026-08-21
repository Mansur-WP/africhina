# Africhina Connect — Product Requirements Document (PRD)

**Version:** 1.0
**Status:** Draft (Sprint 0)
**Owner:** Product Manager / Lead Architect
**Last Updated:** Sprint 0

---

## 1. Product Overview

Africhina Connect is a **China-to-Nigeria sourcing and import management platform**. It connects Nigerian importers/businesses with verified Chinese suppliers, and manages the full import workflow — from product discovery and quotation to procurement, shipping, customs, and payment.

The platform reduces risk, cost, and complexity in cross-border trade between China and Nigeria by providing a single, trusted workflow with integrated payments, escrow, logistics, and documentation.

---

## 2. Problem Statement

Nigerian importers face significant challenges sourcing from China:

- **Trust & verification:** Hard to verify the legitimacy of Chinese suppliers.
- **Opacity:** No transparency in pricing, quality, or shipping status.
- **Payment risk:** High risk of fraud; no escrow protection.
- **Logistics complexity:** Fragmented coordination of freight, customs, and delivery.
- **Language & culture barriers:** Communication gaps between buyers and suppliers.

---

## 3. Goals & Objectives

### Business Goals

1. Build a trusted marketplace connecting Nigerian importers with verified Chinese suppliers.
2. Provide end-to-end import management within one platform.
3. Generate revenue via commissions, premium listings, and value-added services.

### Product Goals

1. Enable secure product discovery, RFQ/quotation, and ordering.
2. Integrate escrow-backed payments (Paystack, Flutterwave) for Nigerian buyers.
3. Provide real-time order, shipping, and customs tracking.
4. Support multi-currency (CNY, USD, NGN) quotation and payment.

---

## 4. Target Audience / Personas

| Persona                | Description                              | Key Needs                                               |
| ---------------------- | ---------------------------------------- | ------------------------------------------------------- |
| **Nigerian Importer**  | SME owner importing goods from China     | Verified suppliers, escrow, tracking, fair pricing      |
| **Chinese Supplier**   | Factory/wholesaler selling to Nigeria    | Exposure, verified buyers, simplified payment           |
| **Platform Admin**     | Internal ops team                        | Moderation, verification, analytics, dispute resolution |
| **Logistics Partner**  | Freight/3PL providers                    | Order visibility, shipment updates, document handling   |
| **Configurator Agent** | Helps importers source specific products | Access to supplier network, commission tracking         |

---

## 5. Value Proposition

- **Verified supplier network** — vetted factories/wholesalers.
- **Escrow-protected payments** — funds released only when milestones are met.
- **All-in-one workflow** — sourcing, ordering, shipping, customs, payment.
- **Transparent tracking** — real-time status at every stage.
- **Localized for Nigeria** — NGN support, local payment rails, local support.

---

## 6. Scope

### In-Scope (Phase 1 / MVP)

- User authentication & profile management.
- Supplier directory & verification.
- Product catalog & search/filter.
- Request for Quotation (RFQ) workflow.
- Order management & status tracking.
- Escrow-backed payments via Paystack & Flutterwave.
- Basic shipping & customs milestone tracking.
- Notifications (email via Resend).
- Admin dashboard for moderation & verification.

### Out-of-Scope (Future Phases)

- Full marketplace multi-vendor storefronts.
- Advanced logistics scheduling/booking.
- Mobile native apps.
- Credit/financing products.
- AI-powered sourcing recommendations.

---

## 7. Functional Requirements (Summary)

| ID    | Requirement                         | Priority |
| ----- | ----------------------------------- | -------- |
| FR-01 | User registration, login, roles     | P0       |
| FR-02 | Supplier onboarding & verification  | P0       |
| FR-03 | Product catalog & search            | P0       |
| FR-04 | RFQ creation & response             | P0       |
| FR-05 | Order creation & management         | P0       |
| FR-06 | Escrow payment initiation & status  | P0       |
| FR-07 | Shipping/customs milestone tracking | P1       |
| FR-08 | Notifications (email)               | P1       |
| FR-09 | Admin moderation & analytics        | P1       |
| FR-10 | Reviews & ratings                   | P2       |

---

## 8. Non-Functional Requirements (Summary)

| ID     | Requirement                                        | Priority |
| ------ | -------------------------------------------------- | -------- |
| NFR-01 | Performance: < 2s page load (p95)                  | P0       |
| NFR-02 | Security: HTTPS, encrypted PII, OWASP-aligned      | P0       |
| NFR-03 | Scalability: horizontal scaling on Vercel/Postgres | P1       |
| NFR-04 | Availability: 99.9% uptime target                  | P1       |
| NFR-05 | Maintainability: Clean Architecture, modular       | P1       |
| NFR-06 | Accessibility: WCAG 2.1 AA                         | P2       |
| NFR-07 | Localization: en (start), zh support roadmap       | P2       |

---

## 9. Success Metrics (KPIs)

- **Activation rate:** % of registered buyers who complete first RFQ.
- **Order completion rate:** % of orders reaching paid & shipped status.
- **Supplier verification TAT:** time to verify a supplier.
- **Escrow dispute rate:** % of orders with disputes.
- **CAC / LTV:** customer acquisition cost vs lifetime value.
- **NPS:** buyer & supplier satisfaction.

---

## 10. Constraints & Assumptions

- JavaScript-only codebase (no TypeScript).
- Next.js App Router with shadcn/ui + Tailwind.
- PostgreSQL via Prisma ORM over Vercel Postgres/Neon.
- Better Auth for authentication.
- Cloudinary for media, Paystack & Flutterwave for payments, Resend for email.
- Deployment on Vercel.
- Legal/regulatory compliance (e.g., trade, customs) to be reviewed.

---

## 11. Risks & Mitigations

| Risk                  | Mitigation                                        |
| --------------------- | ------------------------------------------------- |
| Fraudulent suppliers  | Identity/business verification, reputation scores |
| Payment disputes      | Escrow milestone-based release, dispute workflow  |
| Currency volatility   | Real-time FX, multi-currency quotes               |
| Logistics delays      | Milestone tracking, partner SLAs, alerts          |
| Regulatory compliance | Legal review, data residency considerations       |

---

## 12. Out of Scope for MVP (Deferred)

- Multi-language UI (beyond en).
- Native mobile apps.
- Integrated market-rate FX engine.
- Buyer financing.
