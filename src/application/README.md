# Application Layer

Use cases and orchestration. This layer coordinates domain objects to fulfill a
business action (create RFQ, accept quotation, record payment, advance shipment
status). It depends on `domain` and defines **repository interfaces** that
`infrastructure` implements.

See `docs/architecture.md` and `docs/api-structure.md`.

## Structure (feature modules)

- `orders/` — order lifecycle and the order state machine.
- `payments/` — quotation acceptance → payment initialization → reconciliation.
- `products/` — catalog read/search use cases.
- `suppliers/` — internal supplier records (data-only; suppliers do not log in).
- `rfqs/` — request-for-quote intake and quotation issuance.
- `notifications/` — email/in-app notification dispatch use cases.

## Dependency rule

May import from `domain` only. Must **not** import Prisma, SDKs, or Next.js
request/response objects directly — those arrive through injected interfaces.
