# lib/

Client/UI-facing utilities for the presentation layer. Framework-aware helpers
live here; framework-agnostic domain helpers live in `src/shared/lib`.

See `docs/folder-structure.md`.

## Structure

- `utils.js` — the `cn()` class-name merger (clsx + tailwind-merge). Required by
  shadcn/ui and imported as `@lib/utils`.
- `api/` — client-side API fetch wrappers around the `/api/v1` REST endpoints.
- `hooks/` — reusable React hooks (`useX`).

> `api/` and `hooks/` are scaffolded but empty until feature stories need them.
