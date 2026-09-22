# Components (Atomic Design)

Presentation-layer React components. Organized by Atomic Design so composition
is explicit and reuse is the default.

See `docs/component-architecture.md` and `docs/design-system.md`.

## Structure

- `ui/` — shadcn/ui primitives (Button, Input, Dialog, …). Generated via
  `npx shadcn@latest add <name>`. Treat as low-level building blocks; theme them
  through the design tokens in `app/globals.css`, not with one-off colors.
- `atoms/` — smallest bespoke elements (Logo, StatusBadge, MoneyText).
- `molecules/` — small combinations (FormField, SearchInput, StatCard).
- `organisms/` — larger sections (DataTable, OrderTimeline, AppSidebar).
- `templates/` — page-level layout scaffolds with slots, no real data.

## Conventions

- Files: `PascalCase.jsx`. Folders: `camelCase`.
- Compose upward (atoms → molecules → organisms). Never import downward from a
  primitive into a page.
- Use `cn()` from `@lib/utils` for conditional classes.
- No business logic here — components receive data and callbacks via props.
