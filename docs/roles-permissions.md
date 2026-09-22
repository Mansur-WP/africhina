# Africhina Connect — User Roles & Permissions

**Version:** 1.0
**Status:** Draft (Sprint 0)

---

## 1. Roles

| Role               | Code        | Description                             |
| ------------------ | ----------- | --------------------------------------- |
| Guest              | `guest`     | Unauthenticated visitor                 |
| Buyer / Importer   | `buyer`     | Nigerian importer sourcing goods        |
| Supplier           | `supplier`  | Verified Chinese seller                 |
| Logistics Partner  | `logistics` | Updates shipping/customs milestones     |
| Configurator Agent | `agent`     | Helps buyers source; tracks commissions |
| Admin              | `admin`     | Platform operations & moderation        |

---

## 2. Permission Matrix

Legend: **C** = Create, **R** = Read, **U** = Update, **D** = Delete, **—** = No access

### Profile & Auth

| Permission         | Guest | Buyer | Supplier | Logistics | Agent | Admin |
| ------------------ | ----- | ----- | -------- | --------- | ----- | ----- |
| Register/Login     | C     | —     | —        | —         | —     | —     |
| Manage own profile | —     | CRUD  | CRUD     | CRUD      | CRUD  | CRUD  |
| Manage all users   | —     | —     | —        | —         | —     | CRUD  |

### Products & Catalog

| Permission                 | Guest | Buyer | Supplier | Logistics | Agent | Admin |
| -------------------------- | ----- | ----- | -------- | --------- | ----- | ----- |
| Browse/search products     | R     | R     | R        | R         | R     | R     |
| Create/update own products | —     | —     | CRUD     | —         | —     | CRUD  |
| Moderate products          | —     | —     | —        | —         | —     | CRUD  |

### RFQ & Quotations

| Permission             | Guest | Buyer | Supplier | Logistics | Agent | Admin |
| ---------------------- | ----- | ----- | -------- | --------- | ----- | ----- |
| Create RFQ             | —     | C     | —        | —         | C     | C     |
| Respond with quotation | —     | —     | C        | —         | —     | —     |
| Accept quotation       | —     | C     | —        | —         | C     | —     |

### Orders & Escrow

| Permission       | Guest | Buyer | Supplier | Logistics | Agent | Admin |
| ---------------- | ----- | ----- | -------- | --------- | ----- | ----- |
| Create order     | —     | C     | —        | —         | C     | C     |
| View own orders  | —     | R     | R        | R         | R     | R     |
| View all orders  | —     | —     | —        | —         | —     | R     |
| Initiate payment | —     | C     | —        | —         | —     | C     |
| Release escrow   | —     | C     | C        | —         | —     | C     |
| Refund           | —     | —     | —        | —         | —     | C     |

### Shipping & Customs

| Permission                 | Guest | Buyer | Supplier | Logistics | Agent | Admin |
| -------------------------- | ----- | ----- | -------- | --------- | ----- | ----- |
| Update shipment milestones | —     | —     | —        | CRUD      | —     | CRUD  |
| Upload shipping docs       | —     | R     | C        | C         | R     | CRUD  |

### Disputes

| Permission      | Guest | Buyer | Supplier | Logistics | Agent | Admin |
| --------------- | ----- | ----- | -------- | --------- | ----- | ----- |
| Raise dispute   | —     | C     | C        | —         | C     | C     |
| Resolve dispute | —     | —     | —        | —         | —     | CRUD  |

### Admin/Platform

| Permission           | Guest | Buyer | Supplier | Logistics | Agent | Admin |
| -------------------- | ----- | ----- | -------- | --------- | ----- | ----- |
| Verify suppliers     | —     | —     | —        | —         | —     | CRUD  |
| View analytics/KPIs  | —     | —     | —        | —         | —     | R     |
| Manage notifications | —     | R     | R        | R         | R     | CRUD  |

---

## 3. Role Hierarchies & Constraints

- **Buyer** and **Supplier** are mutually exclusive per account (a user selects one primary role).
- **Agent** can create RFQs/orders on behalf of a buyer but cannot release escrow alone.
- **Admin** inherits all permissions.
- **Logistics** is scoped to shipment/customs workflows only.

---

## 4. Enforcement Strategy

- **UI layer:** conditionally render UI based on `session.user.role`.
- **API layer (authoritative):** server-side guard/permission middleware on every route handler that uses the session role — never trust client state.
- **DB layer:** scoping queries by the requesting user's id/role to prevent horizontal privilege escalation.

---

## 5. Default Role Assignment

- New self-registered users default to `buyer`.
- Supplier role requires onboarding + admin verification.
- Logistics & admin roles are assigned only by an admin.
- Agent role is provisioned by admin after contract/approval.
