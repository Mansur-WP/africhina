# Infrastructure Layer

Concrete implementations of the interfaces defined by `application` — everything
that talks to the outside world. This is the **only** layer allowed to import
Prisma, Better Auth, Cloudinary, Paystack, Flutterwave, and Resend.

See `docs/architecture.md`.

## Structure

- `db/` — repository implementations backed by the Prisma client singleton
  (`lib/prisma.js`).
- `auth/` — Better Auth server configuration and session helpers.
- `payments/` — Paystack and Flutterwave gateway adapters + webhook verifiers.
- `media/` — Cloudinary upload/signing adapter.
- `email/` — Resend transactional email adapter.
- `config/` — environment loading and validation (fail fast on missing vars).

> These adapters are **not** implemented in the foundation story. Each is
> configured in its own Phase 0 story.

## Dependency rule

May import from `domain` and `application`. Must not import from `presentation`
(`app/`, `components/`).
