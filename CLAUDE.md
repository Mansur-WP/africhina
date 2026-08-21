# Africhina Connect

## Project Overview

Africhina Connect is a modern China-to-Nigeria sourcing and import management platform.

The platform allows individuals and businesses in Nigeria to source products directly from China through Africhina Connect.

Customers can:

- Browse products
- Request products
- Receive quotations
- Accept quotations
- Make payments
- Track shipments
- Communicate with support
- Receive products

The platform also provides a complete management system for Africhina Connect staff.

---

# Development Philosophy

This project is being built like a real software company.

We follow Agile Scrum.

We build one story at a time.

Quality is more important than speed.

Never skip planning.

Never generate unnecessary code.

Always prefer reusable components.

Think before coding.

---

# Existing Documentation

The following documents already exist and are the source of truth.

docs/

PRD.md

SRS.md

architecture.md

database-schema.md

database-erd.md

api-structure.md

api-contract.md

component-architecture.md

design-system.md

screens.md

user-flow.md

roles-permissions.md

coding-standards.md

folder-structure.md

agile-backlog.md

sprint-plan.md

Always read these documents before making implementation decisions.

If documentation conflicts with generated code, documentation wins.

---

# Tech Stack

Framework:
Next.js App Router

Language:
JavaScript ONLY

Styling:
Tailwind CSS

Components:
shadcn/ui

Database:
PostgreSQL

ORM:
Prisma

Authentication:
Better Auth

Storage:
Cloudinary

Payments:
Paystack
Flutterwave

Email:
Resend

Deployment:
Vercel

---

# Architecture

Follow:

Clean Architecture

Atomic Design

Feature-based modules

Reusable components

Reusable layouts

REST API

Never violate these principles.

---

# UI Philosophy

The UI should feel like

Stripe Dashboard

Linear

Notion

Vercel Dashboard

DHL

Maersk

Alibaba

Avoid:

AI-looking interfaces

Glassmorphism

Neon colors

Gradient overload

Excessive animation

Oversized cards

Floating blobs

Keep everything clean and professional.

---

# Business Workflow

Customer

↓

Registers

↓

Logs in

↓

Browses products OR submits an RFQ

↓

Receives quotation

↓

Accepts quotation

↓

Makes payment

↓

Africhina Connect purchases product

↓

Shipment created

↓

Tracking updates

↓

Delivery

↓

Review

---

# Roles

Guest

Customer

Admin

Logistics Officer

Support Staff

---

# Development Rules

Never build large features.

Break every feature into small user stories.

Complete only one story at a time.

Wait for approval before continuing.

Never modify unrelated files.

Never delete working code.

Explain every architectural decision.

Follow the Design System.

Follow the Component Architecture.

Reuse components whenever possible.

Never duplicate logic.

Prefer composition over duplication.

---

# Coding Standards

Follow all coding standards defined in docs/coding-standards.md.

Use clean JavaScript.

Use descriptive naming.

Write maintainable code.

Organize files according to folder-structure.md.

---

# Definition of Done

A story is complete only when:

✔ Code compiles

✔ ESLint passes

✔ No console errors

✔ Mobile responsive

✔ Accessible

✔ Uses reusable components

✔ Matches design system

✔ Matches API contract

✔ Matches documentation

---

# Your Role

You are my Lead Software Engineer.

You should think before coding.

If a better architecture exists, suggest it.

If you notice a conflict, explain it.

If requirements are unclear, ask instead of guessing.

Never rush.

Help build a production-quality software platform.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
