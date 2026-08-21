# Africhina Connect — Design System

**Version:** 1.0
**Status:** Draft (Sprint 0.5 — UX & System Validation)
**Author:** Lead Product Designer / Design System Architect
**Audience:** Frontend Developers, Designers, Testers, Stakeholders

> **This document is the single source of truth for all future frontend development.**

---

# 1 Brand Identity

### Company Name

**Africhina Connect**

### Brand Tagline

_"Bridging China to Nigeria. Securely."_

### Brand Personality

Professional, Minimal, Clean, Corporate, Trustworthy, Premium.

The brand is the **connector** between two markets — it should feel like a reliable logistics and trade partner: precise, secure, and modern. Think boardroom of a freight-forwarding firm meets the sharpness of a fintech dashboard.

### Brand Voice

- **Clear** — plain language, no jargon.
- **Confident** — statements over hype.
- **Reassuring** — emphasizes trust, escrow, verification.
- **Concise** — short sentences; respect the user's time.

### Design Principles

1. **Clarity over cleverness** — every layout has one obvious primary action.
2. **Trust through transparency** — show status, provenance, and money clearly.
3. **Consistency** — one system, no bespoke patterns.
4. **Efficiency** — dense but not cluttered; dashboards prioritize scannability.
5. **Respect** — calm motion, accessible contrast, no visual noise.
6. **Premium restraint** — use neutrals and one accent; whitespace is a feature.

### Logo Usage Guidelines

- Use the primary logo mark on **light** and **dark** backgrounds using approved variants.
- Maintain a **clear space** equal to the logo height on all sides.
- Minimum width: **32px** (favicon/avatar) / **120px** (header).
- Do **not** stretch, recolor outside palette, add shadows, or place on busy imagery.
- Wordmark: "Africhina Connect" in the brand font, single line, tracked tight.

---

# 2 Color System

> **Brand palette: Navy + Gold.** Deep navy conveys authority and trust and
> drives all primary actions and headings; warm gold is the single accent,
> reserved for trust signals (verified, escrow, checkmarks). Canonical values
> are authored in OKLCH in `app/globals.css` (matching the brand reference);
> the HEX values below are approximate sRGB equivalents for quick reference.

### Primary (Navy)

| Token             | OKLCH / HEX                       | Usage                                             |
| ----------------- | --------------------------------- | ------------------------------------------------- |
| `primary`         | `oklch(26% .068 258)` ≈ `#1E2A44` | Primary buttons, links, active nav, focus accents |
| `primary-hover`   | `oklch(22% .064 258)` ≈ `#18223A` | Hover on primary elements                         |
| `primary-pressed` | `oklch(18% .055 258)` ≈ `#121A2E` | Pressed/active primary                            |
| `primary-subtle`  | `oklch(95% .03 258)` ≈ `#EAEEF6`  | Primary backgrounds, selected states, icon chips  |

### Secondary

| Token       | OKLCH / HEX                      | Usage                            |
| ----------- | -------------------------------- | -------------------------------- |
| `secondary` | `oklch(52% .03 258)` ≈ `#6B7688` | Secondary buttons, muted accents |

### Accent (Gold)

| Token    | OKLCH / HEX                     | Usage                                              |
| -------- | ------------------------------- | -------------------------------------------------- |
| `accent` | `oklch(74% .11 88)` ≈ `#C79A3A` | Highlights, trust signals, verified badges, escrow |

### Backgrounds

| Token               | HEX                  | Usage                      |
| ------------------- | -------------------- | -------------------------- |
| `background`        | `#FFFFFF`            | App background             |
| `background-subtle` | `#F9FAFB` (Gray-50)  | Page sections, app shell   |
| `surface`           | `#FFFFFF`            | Cards, modals, popovers    |
| `surface-muted`     | `#F3F4F6` (Gray-100) | Secondary surfaces, inputs |

### Borders & Dividers

| Token           | HEX                  | Usage                             |
| --------------- | -------------------- | --------------------------------- |
| `border`        | `#E5E7EB` (Gray-200) | Card & input borders              |
| `border-strong` | `#D1D5DB` (Gray-300) | Hover borders, table headers      |
| `divider`       | `#F3F4F6` (Gray-100) | Section dividers, list separators |

### Text

| Token            | HEX                  | Usage                                 |
| ---------------- | -------------------- | ------------------------------------- |
| `text-primary`   | `#111827` (Gray-900) | Headings, emphasis                    |
| `text-secondary` | `#4B5563` (Gray-600) | Body text                             |
| `text-muted`     | `#9CA3AF` (Gray-400) | Captions, placeholders, disabled text |

### Semantic States

| Token           | HEX       | Usage                                |
| --------------- | --------- | ------------------------------------ |
| `success`       | `#16A34A` | Paid, delivered, completed, verified |
| `success-bg`    | `#F0FDF4` | Success backgrounds                  |
| `warning`       | `#D97706` | Pending, in-transit, expiring        |
| `warning-bg`    | `#FFFBEB` | Warning backgrounds                  |
| `error`         | `#DC2626` | Failed, refunded, errors             |
| `error-bg`      | `#FEF2F2` | Error backgrounds                    |
| `info`          | `#0A5CFF` | Informational, in-production         |
| `info-bg`       | `#E8F0FF` | Info backgrounds                     |
| `disabled`      | `#F3F4F6` | Disabled fills                       |
| `disabled text` | `#D1D5DB` | Disabled text/icons                  |

### Interactive States

| Token     | HEX                           | Usage                         |
| --------- | ----------------------------- | ----------------------------- |
| `hover`   | semantic + 90%                | Hover on interactive elements |
| `focus`   | Navy 2px ring + `#EAEEF6` 3px | Visible focus ring            |
| `pressed` | semantic + 85%                | Pressed state                 |

### Dark Mode (Future)

| Token          | HEX       | Usage          |
| -------------- | --------- | -------------- |
| `background`   | `#0B0F19` | App background |
| `surface`      | `#111827` | Cards          |
| `border`       | `#1F2937` | Borders        |
| `text-primary` | `#F9FAFB` | Text           |

---

# 3 Typography

**Font family:** Inter (with system fallbacks `-apple-system, BlinkMacSystemFont, Segoe UI`, and `Noto Sans` for Chinese text support in Phase 2).

| Style      | Font Size | Weight | Line Height | Letter Spacing |
| ---------- | --------- | ------ | ----------- | -------------- |
| Display    | 40px      | 700    | 1.1         | -0.025em       |
| H1         | 32px      | 700    | 1.2         | -0.02em        |
| H2         | 24px      | 650    | 1.25        | -0.015em       |
| H3         | 20px      | 600    | 1.3         | -0.01em        |
| H4         | 16px      | 600    | 1.4         | 0              |
| Body Large | 16px      | 400    | 1.5         | 0              |
| Body       | 14px      | 400    | 1.5         | 0              |
| Small      | 13px      | 400    | 1.45        | 0              |
| Caption    | 12px      | 500    | 1.4         | 0.01em         |
| Button     | 14px      | 600    | 1           | 0              |
| Navigation | 14px      | 500    | 1.2         | 0              |

- **Weights used:** 400 (regular), 500 (medium), 600 (semi-bold), 650 (text/graph bold), 700 (bold).
- Default body size is **14px** for dense dashboards; **16px** for marketing/public pages.
- Numbers and currencies: use **tabular-nums** to keep columns aligned in tables.

---

# 4 Spacing System (8-point grid)

| Token      | Value |
| ---------- | ----- |
| `space-1`  | 4px   |
| `space-2`  | 8px   |
| `space-3`  | 12px  |
| `space-4`  | 16px  |
| `space-5`  | 24px  |
| `space-6`  | 32px  |
| `space-7`  | 40px  |
| `space-8`  | 48px  |
| `space-9`  | 64px  |
| `space-10` | 80px  |
| `space-11` | 96px  |

**Rules:**

- All spacing uses multiples of 8 (or 4 for fine micro-spacing within components).
- Component padding: buttons `12px` (h), inputs `12px`; card padding `24px`; page sections `32–48px`.
- Maintain consistent vertical rhythm between sections.

---

# 5 Border Radius

| Token         | Value  | Usage                        |
| ------------- | ------ | ---------------------------- |
| `radius-sm`   | 6px    | Small inputs, badges         |
| `radius-md`   | 8px    | Buttons, inputs, chips       |
| `radius-lg`   | 12px   | Cards, dropdowns             |
| `radius-xl`   | 16px   | Dialogs, modals, large cards |
| `radius-pill` | 9999px | Tags, status pills, avatars  |

---

# 6 Elevation (Shadows)

| Token             | Usage               | Shadow                                                                      |
| ----------------- | ------------------- | --------------------------------------------------------------------------- |
| `shadow-card`     | Cards               | `0 1px 2px rgba(16,24,40,0.04), 0 1px 3px rgba(16,24,40,0.04)`              |
| `shadow-dropdown` | Dropdowns, popovers | `0 4px 6px -2px rgba(16,24,40,0.05), 0 12px 16px -4px rgba(16,24,40,0.08)`  |
| `shadow-dialog`   | Modals, dialogs     | `0 8px 10px -6px rgba(16,24,40,0.06), 0 20px 25px -5px rgba(16,24,40,0.12)` |
| `shadow-nav`      | Navigation bars     | `0 1px 2px rgba(16,24,40,0.04)`                                             |

---

# 7 Icons

- **Library:** Lucide Icons (matches shadcn/ui, tree-shakeable, MIT).
- Sizes: **16px** (inline, table, buttons), **20px** (default UI), **24px** (empty states, headers), **32px** (stat icons).
- **Usage rules:** stroke-weight 1.5–2; use consistent stroke; never mix filled/outline; align to text baseline; icons are decorative by default (hide from screen readers unless meaningful).

---

# 8 Buttons

### Primary

- **Purpose:** The single primary action on a screen.
- **States:** default, hover, pressed, focus, disabled, loading.
- **Padding:** 12px h × 10px v.
- **Radius:** `radius-md` (8px).
- **Typography:** Button 14px/600.
- **Icons:** optional leading icon 16px.

### Secondary

- **Purpose:** Alternative actions of equal importance.
- **States:** same set.
- **Padding/Radius:** same as primary.
- **Typography:** Button 14px/600.
- **Icons:** optional.

### Outline

- **Purpose:** Non-prominent actions; borders only.
- **States:** default, hover (bg-subtle), pressed, disabled.
- **Padding/Radius:** same.
- **Typography:** Button 14px/600.

### Ghost

- **Purpose:** Inline/contextual actions (e.g., in tables).
- **States:** default (transparent), hover (bg-muted), pressed.
- **Padding/Radius:** same.
- **Typography:** Button 14px/600.

### Danger

- **Purpose:** Destructive actions (delete, cancel, refund).
- **States:** `error` fill, hover `error` darker.
- **Padding/Radius:** same.
- **Typography:** Button 14px/600.

### Success

- **Purpose:** Confirmations, "Release Escrow", "Confirm Delivery".
- **States:** `success` fill.
- **Padding/Radius:** same.
- **Typography:** Button 14px/600.

### Loading

- **Purpose:** Pending async action.
- **States:** show spinner + disable pointer events; keep width stable to avoid layout shift.

### Disabled

- **Purpose:** Unavailable action.
- **Visual:** `disabled` fill/text; `cursor: not-allowed`; no hover.

### Icon Button

- **Purpose:** Compact actions (edit, delete, more).
- **Size:** 36×36px (min 32×32); icon 16–18px.
- **Radius:** `radius-md`.

### Floating Action Button (FAB)

- **Purpose:** Primary mobile action (e.g., "New RFQ").
- **Size:** 56×56px circle (`radius-pill`); icon 24px; elevation `shadow-dialog`.

**Button rules:** Never more than **two primary buttons** per screen; destructive actions always require a confirmation; buttons must have a visible label (icon-only needs `aria-label`).

---

# 9 Inputs

Supported types: **Text, Password, Email, Phone, Textarea, Search, Select, Date Picker, Checkbox, Radio, Switch, OTP**.

- **Height:** 40px (36px compact for tables).
- **Padding:** 12px h × 10px v.
- **Border:** `border` 1px; focus → `primary` border + `focus` ring.
- **Radius:** `radius-md`.
- **Typography:** Body 14px/400; placeholder `text-muted`.
- **Labels:** 13px/500 above field; `text-secondary`.
- **Validation:**
  - Error: `error` border + `error-bg` fill + inline message below (13px/`error`).
  - Success: `success` border + optional check icon.
  - Disabled: `disabled` fill, `disabled text`.
  - Required: asterisk `*` in `error`.
- **Inline validation:** validate on blur and show inline; never rely on submit-only errors.

---

# 10 Cards

- **Base:** `surface`, `border` 1px, `radius-lg`, `shadow-card`, padding `24px`.

| Card                  | Specifics                                                                                 |
| --------------------- | ----------------------------------------------------------------------------------------- |
| **Product Card**      | Image 4:3, title H4, price semibold, category caption, supplier link, "Request Quote" CTA |
| **Order Card**        | Order number, StatusBadge, date, total, link to detail                                    |
| **RFQ Card**          | Title, quantity, status, destination, quote count, "View Quotes"                          |
| **Shipment Card**     | Tracking number, StatusTimeline, carrier, ETA, "Track"                                    |
| **Statistics Card**   | Icon chip, label caption, value H2, delta small (+/-)                                     |
| **Notification Card** | Icon, title, body, relative time, unread dot                                              |

---

# 11 Navigation

### Top Navigation

- Height **56px**, `background-subtle`, `border` bottom `shadow-nav`.
- Left: logo; center: primary nav (public); right: search, notifications, avatar.

### Sidebar

- Width **240px** (collapsible to 64px), `background-subtle`, sticky.
- Item: icon 20px + label 14px/500; active = `primary-subtle` bg + `primary` text + left indicator.
- Section headers: caption uppercase `text-muted`.

### Breadcrumb

- Parent links `text-muted`; current page `text-primary`; separator `/`.
- Font: Small 13px.

### Tabs

- Underline style; active tab `primary` underline + `text-primary`; inactive `text-muted`; height 40px.

### Pagination

- Buttons 32×32px; page numbers small; active page `primary` bg; prev/next icon buttons.

---

# 12 Feedback Components

### Toast

- Top-right, `radius-lg`, `shadow-dialog`, 320px, auto-dismiss 4s (errors persist).
- Types: success (green check), error (red), info (blue), warning (amber).

### Alert

- Inline banner, `radius-md`, semantic bg + border + icon + message; optional action link.

### Dialog

- Centered modal, `radius-xl`, `shadow-dialog`, overlay `rgba(16,24,40,0.4)`, max-width 480px; title H4 + body + actions (right-aligned).

### Confirmation

- Dialog variant with a clear destructive/main CTA; requires explicit confirm; never auto-confirm.

### Skeleton Loader

- Replace content with `surface-muted` shimmer blocks matching final layout; keep layout stable.

### Empty State

- Centered icon (48px), title H4, body, single relevant CTA.

### Error State

- Alert + retry button; provide context (what failed) and next step.

---

# 13 Tables

- **Container:** `surface`, `border`, `radius-lg`, overflow hidden.
- **Header:** `surface-muted`, 13px/600, `border` bottom.
- **Rows:** hover `background-subtle`; row border `divider`.
- **Sorting:** clickable headers with sort icon; only sort meaningful columns.
- **Filtering:** FilterBar above table; filter chips reflect active state.
- **Searching:** SearchBar above table; all tables must support search.
- **Bulk Actions:** appear when rows selected; right-aligned action bar.
- **Status Badges:** pill (`radius-pill`), 12px/500, semantic bg+text (success/warning/error/info/neutral).
- **Pagination:** bottom-right; page size selector.
- **Numbers:** tabular-nums; right-align monetary columns.

---

# 14 Charts

Recommended style: **minimal, flat, no 3D**, consistent with dashboards.

- **Line/Area:** trends over time (orders, revenue).
- **Bar:** comparisons (by category, month).
- **Donut:** composition (payment methods, status split).
- **KPIs:** plain stat cards with deltas.
- Use one accent + neutrals; tooltips on hover; accessible data tables as fallback.

---

# 15 Mobile Design Rules

- **Touch targets:** minimum **44×44px** for interactive elements.
- **Spacing:** use larger gaps (24px) and card padding (16px) on small screens.
- **Bottom navigation:** 4–5 items max; 56px height; active = `primary`.
- **Responsive breakpoints:**
  - Mobile: `< 640px`
  - Tablet: `640–1024px`
  - Desktop: `> 1024px`
- Sidebar collapses to bottom nav on mobile; tables become scrollable cards.

---

# 16 Accessibility

- **Contrast:** all text meets WCAG 2.1 AA (4.5:1 normal, 3:1 large). Test semantic colors.
- **Keyboard Navigation:** full tab order; visible focus; arrow-key support for selects/tabs/tables.
- **Focus States:** 2px `primary` ring + 3px `primary-subtle`; never remove default outline without replacement.
- **ARIA:** semantic landmarks (`header`, `nav`, `main`), `aria-label` on icon buttons, `aria-live` for toasts/alerts, `role="dialog"` + focus trap for modals, `aria-expanded` for menus.

---

# 17 Motion

- **Duration:** 150ms (micro), 200ms (components), 250ms (dialogs/pages).
- **Easing:** `ease-out` for enter, `ease-in` for exit; standard `cubic-bezier(0.2, 0, 0, 1)`.
- **Page transitions:** subtle fade + 8px slide-up; 200ms.
- **Hover effects:** bg/color shifts only, no scaling.
- **Loading:** skeleton shimmer or spinner; no full-screen spinners for partial loads.
- **Micro-interactions:** button press 90% scale at 100ms; checkbox/switch 150ms.
- **Rules:** no excessive/bouncy animation; respect `prefers-reduced-motion` (disable non-essential motion); never animate layout-critical displacement.

---

# 18 Component Naming Convention

Format: `[Module][Component][Variant]` using PascalCase for components, kebab-case for CSS.

- **Component:** `OrderStatusBadge`, `ProductCard`, `ShipmentTimeline`.
- **Variant suffix:** `ButtonPrimary`, `CardFeature`, `BadgeSuccess`.
- **CSS/utility:** `btn-primary`, `card--feature`.
- **Hooks:** `useOrders`, `useAuth`.
- Folder: group by module (`components/orders/OrderStatusBadge.jsx`).

---

# 19 Design Tokens

Single source of truth stored as CSS variables / Tailwind theme extension.

```css
:root {
  /* Color — Navy + Gold (canonical values are OKLCH in app/globals.css) */
  --color-primary: oklch(26% 0.068 258); /* navy */
  --color-primary-hover: oklch(22% 0.064 258);
  --color-accent: oklch(74% 0.11 88); /* gold */
  --color-bg: #ffffff;
  --color-bg-subtle: #f9fafb;
  --color-surface: #ffffff;
  --color-border: #e5e7eb;
  --color-text-primary: #111827;
  --color-text-secondary: #4b5563;
  --color-text-muted: #9ca3af;
  --color-success: #16a34a;
  --color-warning: #d97706;
  --color-error: #dc2626;
  --color-info: oklch(26% 0.068 258);

  /* Typography */
  --font-sans: 'Inter', system-ui, sans-serif;
  --text-display: 40px/1.1 700;
  --text-body: 14px/1.5 400;

  /* Spacing */
  --space-2: 8px;
  --space-4: 16px;
  --space-6: 32px;

  /* Radius */
  --radius-md: 8px;
  --radius-lg: 12px;

  /* Elevation */
  --shadow-card: 0 1px 2px rgba(16, 24, 40, 0.04);
  --shadow-dialog: 0 20px 25px -5px rgba(16, 24, 40, 0.12);

  /* Motion */
  --duration-fast: 150ms;
  --duration-base: 200ms;
  --ease-out: cubic-bezier(0.2, 0, 0, 1);
}
```

These tokens map directly to Tailwind theme extensions (`colors`, `spacing`, `borderRadius`, `boxShadow`, `fontFamily`, `fontSize`) and shadcn/ui CSS variables.

---

# 20 UI Rules (30+)

1. Never use more than two primary buttons on one screen.
2. Every screen has exactly one obvious primary action.
3. Tables must always support search.
4. Forms must display inline validation (never submit-only).
5. Cards should use consistent spacing and radius.
6. Navigation should remain predictable and persistent.
7. Always use semantic status badges; never raw color alone.
8. Destructive actions always require confirmation.
9. Money always displayed with currency symbol and correct precision.
10. Never disable the page for partial loading; use skeletons.
11. Empty states must explain and offer a next action.
12. All interactive elements meet 44px mobile touch target.
13. Keep primary CTAs in the same location across pages.
14. Use tabular figures for all numeric columns.
15. No more than two levels of nesting in navigations.
16. Icons must be consistent in stroke and size per context.
17. Focus states must always be visible; never remove outlines blindly.
18. Labels must be visible; never rely on placeholders as labels.
19. Every modal must trap focus and close on `Esc`.
20. Toasts must not block the page and auto-dismiss (except errors).
21. Use consistent spacing tokens; no arbitrary pixel values.
22. Charts must have accessible data fallback.
23. Long lists must paginate or use infinite scroll with a clear count.
24. Confirmation dialogs state the object being acted on explicitly.
25. Never use color alone to convey status, error, or success.
26. Reuse design-system components; no bespoke one-off patterns.
27. Loading states must not cause layout shift.
28. Buttons change appearance per state (hover/pressed/disabled).
29. Keep text left-aligned and numeric columns right-aligned in tables.
30. Respect `prefers-reduced-motion` — disable decorative motion.
31. Provide a visible "Back" or breadcrumb on every detail page.
32. Error messages must be specific and propose a next step.
33. Form fields validate on blur and show inline helper text.
34. Every screen must be responsive from mobile to desktop.
35. Use only brand-approved colors and gradients.

---

# Design Manifesto

**Africhina Connect is built on trust.** Every pixel exists to make a cross-border transaction feel safe, clear, and effortless.

We design for **professionals in motion** — importers, logistics officers, admins, and support staff who move fast and need certainty. Our interface is **quiet, precise, and premium**: generous whitespace, one accent, dense-but-scannable dashboards, and motion that never distracts.

We believe **clarity is a feature**. The user should always know where they are, what the platform is doing, and what happens next — from a product view to an escrow release to a shipment at customs. We show status honestly, handle money with care, and guide every action with a single, obvious path.

We follow **one system, everywhere**. No bespoke patterns, no visual surprises. Consistency is what makes the platform feel institutional and trustworthy — because in trade, predictability is credibility.

We design with **restraint and respect** — accessible contrast, calm motion, and mobile-first responsiveness. The interface stays out of the way so the work can get done.

This is the design language of a **modern trade partner**: minimal, corporate, trustworthy, and premium. Every future screen will uphold this standard.

---

_End of Design System — Sprint 0.5._
