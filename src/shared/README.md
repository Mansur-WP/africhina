# Shared

Cross-cutting code used across layers. Keep this small and dependency-light —
it must not become a dumping ground.

See `docs/folder-structure.md` and `docs/coding-standards.md`.

## Structure

- `lib/` — framework-agnostic pure helpers (formatting, money, dates).
- `validators/` — Zod schemas shared between API routes and forms.
- `middleware/` — request helpers: auth guards, RBAC checks, the API response
  envelope `{ success, message, data, meta | error }`.
- `constants/` — enums and constants mirrored from the database (order statuses,
  roles, currencies).

> `validators/` will start being populated when request validation and env
> validation land (Zod is added in that story, not the foundation story).

## Note

`src/shared/lib` is for **server/framework-agnostic** helpers. UI-facing client
helpers and the `cn()` class merger live in the top-level `lib/`.
