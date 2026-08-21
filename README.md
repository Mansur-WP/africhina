# Africhina Connect

Modern China-to-Nigeria sourcing and import management platform.

Africhina Connect lets individuals and businesses in Nigeria source products
directly from China: browse or request products, receive and accept quotations,
pay securely, and track shipments end to end — with a full management system for
staff.

> **Status:** early foundation. Features are built one user story at a time.
> Project instructions live in [`CLAUDE.md`](CLAUDE.md); the authoritative
> product/architecture docs live in [`docs/`](docs).

## Tech Stack

- **Framework:** Next.js (App Router) — JavaScript only
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** PostgreSQL (Neon in production) via Prisma ORM
- **Auth:** Better Auth · **Storage:** Cloudinary · **Email:** Resend
- **Payments:** Paystack, Flutterwave · **Deploy:** Vercel

## Getting Started

### Prerequisites

- Node.js 20+ (the project is developed on Node 24)
- A PostgreSQL database — a local instance for development, or a
  [Neon](https://neon.tech) project for staging/production

### Install

```bash
npm install
```

`postinstall` runs `prisma generate` automatically, so the Prisma Client is
always in sync with the schema.

### Configure environment

Copy the template and fill in real values:

```bash
cp .env.example .env
```

`.env` is git-ignored and is read by both Next.js and the Prisma CLI. See
[Database setup](#database-setup) for the connection strings.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Database setup

The schema lives in [`prisma/schema.prisma`](prisma/schema.prisma). It uses two
connection strings so it works identically on a pooled cloud database and a
local one:

| Variable              | Used by                            | Notes                                        |
| --------------------- | ---------------------------------- | -------------------------------------------- |
| `DATABASE_URL`        | The app at runtime                 | Pooled connection (Neon `-pooler` host)      |
| `DIRECT_DATABASE_URL` | Prisma CLI (migrations/introspect) | Direct connection (Neon host without pooler) |

### Local PostgreSQL (development)

Both URLs point at your local database (there is no pooler locally):

```env
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/africhina_dev?schema=public"
DIRECT_DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/africhina_dev?schema=public"
```

Create the database once (any Postgres client), then apply migrations:

```bash
npm run prisma:migrate
```

### Neon (production / staging)

Neon exposes a **pooled** host (contains `-pooler`) and a **direct** host. Use
the pooled host for `DATABASE_URL` and the direct host for
`DIRECT_DATABASE_URL`, both with `sslmode=require`:

```env
DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx-pooler.REGION.aws.neon.tech/DB?sslmode=require&connect_timeout=15"
DIRECT_DATABASE_URL="postgresql://USER:PASSWORD@ep-xxxx.REGION.aws.neon.tech/DB?sslmode=require&connect_timeout=15"
```

> **Cold starts:** Neon suspends the compute when idle, so the first connection
> after a pause can exceed Prisma's default 5s timeout and fail with `P1001`.
> `connect_timeout=15` gives the compute time to wake — just retry once if the
> very first command still times out.

Apply migrations to a deployed database with:

```bash
npm run prisma:deploy
```

### Prisma commands

| Command                   | Purpose                                    |
| ------------------------- | ------------------------------------------ |
| `npm run prisma:generate` | Regenerate the Prisma Client               |
| `npm run prisma:migrate`  | Create & apply a migration in development  |
| `npm run prisma:deploy`   | Apply pending migrations (CI / production) |
| `npm run prisma:studio`   | Open Prisma Studio to browse data          |

Import the shared client from [`lib/prisma.js`](lib/prisma.js) — never construct
`new PrismaClient()` directly in feature code:

```js
import { prisma } from '@lib/prisma';
```

## Scripts

| Command                | Description                      |
| ---------------------- | -------------------------------- |
| `npm run dev`          | Start the dev server             |
| `npm run build`        | Production build                 |
| `npm run start`        | Serve the production build       |
| `npm run lint`         | Run ESLint                       |
| `npm run format`       | Format with Prettier             |
| `npm run format:check` | Check formatting without writing |

## Project structure

See [`docs/folder-structure.md`](docs/folder-structure.md). In short: Clean
Architecture in `src/` (`domain` → `application` → `infrastructure` → `shared`),
Atomic Design in `components/`, routes in `app/`, and shared client utilities in
`lib/`.
