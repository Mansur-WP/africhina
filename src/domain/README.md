# Domain Layer

The innermost layer of the Clean Architecture. **Pure business logic with zero
external dependencies** — no Next.js, no Prisma, no SDKs, no `fetch`.

See `docs/architecture.md` and `docs/folder-structure.md`.

## Structure

- `entities/` — core business objects (Order, RFQ, Quotation, Shipment, …) and
  their invariants. Money is always represented in **integer minor units**
  (kobo), never floating point.
- `value-objects/` — immutable typed values (Money, Currency, Address, …).
- `exceptions/` — domain-specific error types thrown when invariants break.

## Dependency rule

Nothing here may import from `application`, `infrastructure`, `app`, or
`components`. Dependencies point **inward only**. If domain code needs data, it
defines an interface that an outer layer implements.
