# Africhina Connect — Coding Standards

**Version:** 1.0
**Status:** Draft (Sprint 0)

---

## 1. Language & Frameworks

- **JavaScript only** (no TypeScript). Use modern ES2020+ (`import/export`, optional chaining, nullish coalescing).
- **Next.js App Router**, React, Tailwind CSS, shadcn/ui.
- **Prisma ORM** for PostgreSQL, **Better Auth** for auth, **Cloudinary**, **Paystack**, **Flutterwave**, **Resend**.

---

## 2. JavaScript Style Guide

- **Prettier** for formatting (single quotes, trailing commas, 2-space indent).
- **ESLint** with `eslint-config-next` plus Airbnb-ish rules (or project-defined).
- Use `const` by default; `let` only when reassigned. Avoid `var`.
- Use `===` / `!==` (never `==` / `!=`).
- Meaningful names: verbs for functions (`getOrder`), nouns for data (`orderList`).
- No dead code, commented-out code, or `console.log` noise in production.

---

## 3. Naming Conventions

| Item                  | Convention                           | Example                   |
| --------------------- | ------------------------------------ | ------------------------- |
| Variables / functions | camelCase                            | `fetchProducts`           |
| Constants             | UPPER_SNAKE                          | `MAX_QUANTITY`            |
| Components            | PascalCase                           | `OrderCard`               |
| Files (components)    | PascalCase.jsx                       | `OrderCard.jsx`           |
| Files (modules)       | camelCase.js                         | `orderService.js`         |
| Route handlers        | route.js                             | `app/api/orders/route.js` |
| Prisma models         | PascalCase                           | `Order`                   |
| DB columns/fields     | camelCase                            | `minimumOrderQty`         |
| CSS classes           | Tailwind utility / kebab-case custom | `order-summary`           |

---

## 4. Clean Architecture Conventions

- **Dependency rule:** dependencies point inward. Domain never imports frameworks.
- **Use cases** in `src/application`; **entities** in `src/domain`; **adapters** in `src/infrastructure`.
- **Repositories:** define interfaces in application layer, implement in infrastructure.
- Keep business rules out of route handlers and components.
- Use DTOs/envelopes for API responses.

---

## 5. Component & Styling Standards

- Use **shadcn/ui** primitives as the base; extend via `components/ui`.
- Prefer **React Server Components** for data fetching; use **Client Components** only when interactivity/state is required (`"use client"`).
- Tailwind utility classes first; custom CSS in `globals.css` only for global/base styles.
- Consistent spacing, color, and typography from the Tailwind/shadcn theme.
- Ensure accessibility: semantic HTML, ARIA labels, keyboard nav, focus states.

---

## 6. API & Data Standards

- All request bodies validated with **Zod** schemas.
- Consistent response envelope `{ success, data, error }`.
- Handle errors with try/catch and return structured error responses.
- Server-side role guards on every protected route (never trust client).
- Use Prisma with **transactions** for multi-step writes (e.g., order + escrow).
- Never log secrets; hash passwords; verify webhook signatures.

---

## 7. State Management & Data Fetching

- Server components + Server Actions / Route Handlers as primary data flow.
- Client-side: `useSWR` or TanStack Query for mutations/caching where needed.
- Keep global state minimal; prefer props and composables.

---

## 8. Testing & Quality

- Unit tests for domain & application layers (e.g., Vitest).
- Component tests for key UI (React Testing Library).
- Integration tests for critical API flows (payments, orders).
- Target coverage for domain & application logic.

---

## 9. Git Workflow

- **Branching:** `main` (protected) → feature branches (`feature/order-flow`), `fix/`, `chore/`.
- Follow the **Blackbox AI** branch prefix when contributing: `blackboxai/<feature>`.
- Conventional commits: `feat`, `fix`, `chore`, `docs`, `refactor`, `test`.
- PRs: small, reviewed, linked to backlog items; run lint + tests before merge.

---

## 10. Documentation

- Document public functions with JSDoc where helpful.
- Keep `docs/` architecture & schema docs in sync with code.
- Add inline comments only for non-obvious logic.

---

## 11. Security Checklist

- No secrets in code or commits; use `.env.local` + `.env.example`.
- Validate & sanitize all inputs.
- Enforce RBAC on UI and API.
- Use parameterized queries (Prisma) — no string SQL.
- Set secure cookies (httpOnly, sameSite, secure).
- Rate-limit auth/payment endpoints.
- Keep dependencies updated (npm audit).
