# Africhina Connect — Project Folder Structure

**Version:** 1.0
**Status:** Draft (Sprint 0)

This structure applies **Clean Architecture** principles within a Next.js App Router project while keeping idiomatic Next.js conventions.

---

## 1. Top-Level Structure

```
africhina-connect/
├── app/                      # Next.js App Router (Presentation Layer)
│   ├── (auth)/               # Auth pages (login, signup, reset)
│   ├── (public)/             # Public pages (home, products, suppliers)
│   ├── (buyer)/              # Buyer dashboard & flows
│   ├── (supplier)/           # Supplier dashboard & flows
│   ├── (admin)/              # Admin dashboard
│   ├── api/                  # Route Handlers (API layer)
│   ├── layout.js
│   ├── page.js
│   └── globals.css
├── src/
│   ├── application/          # Application Layer (use cases)
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── products/
│   │   ├── suppliers/
│   │   ├── rfqs/
│   │   └── notifications/
│   ├── domain/               # Domain Layer (entities & rules)
│   │   ├── entities/
│   │   ├── value-objects/
│   │   └── exceptions/
│   ├── infrastructure/       # Infrastructure Layer (adapters)
│   │   ├── db/               # Prisma client & repositories
│   │   ├── auth/             # Better Auth setup
│   │   ├── payments/         # Paystack & Flutterwave adapters
│   │   ├── media/            # Cloudinary adapter
│   │   ├── email/            # Resend adapter
│   │   └── config/           # env validation/config
│   └── shared/               # Shared utilities
│       ├── lib/              # helpers, contracts
│       ├── validators/       # Zod schemas
│       ├── middleware/       # auth/role guards
│       └── constants/
├── components/               # Reusable UI (shadcn/ui + custom)
│   ├── ui/                   # shadcn/ui primitives
│   ├── forms/
│   ├── layout/
│   └── shared/
├── lib/                      # Client-side helpers (fetchers, hooks, utils)
│   ├── api/
│   ├── hooks/
│   └── utils.js
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.js
├── public/
├── styles/
├── .env.example
├── .env.local               # (gitignored)
├── .gitignore
├── package.json
├── next.config.js
├── tailwind.config.js
├── postcss.config.js
├── jsconfig.json            # path aliases
└── middleware.js            # top-level route protection
```

---

## 2. Layer-to-Folder Mapping

| Clean Architecture Layer | Folder                        |
| ------------------------ | ----------------------------- |
| Presentation             | `app/`, `components/`, `lib/` |
| Application (use cases)  | `src/application/`            |
| Domain                   | `src/domain/`                 |
| Infrastructure           | `src/infrastructure/`         |
| Cross-cutting / Shared   | `src/shared/`                 |

---

## 3. Dependency Rules

- **app/** → depends on `src/application` and `src/shared`.
- **src/application/** → depends on `src/domain` and `src/shared`; defines repository interfaces.
- **src/domain/** → depends on nothing external (pure JS).
- **src/infrastructure/** → implements interfaces from `src/application`; depends on external SDKs.
- No layer may import from a higher layer (dependency points inward).

---

## 4. Key Files & Responsibilities

| File                                      | Responsibility                                                           |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| `app/api/**/route.js`                     | Route Handlers: parse request, validate, call use case, return response. |
| `src/application/**/use-case.js`          | Orchestrates business workflow for a feature.                            |
| `src/domain/entities/*.js`                | Pure business entities & invariants.                                     |
| `src/infrastructure/db/repositories/*.js` | Prisma-backed implementations of repository interfaces.                  |
| `src/infrastructure/auth/*.js`            | Better Auth server/client configuration.                                 |
| `src/infrastructure/payments/*.js`        | Paystack/Flutterwave adapters.                                           |
| `src/shared/validators/*.js`              | Zod request & env schemas.                                               |
| `src/shared/middleware/*.js`              | Reusable auth/role guard functions.                                      |
| `prisma/schema.prisma`                    | Data model (maps to database-schema.md).                                 |

---

## 5. Path Aliases

Configured in `jsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./*"],
      "@components/*": ["components/*"],
      "@application/*": ["src/application/*"],
      "@domain/*": ["src/domain/*"],
      "@infrastructure/*": ["src/infrastructure/*"],
      "@shared/*": ["src/shared/*"]
    }
  }
}
```

---

## 6. Naming Conventions

- Route Handlers: `route.js` inside feature folders.
- Use cases: `CreateOrder.js`, `InitiatePayment.js` (PascalCase).
- Domain entities: `Order.js`, `Product.js` (PascalCase).
- Repositories: `OrderRepository.js`.
- Components: `PascalCase.jsx`.
- Hooks: `useOrder.js`.
- Validators: `orderValidators.js` (or `*.schema.js`).
