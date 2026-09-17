# Africhina Connect V2 Architecture Audit

**Baseline:** v1.0.0 implementation under development toward v2.0.0-refactor  
**Audit date:** 2026-09-17  
**Scope:** Read-only inspection of the active Next.js, application, domain, infrastructure, Prisma schema, routes, and tests.  
**Validation:** Existing `npm test` suite: 126 passing, 0 failing. Tests are primarily pure validation/rules/policy tests; they do not prove live payment, webhook, procurement, or Prisma transaction behavior.

## 1. Executive Summary

The repository is a partially implemented modular monolith, not yet the end-to-end sourcing and commerce architecture described by the v1 documentation. The active customer path is catalogue browsing -> RFQ -> admin quotation -> quotation acceptance -> draft order -> checkout confirmation. A cart, direct product purchase, payment initialization, provider verification, webhook processing, procurement workflow, supplier workflow, and fulfillment/shipping workflow are not implemented in the active application code.

The most important V2 conclusion is that there are currently two intended business models but only one executable model:

- **Available product purchase:** not executable as a direct purchase. Public catalogue products are explicitly labeled “Available for sourcing,” and the product UI sends customers to RFQ creation. No cart or add-to-cart route exists.
- **Sourcing/procurement purchase:** partially executable through RFQ, admin-created quotation, quotation acceptance, order creation, and checkout status transition. It stops at `pending_payment`.

The highest risks are:

1. Payment is structurally modeled but operationally absent. Checkout claims payment is pending without creating a `Payment`, calling a provider, verifying a provider response, or processing a webhook.
2. The order is coupled to quotation acceptance. `acceptQuotation()` calls order creation, and the order transaction can mutate quotation state and create order records together.
3. Reference generation uses count-plus-one outside a protective uniqueness strategy. RFQ and quotation reference generation can collide under concurrency.
4. The order transaction performs state mutation and order creation, but post-commit hydration, notifications, and duplicate recovery add extra queries and can return mixed snapshots.
5. The code and documentation disagree materially about Better Auth, repository boundaries, supplier roles, payment flow, and fulfillment.
6. The schema contains Payment, Escrow, Shipment, Invoice, Supplier, and related entities, but there are no active use cases/routes for the payment and fulfillment lifecycles.

V2 should keep a modular monolith, but split customer purchase from sourcing procurement at the application/use-case boundary. Orders should be created from a priced purchase intent or accepted quotation, while payment and fulfillment should react to durable order/payment state transitions through idempotent commands and asynchronous work.

## 2. Current Architecture

### Active layers

- **Presentation:** Next.js App Router pages, client components, and route handlers under `app/` and `components/`.
- **Application:** Feature services under `src/application/`, especially `products/productService.js`, `orders/orderService.js`, `rfqs/rfqService.js`, `rfqs/quotationService.js`, `auth/authService.js`, and `notifications/notificationService.js`.
- **Domain:** Small pure rule modules, currently concentrated in `src/domain/orders/orderRules.js` and quotation rules under `src/application/rfqs/quotationRules.js`.
- **Infrastructure:** Prisma singleton, session/token managers, environment config, and email adapter. The documented database repository and payment adapter boundaries are not implemented.
- **Persistence:** PostgreSQL through Prisma. The schema has a broad business model, but active code covers only a subset.

### Architectural observations

- Application services import Prisma directly, contrary to `src/application/README.md` and `docs/architecture.md`, which specify injected repository interfaces.
- Route handlers and server pages both call application services directly. This is workable for a modular monolith, but authorization and serialization are repeated at multiple presentation entry points.
- `quotationService.js` imports `createOrderFromAcceptedQuotation` from `orderService.js`; this is a direct cross-feature dependency that makes quotation acceptance own order creation.
- `orderService.js` imports notification delivery and performs notification fan-out after state changes. This creates synchronous coupling to notification persistence.
- `src/application/payments/`, `src/application/suppliers/`, `src/infrastructure/payments/`, and several domain folders are declared by README files but have no active implementation found in the audit.

## 3. Customer Flow

### Catalogue browsing

1. `app/catalogue/page.js` parses URL query parameters and calls `listProducts()`.
2. `src/application/products/productService.js` executes `product.count` and `product.findMany` in parallel.
3. The list query restricts records to `status: 'active'` and `deletedAt: null`, includes full `category` and `images` relations, then maps to a public shape.
4. `components/catalogue/ProductGrid.jsx` renders `ProductCard` items.
5. `ProductCard` links to `/catalogue/:id`, not to a cart action.
6. The product detail page and `app/api/v1/products/[id]/route.js` use `getActiveProductById()` with category/images.
7. The product page routes the customer toward RFQ creation. Product availability is deliberately described as sourcing availability, not physical stock.

### Cart

No cart model, service, API route, page, client state, cookie state, or persistence path was found. The active application has no cart behavior to audit.

### Customer RFQ entry point

`components/rfq/RfqForm.jsx` POSTs to `/api/v1/rfqs`. The route authenticates the session, requires role `buyer`, validates with `createRfqSchema`, then calls `createRfq(user.id, parsed.data)`. A catalogue product is rechecked for active/non-deleted status before the RFQ is created.

## 4. Admin Flow

### RFQ operations

- `/admin/rfqs` calls `listAllRfqsAdmin()`.
- `/admin/rfqs/:id` calls `getAdminRfqById()`.
- Admin creates a quotation through `POST /api/v1/admin/rfqs/:id/quotations`.
- Admin edits drafts through `PATCH /api/v1/admin/quotations/:id`.
- Admin sends through `POST /api/v1/admin/quotations/:id/send`.
- `QuotationForm.jsx` implements “Save & Send” as two sequential HTTP requests: create/update, then send.

### Order operations

Admin list/detail pages call `listAdminOrders()` and `getAdminOrder()`. The active admin order route is read-only. No active admin order status mutation route was found, despite the schema and documentation describing status advancement, cancellation, refunds, and shipment overrides.

### Admin query behavior

Admin list pages use count plus paginated findMany in parallel, but the records include buyer, supplier, quotation, items, and product summaries through the shared `orderInclude()`. This is convenient but broad for a list view and should be replaced by endpoint-specific projections in V2.

## 5. Order Flow

### Order creation

The only active order creation function is `createOrderFromAcceptedQuotation()` in `src/application/orders/orderService.js`.

- It starts a Prisma interactive transaction.
- It loads the quotation scoped through `rfq.buyerId` and `rfq.deletedAt`.
- If quotation status is `sent`, it checks expiry and updates the quotation to `accepted` inside the transaction.
- If it is already `accepted`, it validates expiry and continues.
- It creates an order with a generated order number, buyer, supplier, quotation, draft status, copied quotation financial fields, total, and currency.
- It creates order items with `createMany`.
- The transaction returns the new order id and order number.
- After commit, it creates a buyer notification, reloads quotation and order in parallel, maps the order, and returns it.

`Order.quotationId` is unique, so concurrent duplicate order creation can produce `P2002`; the catch block then performs additional reads and returns the existing order if found.

### Order acceptance

There is no separate active “order acceptance” business action. The closest operation is quotation acceptance. `POST /api/v1/quotations/:id/accept` calls `acceptQuotation()`, which calls order creation and therefore combines quotation acceptance and order creation. The resulting order is `draft`, not paid or accepted in an independent order state.

### Checkout

`POST /api/v1/orders/:id/checkout` calls `confirmOrderCheckout()`.

- It first reads the entire order with `orderInclude()`.
- It returns immediately if already `pending_payment`.
- It requires `draft`.
- It uses a conditional `updateMany` with `status: 'draft'` to transition to `pending_payment`.
- On a lost race, it reloads the customer order and accepts the result only if it is already `pending_payment`.
- It reloads the full order with `findUnique`.
- It writes a buyer notification and fans out admin notifications.
- It returns the order.

There is no payment creation in this path. The UI message “proceeding to payment” is aspirational; the actual endpoint only changes an order status.

## 6. Payment Flow

### Implemented behavior

No active payment initialization, provider adapter, verification service, webhook route, signature verifier, reconciliation worker, refund route, or payment query endpoint was found.

The Prisma schema contains `Payment`, `PaymentProvider`, `PaymentStatus`, and `Invoice`, and the documentation describes Paystack/Flutterwave integration, but no active code creates or updates Payment records.

### Consequences

- `Order.paymentStatus` in the public mapper is derived from `order.status === 'pending_payment'`, not from a Payment record.
- There is no provider reference or idempotency key at checkout.
- There is no authoritative provider amount/currency comparison.
- There is no webhook replay protection or event deduplication.
- `paid`, `failed`, `refunded`, `escrow`, and invoice behavior are unreachable through the active API.

## 7. RFQ/Quotation Flow

### RFQ creation

`POST /api/v1/rfqs` -> `createRfq()`:

1. Validate buyer role and body.
2. If `productId` is present, query active/non-deleted Product.
3. Generate reference by counting RFQs in the current year and adding one.
4. Create RFQ and one RFQItem using a nested write.
5. Include the item, product, first image, and category for response mapping.

The product existence check and reference count occur before the RFQ create, so they are not in one transaction.

### Quotation creation

`POST /api/v1/admin/rfqs/:id/quotations` -> `createQuotation()`:

1. Query RFQ and require status `open` or `quoted`.
2. Select the first Supplier in the database without filtering verification status, deletion, or an RFQ-specific supplier assignment.
3. Normalize financials, including a legacy `price` compatibility path.
4. Count quotations in the current year to generate a reference.
5. Create a draft quotation with nested response includes.

The RFQ status is not updated to `quoted` by `createQuotation()`, despite the state model suggesting that it should be.

### Quotation sending

`sendQuotation()` reads the quotation with a broad include, validates draft/future expiry, updates status to `sent`, then creates a buyer notification. The update and notification are separate operations; retries can repeat notifications.

### Quotation acceptance

`POST /api/v1/quotations/:id/accept` -> `acceptQuotation()` -> `createOrderFromAcceptedQuotation()`:

- The order transaction accepts a `sent` quotation and creates the order.
- Afterward the service reloads the quotation and conditionally notifies admins.
- The customer receives the order from the acceptance response.

There is no explicit RFQ transition to `accepted` in the active `acceptQuotation()` path. The RFQ may remain in its prior status.

## 8. Procurement Flow

No active supplier portal, supplier assignment workflow, purchase order, sourcing task, supplier quote exchange, procurement status machine, or procurement API was found.

The current approximation is:

`RFQ -> admin selects the first Supplier record -> quotation -> buyer accepts -> Order with supplierId`

This is not a real procurement workflow. Supplier selection is implicit and non-deterministic when multiple suppliers exist. There is no supplier verification gate, supplier response, purchase order, supplier confirmation, or exception handling.

## 9. Current Database Interaction

### Read patterns

- List endpoints commonly execute `count` and `findMany` in parallel, producing two database queries per list request.
- Detail endpoints use broad `include` trees rather than endpoint-specific `select` projections.
- `orderInclude()` always includes buyer, supplier, quotation, items, and product summaries, even for flows that only need status or totals.
- Quotation list/detail reads include RFQ buyer and first item product/category/image data.
- Admin RFQ detail loads full buyer and quotation records and up to three product images.

### Writes and transactions

- RFQ create uses one Prisma nested write, but validation and reference generation happen before it.
- Quotation create is one create, but eligibility, supplier selection, and reference generation are separate queries.
- Order creation is the only observed interactive transaction. It performs quotation read, possible quotation update, order create, and order item create.
- Checkout performs read -> conditional update -> read, without a transaction; its conditional update gives useful race protection but leaves notification work outside the state mutation.
- Notification fan-out performs one admin lookup and one insert per recipient via `Promise.all`; this is synchronous request work and is not durable event processing.

### Reference generation

Both `generateReferenceNumber()` and `generateQuotationReferenceNumber()` use count-plus-one. The comments claim race protection for RFQs, but the implementation shown does not wrap the count and create in a transaction or use a database sequence/atomic counter. Quotation reference generation is also outside the create transaction. Unique constraints convert collisions into errors rather than preventing them.

## 10. Performance Risks

- **High:** `orderInclude()` is reused for list, detail, precondition, and post-transition reads, causing unnecessary joins/row materialization.
- **High:** Quotation and RFQ services include nested buyer/product/category/image data for list and mutation responses when many callers need only identifiers and status.
- **Medium:** `count + findMany` doubles database calls for every paginated list and can become expensive under high traffic. Cursor pagination is preferable for time-ordered operational lists.
- **Medium:** Admin notification fan-out performs synchronous per-recipient inserts after checkout and quotation events. Large admin groups increase request latency and failure surface.
- **Medium:** The order acceptance path does a transaction, then two post-commit queries, plus notifications. This is acceptable at low volume but expensive and makes response assembly depend on additional database availability.
- **Medium:** Admin RFQ search is local filtering of one fetched page, so it cannot search the full dataset and encourages repeated page fetches.
- **Medium:** Product search uses case-insensitive contains filters; without appropriate PostgreSQL indexes/full-text search, catalogue scale will degrade.
- **Low:** Catalogue list count and page query are correctly parallelized, but the count is still unnecessary for infinite-scroll or cursor-based customer browsing.

## 11. Complexity Risks

- Quotation acceptance owns order creation, creating circular business ownership between RFQ/Quotation and Order modules.
- Application services directly import Prisma despite documented repository boundaries, making unit isolation and future storage changes harder.
- Legacy quotation input supports both `price` and seven component fields, increasing compatibility branches and business ambiguity.
- Public order/payment state is derived from order status while the schema separately models Payment, allowing state divergence.
- The codebase has duplicate server-side role checks in proxy, route handlers, and pages. Defense in depth is appropriate, but policy definitions are duplicated rather than centralized as reusable guards.
- Notification persistence is embedded inside feature services instead of being emitted as domain/application events.
- Several READMEs describe services and adapters that do not exist, creating false architectural affordances.

## 12. Security/Reliability Risks

### Findings

- **Critical:** No payment/webhook path exists. The documented payment security guarantees are not present in the active system.
- **High:** Checkout does not bind a payment amount, currency, provider, or idempotency key to the transition.
- **High:** `createQuotation()` picks the first Supplier without filtering `verificationStatus`, `deletedAt`, or business assignment. This can associate a quote with an unverified or deleted supplier.
- **High:** RFQ and quotation reference generation can race. Unique constraints prevent duplicate persisted values but can cause avoidable 500s and failed customer submissions.
- **High:** Quotation acceptance is not an atomic conditional status update. The transaction reads status, then updates a `sent` quotation. Concurrent acceptance is partially protected by unique `Order.quotationId`, but one request may still perform a state update before the duplicate-order recovery path.
- **Medium:** `sendQuotation()` updates state and notifies separately. A successful state update followed by notification failure returns an error/retry opportunity that can duplicate side effects.
- **Medium:** Registration accepts a client-supplied role after schema validation. The current UI sends `buyer`, but the service looks up and accepts the supplied role. The documented policy says supplier/admin provisioning is restricted. This is a privilege-escalation risk if the validator permits privileged role values.
- **Medium:** Password reset and email verification read a token, update user state, then delete the token in separate operations. A concurrent replay may race between these operations.
- **Medium:** Login/session reads include full related role records and session manager retries a failed session read once, which can mask database instability without observability.
- **Medium:** No visible rate-limiting or CSRF enforcement is implemented in the active route handlers, despite the API contract requiring both.
- **Low:** Error handlers expose `error.message` directly in API responses. Some messages are intentional business errors, but unexpected database/provider messages should be normalized and logged server-side.

## 13. KEEP

- [app/api/v1/products/route.js](app/api/v1/products/route.js): public query validation and whitelisted sort behavior.
- [src/application/products/productService.js](src/application/products/productService.js): public data minimization and active/non-deleted visibility rules, with narrower projections planned later.
- [src/shared/lib/authorization.js](src/shared/lib/authorization.js): centralized path policy as the basis for a reusable authorization layer.
- [proxy.js](proxy.js): early request rejection and redirect behavior as defense in depth.
- [src/domain/orders/orderRules.js](src/domain/orders/orderRules.js): pure order eligibility and quotation snapshot rules, after aligning them with one canonical state machine.
- Conditional `updateMany` in checkout: the compare-and-set pattern is useful for concurrency, though it should be part of a stronger checkout/payment command.
- Money as integer minor units and explicit currency fields in the schema.
- Unique `Order.quotationId`, unique provider reference, and ownership-scoped buyer queries as useful integrity foundations.
- Existing tests for validators, pure rules, and authorization policy.

## 14. REFACTOR

- [src/application/orders/orderService.js](src/application/orders/orderService.js): split order read projections, order creation, checkout intent, payment state handling, and notifications; remove broad includes from command paths.
- [src/application/rfqs/quotationService.js](src/application/rfqs/quotationService.js): separate quotation lifecycle from order creation; use conditional state transitions and explicit supplier selection.
- [src/application/rfqs/rfqService.js](src/application/rfqs/rfqService.js): make reference allocation atomic and reduce list/detail projections.
- [src/shared/lib/authorization.js](src/shared/lib/authorization.js) plus route guards: introduce reusable role/permission assertions rather than repeating role comparisons in every handler.
- `app/api/v1/auth/register/route.js` and `authService.js`: force public self-registration to buyer unless an explicitly authorized provisioning flow is used.
- Notification calls in order and quotation services: publish durable events/outbox records and process notifications asynchronously.
- Payment and order state transitions: establish one state transition authority with conditional updates, audit records, and idempotency keys.

## 15. MOVE

- Prisma access from application services into `src/infrastructure/db/` repositories or query modules, while keeping transaction orchestration at a clearly defined application boundary.
- Provider-specific Paystack/Flutterwave logic into `src/infrastructure/payments/` behind a provider interface.
- Webhook signature validation and payload normalization into payment infrastructure adapters.
- Product/catalogue public projection logic into a dedicated read/query module if catalogue scale requires independent optimization.
- Admin search/filtering into database-backed query methods rather than client-side page filtering.
- Notification fan-out and email work into an asynchronous worker/outbox consumer.
- Supplier and procurement operations into a dedicated procurement module rather than embedding supplier selection in quotation creation.

## 16. SIMPLIFY

- Customer purchase experience: present one simple “request/order” entry point for catalogue products, while internally deciding whether the item is immediate-sale or sourcing-required.
- Replace the current two-step “quotation accepted -> draft order -> checkout confirm” customer experience with an explicit purchase intent/order review command whose next action is payment initialization.
- Use endpoint-specific `select` projections instead of a shared all-purpose `orderInclude()` and broad quotation includes.
- Remove legacy `price` compatibility once the V2 quotation contract is established, or isolate it at the API adapter boundary.
- Use cursor pagination for order, RFQ, quotation, payment, and notification feeds where time ordering is primary.
- Replace count-based human references with database-backed sequences or opaque IDs plus display formatting.
- Make RFQ list search server-side and keep the browser as a view layer, not a search engine.
- Keep advanced procurement state internal; expose customers only the small set of order/payment/shipment states needed for decisions.

## 17. REMOVE

These are not active business implementations and should not be treated as working architecture:

- The assumption that the current catalogue supports direct product purchase. It does not.
- The assumption that checkout means payment has been initialized. It only means the order moved to `pending_payment`.
- Unused/placeholder architectural promises in [src/application/README.md](src/application/README.md) and [src/infrastructure/README.md](src/infrastructure/README.md) once the V2 boundaries are documented accurately.
- Broad relation loading that exists only because one mapper is reused across unrelated screens.
- Synchronous admin notification fan-out from the critical checkout request after an outbox/event path exists.
- Any unverified first-supplier fallback in quotation creation.

No source files were deleted during this audit. “REMOVE” identifies behavior or architectural assumptions recommended for removal in V2.

## 18. INVESTIGATE

- [prisma/schema.prisma](prisma/schema.prisma): whether `stock` is meaningful. The public product service intentionally hides raw inventory, and no reservation/decrement flow exists.
- Payment provider contracts, webhook signing requirements, refund semantics, and provider settlement timing before implementing payment.
- Whether product catalogue items are truly immediately available or all products are sourcing-only. This determines whether V2 needs a direct-sale path or a single sourcing path.
- Supplier verification and assignment rules. The current first-supplier query is not a valid production rule.
- Whether RFQ status must transition to `quoted` and `accepted` when quotations are created/accepted.
- Whether order status should represent fulfillment state only, with Payment as the authoritative payment state.
- Database indexes for active product search, RFQ/admin search, order feeds, quotation feeds, and webhook idempotency lookups.
- Registration validator behavior for privileged role values.
- CSRF and rate-limit enforcement at deployment/runtime, because neither is visible in the audited route code.
- Runtime database transaction duration and query counts under representative load; static inspection cannot measure them.
- Existing migrations and production data constraints before any V2 schema change. This audit intentionally created no migration.

## 19. Recommended V2 Architecture

### Core shape

Keep a modular monolith with explicit use cases and narrow query projections:

```text
Next.js routes/pages
        |
        v
Application commands and queries
        |
        +--> Catalogue read model
        +--> Purchase/order module
        +--> Payment module
        +--> Procurement module
        +--> Fulfillment module
        +--> Identity/access module
        |
        v
Repositories / transaction boundary / outbox
        |
        +--> PostgreSQL
        +--> Payment provider adapters
        +--> Notification workers
```

### Customer purchase model

1. Customer selects a catalogue item and quantity.
2. V2 creates a purchase intent or draft order from a server-side product snapshot.
3. The system classifies it as immediate-sale or sourcing-required using an explicit product/business policy, not UI wording.
4. Customer reviews a single price and delivery summary.
5. Payment initialization creates one idempotent payment attempt keyed by order and client request idempotency key.
6. Provider redirect/SDK completes payment.
7. Webhook verification is authoritative, idempotent, and persists the raw event plus normalized outcome.
8. Order transitions to `paid` only after verified payment amount/currency/order binding.

### Procurement model

Keep RFQ and quotation for advanced internal sourcing:

```text
Customer request
  -> Purchase/RFQ intent
  -> Procurement case
  -> Supplier assignment
  -> Supplier quote(s)
  -> Internal approval / customer offer
  -> Customer acceptance
  -> Order snapshot
  -> Payment
  -> Fulfillment
```

Quotation acceptance should emit an `OfferAccepted` command/event. Order creation should consume the accepted offer snapshot, but quotation service should not directly call order service. Supplier assignment, verification, and quote selection should be explicit procurement responsibilities.

### State ownership

- **Order:** commercial and fulfillment lifecycle.
- **Payment:** provider/payment lifecycle; never infer payment from order status.
- **Procurement case/RFQ:** sourcing lifecycle.
- **Quotation/offer:** pricing offer lifecycle.
- **Shipment:** logistics lifecycle.

All transitions should be conditional updates with an allowed-transition table, actor authorization, timestamps, and idempotency semantics. Cross-module side effects should be emitted after the database commit through an outbox.

### Query strategy

- Use explicit `select` projections per use case.
- Use cursor pagination for operational feeds.
- Use database-backed filters and search.
- Avoid count queries unless the UI truly needs totals.
- Keep transaction bodies limited to authoritative state changes and required records; never call external providers or notifications inside a database transaction.

## 20. Recommended Migration Strategy

1. **Baseline and contracts:** Freeze the current v1 behavior, document actual routes, and define V2 state machines for Order, Payment, Procurement, Quotation, and Shipment.
2. **Access and projection foundation:** Centralize authorization assertions, add query projections, and measure query count/latency for catalogue, RFQ, quotation, order, and checkout endpoints.
3. **Separate quotation/order ownership:** Introduce an application command for accepted offers and remove the direct quotation-service-to-order-service dependency while preserving the existing API response shape.
4. **Implement payment safely:** Add idempotent payment initialization, provider adapters, webhook verification, event storage/deduplication, amount/currency checks, and payment-to-order transitions. Do not mark orders paid from a browser redirect alone.
5. **Add outbox/async work:** Move notifications and emails out of request-critical paths; preserve retry and deduplication behavior.
6. **Implement procurement explicitly:** Add supplier assignment, verification, sourcing tasks, supplier quotations, and internal procurement states. Keep the customer-facing flow small.
7. **Implement fulfillment:** Add shipment commands, logistics authorization, shipment events, and order/fulfillment synchronization.
8. **Unify customer experience:** Decide whether catalogue items are direct-sale, sourcing-only, or policy-dependent. Add cart only if multi-item direct purchase is a real requirement; otherwise use a single purchase intent to avoid unnecessary cart complexity.
9. **Compatibility and rollout:** Keep v1 routes as adapters while V2 commands become canonical. Use feature flags for payment, direct purchase, and procurement transitions; backfill only after data invariants are defined.
10. **Verification:** Add integration tests against a test database for concurrency, duplicate acceptance, duplicate checkout, payment webhook replay, amount mismatch, authorization/IDOR, and failure recovery. Add load measurements for list/detail projections and transaction duration.

## Classification Summary

| Area/file                                                                                      | Classification          | Reason                                                                                                                     |
| ---------------------------------------------------------------------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| `app/api/v1/products/*`, `productService.js`                                                   | KEEP / REFACTOR         | Correct public visibility and validation; narrow projections and direct-purchase policy still needed.                      |
| `app/api/v1/rfqs/*`, `rfqService.js`                                                           | REFACTOR                | Working buyer ownership and validation, but reference generation, status transitions, and includes need correction.        |
| `app/api/v1/quotations/*`, `quotationService.js`                                               | REFACTOR / MOVE         | Working admin/customer lifecycle, but order coupling, supplier fallback, notification coupling, and broad reads are risky. |
| `app/api/v1/orders/*`, `orderService.js`                                                       | REFACTOR                | Main executable order path; needs payment separation, command/query split, and transaction/idempotency hardening.          |
| `app/api/v1/admin/orders/*`                                                                    | SIMPLIFY / REFACTOR     | Read-only today despite broader documented admin workflow; use focused operational commands.                               |
| `src/domain/orders/orderRules.js`                                                              | KEEP / REFACTOR         | Useful pure rules; expand into canonical transition policy.                                                                |
| `src/shared/lib/authorization.js`, `proxy.js`                                                  | KEEP / REFACTOR         | Good policy foundation; centralize reusable guards and close CSRF/rate-limit gaps.                                         |
| `src/application/auth/authService.js`, session/token managers                                  | REFACTOR                | Core auth exists, but registration role provisioning and token atomicity need hardening.                                   |
| `src/application/notifications/*`                                                              | MOVE / SIMPLIFY         | Move side effects behind outbox/worker; retain ownership-safe queries.                                                     |
| `src/application/payments/*`                                                                   | INVESTIGATE / IMPLEMENT | Declared but absent; payment is a release-blocking capability.                                                             |
| `src/application/suppliers/*`, `src/infrastructure/payments/*`                                 | INVESTIGATE / IMPLEMENT | Declared placeholders with no active workflow.                                                                             |
| `prisma/schema.prisma`                                                                         | INVESTIGATE             | Broad schema supports future capabilities but contains unreachable models and needs state/index review before V2 changes.  |
| `src/*/README.md`, v1 architecture docs                                                        | SIMPLIFY / UPDATE       | Useful intent, but must distinguish planned architecture from active implementation.                                       |
| `components/catalogue/*`, `components/rfq/*`, `components/quotations/*`, `components/orders/*` | KEEP / SIMPLIFY         | Existing UI supports current flows; customer journey should be reduced to one clear purchase/request path.                 |
| `test/*`                                                                                       | KEEP / EXTEND           | 126 baseline tests pass; add database-backed concurrency, payment, webhook, and fulfillment tests.                         |

## Scenario 1: Customer Purchases a Product Already Available for Sale

### Actual implementation trace

There is no executable direct-sale scenario in v1.0.0. The closest actual path is:

```text
Customer opens /catalogue
  -> app/catalogue/page.js
  -> listProducts()
  -> Product.count + Product.findMany(include category/images)
  -> ProductGrid/ProductCard
  -> /catalogue/:id
  -> getActiveProductById()
  -> GET /api/v1/products/:id if API is used
  -> customer is directed to /rfq/new?productId=...
  -> POST /api/v1/rfqs
  -> createRfq()
  -> Product.findFirst(active, deletedAt null)
  -> RFQ.create with nested RFQItem
  -> admin creates/sends Quotation
  -> customer accepts quotation
  -> createOrderFromAcceptedQuotation()
  -> Order + OrderItem transaction
  -> POST /api/v1/orders/:id/checkout
  -> Order draft -> pending_payment
  -> no Payment.create
  -> no provider call
  -> no verification/webhook
  -> order remains pending_payment
```

### Conclusion

The requested “already available for sale” purchase is not implemented. There is no cart, no direct order-from-product command, no inventory reservation/decrement, and no payment path. The product is treated as a sourcing catalogue entry. V2 must first decide whether “available for sale” means immediate sale or merely available to source; the current code only supports the latter.

## Scenario 2: Customer Purchases a Product Requiring Sourcing/Procurement

### Actual implementation trace

```text
Customer submits product/custom request
  -> components/rfq/RfqForm.jsx
  -> POST /api/v1/rfqs
  -> route authentication + buyer role check
  -> createRfq()
  -> optional Product.findFirst(active/non-deleted)
  -> RFQ reference count query
  -> RFQ.create + nested RFQItem
  -> admin views /admin/rfqs
  -> listAllRfqsAdmin()
  -> admin opens RFQ
  -> getAdminRfqById()
  -> POST /api/v1/admin/rfqs/:id/quotations
  -> createQuotation()
  -> RFQ.findFirst(open/quoted)
  -> Supplier.findFirst(first supplier only)
  -> quotation reference count query
  -> Quotation.create(status draft)
  -> PATCH draft as needed
  -> POST /api/v1/admin/quotations/:id/send
  -> sendQuotation()
  -> Quotation.findUnique + update draft -> sent
  -> buyer notification
  -> customer accepts
  -> POST /api/v1/quotations/:id/accept
  -> acceptQuotation()
  -> createOrderFromAcceptedQuotation()
  -> interactive transaction:
       Quotation.findFirst scoped to buyer
       optional Quotation sent -> accepted update
       Order.create(status draft, quotation financial snapshot)
       OrderItem.createMany
  -> buyer/admin notifications and post-commit reloads
  -> customer checkout POST
  -> Order draft -> pending_payment
  -> payment/procurement/supplier/fulfillment stops here
```

### Missing procurement steps

No supplier response, procurement task, purchase order, supplier confirmation, sourcing cost update, shipment creation, logistics assignment, tracking event, or delivery transition is executed. The `supplierId` on quotation/order is a database association, not a supplier workflow.

## Comparison and Unnecessary Coupling

| Concern         | Current direct/available intent                     | Current sourcing path                            | V2 implication                                                                            |
| --------------- | --------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Entry           | No cart or purchase command                         | RFQ form                                         | Use a purchase intent boundary that can route to sale or sourcing.                        |
| Pricing         | Product price exists but is not order-authoritative | Quotation component costs become order snapshot  | Keep product price and offer price as separate explicit concepts.                         |
| Order creation  | Absent                                              | Performed inside quotation acceptance            | Decouple accepted offer from order command while preserving atomicity.                    |
| Payment         | Absent                                              | Checkout only sets pending status                | Build one payment module used by both paths.                                              |
| Supplier        | Product has supplier relation but it is hidden      | First supplier is selected implicitly            | Make assignment explicit and verified.                                                    |
| Fulfillment     | Absent                                              | Absent                                           | Order should emit fulfillment work only after verified payment and procurement readiness. |
| State ownership | Ambiguous                                           | Quotation acceptance mutates order and quotation | Give each aggregate/module one state owner and use events between them.                   |

The current coupling is unnecessary because a quotation is one way to produce a payable commercial offer, not the only way an order can exist. Conversely, procurement should not be inferred merely from an order’s `supplierId`. V2 should converge both customer experiences at a purchase/order boundary while keeping quotation and procurement as optional internal steps.

## Audit Completion

Audit complete. No application code was modified.
