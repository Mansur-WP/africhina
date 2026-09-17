# Africhina Connect V2 Purchase and Fulfillment Domain Contracts

**Phase:** V2 Phase 2, design only  
**Baseline:** v1.0.0 implementation, with v2.0.0-refactor in development  
**Date:** 2026-09-17  
**Status:** Blueprint for implementation planning; not an implementation proposal to apply directly

## Scope and Design Rules

This report defines the smallest domain boundary that can support both direct sale and sourcing-required purchases while keeping the customer experience simple.

No application code, Prisma schema, migration, route, UI, or test was changed to produce this document.

The design is grounded in the current repository:

- Public products are active, non-deleted catalogue records. `productService.js` deliberately labels them “Available for sourcing,” not physically stocked.
- There is no cart model or cart API.
- The only active order creation path is quotation acceptance in `orderService.js`.
- Quotation acceptance directly calls order creation.
- Checkout only changes an order from `draft` to `pending_payment`; it does not create a Payment or call a provider.
- Payment, webhook, procurement, supplier, and shipment models exist in the Prisma schema, but their active application workflows do not.
- RFQ and quotation states currently exist, but they are not consistently advanced as part of the active flow.

Where a business decision cannot be supported by current data, this report labels it **INVESTIGATE** rather than inventing a rule.

## 1. Purchase Type

### Contract

V2 has exactly two purchase types:

```text
DIRECT_SALE
SOURCING_REQUIRED
```

The canonical purchase type belongs on a **PurchaseIntent** or equivalent commercial-intent object, and must be copied immutably onto the Order when the order is created.

The recommended ownership is:

```text
Product capability/configuration -> PurchaseIntent.purchaseType -> Order.purchaseType
```

### Why not Product alone?

The current Product model has `status`, `price`, `currency`, `minimumOrderQty`, and nullable `stock`, but no meaningful sale-mode field. Product status currently controls public visibility, not whether a particular purchase can be completed immediately.

A product-level default may be useful later, but it cannot be the sole authority because the same catalogue product may be:

- directly purchasable for one quantity or destination;
- sourcing-required for another quantity, destination, or unavailable inventory condition; or
- temporarily unavailable while still visible in the catalogue.

Therefore a Product may eventually expose a **sale capability** or **fulfillment policy**, but the resolved purchase type must be decided on the PurchaseIntent. The intent captures the business decision for this customer, quantity, destination, price, and time.

### Why not Order alone?

Order is the durable commercial commitment. It needs the purchase type for routing, reporting, and fulfillment, but the type is needed before an order exists to decide whether the customer can pay now or must wait for an offer.

### No duplicate mutable representations

V2 should not maintain independent mutable `purchaseType` fields on Product, RFQ, Quotation, PurchaseIntent, and Order. Recommended rule:

- PurchaseIntent owns the **resolved type before order creation**.
- Order owns the **immutable historical type after order creation**.
- Procurement/Offer may reference the intent and explain why sourcing was required, but must not redefine the order type after payment/order creation.
- Product may have an optional future capability/configuration field, but it is not a second lifecycle state.

## 2. Customer Purchase Flow

### Direct sale: customer-visible flow

```text
Browse product
  -> choose quantity and destination
  -> Buy now or add to cart if multi-item purchase is confirmed
  -> review final total
  -> start checkout
  -> pay through provider
  -> see confirmed order
  -> track shipment
  -> delivered
```

Customer sees:

- product title, image, customer price, currency, quantity, delivery estimate, destination, payment result, order number, and shipment tracking;
- simple messages such as “Ready to buy,” “Payment pending,” “Order confirmed,” and “On the way.”

Customer does not see:

- supplier assignment;
- procurement case;
- supplier quotation;
- internal purchase order;
- internal sourcing margin or operational cost breakdown.

### Sourcing-required: customer-visible flow

```text
Browse product or describe a request
  -> submit a request
  -> wait for an offer
  -> review customer offer
  -> accept offer
  -> pay
  -> see confirmed order
  -> track shipment
  -> delivered
```

Customer sees:

- “Request submitted”;
- a simple offer with total price, currency, estimated delivery, validity, and relevant customer terms;
- “Accept offer” and then payment;
- the same order, payment, and tracking experience as direct sale.

Customer does not need to understand:

- RFQ;
- procurement case;
- supplier assignment;
- supplier quote comparison;
- supplier selection;
- purchase order;
- internal sourcing statuses.

The existing RFQ and quotation screens may remain as compatibility views during migration, but V2 customer terminology should gradually present them as **Request** and **Offer**.

### Customer convergence point

Both flows should converge at:

```text
PurchaseIntent -> payable Order -> Payment -> Fulfillment -> Shipment
```

The only customer-visible difference is that sourcing-required purchases have an offer/acceptance step before the payable order exists.

## 3. Order Domain

### What an Order represents

An Order is the durable commercial commitment between Africhina Connect and the customer. It records what the customer agreed to buy, for whom, at what immutable price, under which purchase type, and which fulfillment work must happen after payment.

An Order is not:

- a cart;
- a payment attempt;
- a procurement case;
- a supplier quote;
- a shipment;
- a mutable view of the current Product or Supplier record.

### Order creation point

- **DIRECT_SALE:** create the Order after the customer submits checkout and the server validates the current product/price/quantity/destination. It may be created before payment as an unpaid order/payment-intent record, provided it is explicitly an unpaid order and expires/cancels safely.
- **SOURCING_REQUIRED:** create the Order only after the customer accepts a valid customer Offer. The Offer acceptance and order snapshot must be one atomic business command.

The current implementation creates an Order only from quotation acceptance and creates it as `draft`; this is insufficient for direct sale and couples order creation to quotation service.

### Order ownership

The Order module owns:

- order identity and number;
- buyer ownership and access scope;
- purchase type snapshot;
- line/product snapshots;
- immutable commercial total and currency;
- order lifecycle transitions;
- links to payment, procurement context, and fulfillment context;
- customer-facing order projection.

### Order status

Use a minimal order lifecycle focused on commercial and fulfillment milestones:

```text
PENDING_PAYMENT
PAID
FULFILLMENT_IN_PROGRESS
SHIPPED
DELIVERED
COMPLETED
CANCELLED
```

`PAYMENT_FAILED` should remain Payment state, not become a permanent Order state. `REFUNDED` should remain a payment/refund outcome, with an order cancellation/refund policy recorded separately if needed. `DISPUTED` should not be used unless a dispute workflow is actually implemented.

The current `draft` and `pending_payment` distinction can be retained during compatibility migration, but V2 should make “draft checkout data” a PurchaseIntent concern and reserve Order for an identified commercial commitment.

### Payment relationship

An Order may have multiple PaymentAttempts, but at most one authoritative successful payment for the applicable amount unless the business explicitly supports installments.

Order must not infer payment from its own status. Payment owns payment state and emits a verified result. The Order consumes that result and transitions to `PAID` conditionally.

### Fulfillment relationship

An Order may have one active Fulfillment record and one Shipment record for the current simple flow, with the schema relationship kept extensible if split shipments are later needed. Fulfillment owns operational readiness; Shipment owns carrier/tracking movement.

### Sourcing relationship

An Order may reference the originating PurchaseIntent and, for sourcing-required purchases, the accepted Offer/Procurement Case. These are provenance links. Procurement owns sourcing state; Order owns only the commercial snapshot and its own lifecycle.

### Offer relationship

For `SOURCING_REQUIRED`, the Order must reference the accepted Offer that produced it. For `DIRECT_SALE`, no Offer is required.

### Immutable financial snapshot

At order creation, copy and freeze:

- line quantity;
- unit price;
- line subtotal;
- product/service charges included in the customer price;
- shipping/handling/customs charges included in the total, if applicable;
- discount or adjustment, if supported;
- total amount;
- currency;
- destination/shipping address snapshot;
- tax/fee basis, if later introduced.

Later Product, Offer, supplier, freight, or configuration changes must not rewrite the customer’s Order snapshot.

### Product snapshot

Order items must preserve the customer-visible product identity at purchase time:

- product id, when available;
- title;
- variant/SKU, when available;
- image or display reference only if needed for history;
- quantity;
- unit price and currency.

The current OrderItem stores product id, quantity, unit price, and subtotal but relies on a live Product relation for title/currency. That is not sufficient for immutable order history.

## 4. State Ownership

| Lifecycle       | Owns                                                                                          | Must not control                                                                        |
| --------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Order           | Commercial commitment, customer ownership, immutable snapshot, order-level transitions        | Provider verification, supplier selection, carrier events                               |
| Payment         | Attempts, provider reference, amount/currency verification, webhook reconciliation, refunds   | Product pricing, procurement decisions, shipment movement                               |
| Procurement     | Sourcing case, supplier assignment, supplier responses, internal approval, sourcing readiness | Customer payment status, carrier tracking, final order history                          |
| Quotation/Offer | A time-bounded customer price/delivery offer and acceptance eligibility                       | Provider payment truth, supplier operational execution after acceptance, shipment state |
| Shipment        | Carrier/tracking milestones and delivery evidence                                             | Whether money was successfully charged, supplier quote selection                        |
| PurchaseIntent  | Customer’s requested purchase, resolved purchase type before Order, checkout context          | Long-term payment truth, fulfillment progress, mutable product catalog                  |

### Avoiding duplicate state

- RFQ/Procurement status answers: “Where is sourcing work?”
- Offer status answers: “Can the customer accept this price?”
- Order status answers: “What is the commercial/fulfillment state of the order?”
- Payment status answers: “What has the provider authoritatively confirmed?”
- Shipment status answers: “Where is the physical delivery?”

No module should infer another module’s state by translating arbitrary enum values. Cross-module changes occur through explicit commands/events and recorded timestamps.

## 5. State Machines

The following are intentionally minimal. Additional states require a demonstrated operational need.

### Order

| Previous                            | Next                      | Trigger                                            | Validation and idempotency                                                                                        |
| ----------------------------------- | ------------------------- | -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| `PENDING_PAYMENT`                   | `PAID`                    | Payment application after verified provider result | Payment must match order, amount, currency, and intended payment; conditional update; repeated result is a no-op. |
| `PENDING_PAYMENT`                   | `CANCELLED`               | Customer/admin/system expiry or cancellation       | No successful payment; record actor/reason/time; repeat is a no-op.                                               |
| `PAID`                              | `FULFILLMENT_IN_PROGRESS` | Fulfillment application                            | Payment is verified; required order data exists; conditional transition.                                          |
| `FULFILLMENT_IN_PROGRESS`           | `SHIPPED`                 | Fulfillment/logistics                              | Shipment is created and carrier/tracking prerequisites pass.                                                      |
| `SHIPPED`                           | `DELIVERED`               | Logistics/carrier confirmation                     | Delivery event is recorded; duplicate event is idempotent.                                                        |
| `DELIVERED`                         | `COMPLETED`               | System/customer confirmation policy                | Only after the defined completion rule; timestamped.                                                              |
| `PAID` or `FULFILLMENT_IN_PROGRESS` | `CANCELLED`               | Admin/refund policy                                | Refund/reversal handling must be complete or explicitly pending; do not silently cancel paid money.               |

### Payment

Recommended minimal PaymentAttempt statuses:

```text
INITIATED
PENDING_PROVIDER
VERIFIED
FAILED
REFUNDED
```

| Previous           | Next               | Trigger                                              | Validation and idempotency                                                                                      |
| ------------------ | ------------------ | ---------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| none               | `INITIATED`        | Order payment command                                | Unique idempotency key per order/payment intent; amount/currency copied from Order.                             |
| `INITIATED`        | `PENDING_PROVIDER` | Provider initialization response                     | Persist provider and provider reference; retry must reuse or safely supersede the attempt.                      |
| `PENDING_PROVIDER` | `VERIFIED`         | Verified webhook/provider reconciliation             | Signature/event verification, provider reference, order binding, amount, currency, and success status all pass. |
| `PENDING_PROVIDER` | `FAILED`           | Verified provider failure or terminal timeout policy | Persist provider reason; repeat failure event is a no-op.                                                       |
| `VERIFIED`         | `REFUNDED`         | Refund command plus provider confirmation            | Record refund reference and amount; idempotent refund key.                                                      |

A repeated webhook must return success/no-op after recognizing the provider event or provider reference already processed. It must not create a second PaymentAttempt or advance Order twice.

### Procurement

Recommended minimal internal statuses:

```text
NOT_REQUIRED
OPEN
SUPPLIER_ASSIGNED
QUOTING
OFFER_READY
COMPLETED
CANCELLED
```

`NOT_REQUIRED` applies to direct sale as a derived or explicit no-procurement condition, not as a customer-facing status.

| Previous                                              | Next                | Trigger                                                   | Validation                                                                              |
| ----------------------------------------------------- | ------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| none                                                  | `OPEN`              | Sourcing-required PurchaseIntent accepted for procurement | Request has product/request details, quantity, destination, and customer ownership.     |
| `OPEN`                                                | `SUPPLIER_ASSIGNED` | Authorized procurement staff/system                       | Supplier is eligible/verified and assignment is recorded.                               |
| `SUPPLIER_ASSIGNED`                                   | `QUOTING`           | Procurement starts supplier outreach                      | Assignment is active; no duplicate active sourcing work.                                |
| `QUOTING`                                             | `OFFER_READY`       | Internal selection/approval creates customer Offer        | Offer has complete price, currency, delivery estimate, expiry, and source snapshot.     |
| `OFFER_READY`                                         | `COMPLETED`         | Customer accepts Offer and resulting Order is created     | Acceptance and order creation are one idempotent command; otherwise remain offer-ready. |
| `OPEN`, `SUPPLIER_ASSIGNED`, `QUOTING`, `OFFER_READY` | `CANCELLED`         | Authorized staff/customer policy                          | No accepted paid Order, or explicit cancellation/refund policy exists.                  |

### Quotation/Offer

Use “Offer” as the customer-facing concept. Internally, existing Quotation can be retained during migration.

```text
DRAFT
READY
SENT
ACCEPTED
REJECTED
EXPIRED
CANCELLED
```

| Previous                 | Next        | Trigger                      | Validation and idempotency                                                                                    |
| ------------------------ | ----------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `DRAFT`                  | `READY`     | Procurement/admin approval   | Complete financial and delivery data; total calculated server-side.                                           |
| `READY`                  | `SENT`      | Authorized offer publication | Future expiry; customer ownership; notification is asynchronous. Repeated send is a no-op or explicit resend. |
| `SENT`                   | `ACCEPTED`  | Customer                     | Not expired; conditional update; one accepted offer per intended purchase unless replacement policy exists.   |
| `SENT`                   | `REJECTED`  | Customer                     | Not already accepted/expired; conditional update.                                                             |
| `SENT`                   | `EXPIRED`   | Time/system                  | Expiry time passed; idempotent background or read-time transition.                                            |
| `DRAFT`, `READY`, `SENT` | `CANCELLED` | Authorized staff/system      | Cannot cancel after accepted Order without a reversal policy.                                                 |

The current enum includes `pending`; V2 should remove or stop using it once compatibility is complete because `DRAFT`/`READY`/`SENT` provide clearer ownership.

### Shipment

Recommended minimal statuses:

```text
PREPARING
IN_TRANSIT
IN_CUSTOMS
DELIVERED
```

| Previous                     | Next         | Trigger                                 | Validation and idempotency                                            |
| ---------------------------- | ------------ | --------------------------------------- | --------------------------------------------------------------------- |
| none                         | `PREPARING`  | Fulfillment after payment and readiness | Order is paid; shipment/order relation is unique for the simple flow. |
| `PREPARING`                  | `IN_TRANSIT` | Logistics/carrier                       | Carrier/tracking data exists; duplicate update is a no-op.            |
| `IN_TRANSIT`                 | `IN_CUSTOMS` | Logistics/carrier                       | Shipment remains active; record event/location/time.                  |
| `IN_TRANSIT` or `IN_CUSTOMS` | `DELIVERED`  | Logistics/carrier                       | Delivery evidence/time recorded; duplicate event is a no-op.          |

Do not add a shipment “cancelled” state until cancellation/rebooking behavior is defined. Record exceptional events separately if needed.

## 6. Direct Sale

### Contract

A direct sale is a PurchaseIntent resolved to `DIRECT_SALE` only when the server can honor the product, quantity, destination, price, and fulfillment promise without customer negotiation.

### Inventory decision

The current schema has nullable `Product.stock`, but the active product service deliberately hides raw inventory and no reservation, decrement, or stock reconciliation exists. Therefore:

**INVESTIGATE:** whether stock is a real operational quantity for direct-sale products.

Do not invent reservation/decrement behavior until the business confirms:

- whether inventory is owned/held by Africhina Connect or suppliers;
- whether stock is location-specific;
- whether the catalogue price guarantees immediate availability;
- whether overselling is acceptable;
- whether external supplier availability must be checked at checkout.

If inventory is not meaningful, DIRECT_SALE may mean “a fixed-price order that does not require customer-facing sourcing,” not “physically stocked in Nigeria.” That distinction must be explicit in product policy and customer copy.

### Direct-sale sequence

```text
Customer submits purchase intent
  -> server validates active product and quantity
  -> resolve DIRECT_SALE
  -> create Order with immutable product/price snapshot and PENDING_PAYMENT
  -> create idempotent PaymentAttempt
  -> initialize provider outside the DB transaction
  -> customer completes provider payment
  -> provider webhook is verified
  -> PaymentAttempt becomes VERIFIED
  -> Order conditionally becomes PAID
  -> Fulfillment becomes ready/in progress
  -> Shipment is created and tracked
```

### Payment failure

A failed provider result changes PaymentAttempt to `FAILED`. The Order remains `PENDING_PAYMENT` for retry until expiry/cancellation policy. It must not become `PAID` and must not start fulfillment.

### Payment success

Only verified provider data may advance PaymentAttempt to `VERIFIED` and Order to `PAID`. A browser return/redirect is not authoritative.

### Repeated webhook

Persist a provider event id or equivalent deduplication key, plus provider reference. A repeated event:

- returns an idempotent success response;
- does not create a second payment;
- does not increase the paid amount;
- does not repeat the Order transition;
- may safely re-enqueue missing post-payment work.

### Two concurrent purchase requests

The system must choose and document one policy:

- **INVESTIGATE:** allow separate orders for separate customer attempts; or
- **INVESTIGATE:** deduplicate identical active PurchaseIntents using a client idempotency key.

For inventory-backed direct sale, the authoritative operation must reserve/decrement stock atomically. Since current stock behavior is unimplemented, no inventory concurrency rule is asserted here.

## 7. Sourcing Required

### Target internal flow

```text
Customer Request
  -> PurchaseIntent(SOURCING_REQUIRED)
  -> Procurement Case
  -> Supplier Assignment
  -> Supplier Quotations
  -> Internal Selection/Approval
  -> Customer Offer
  -> Customer Acceptance
  -> Order snapshot
  -> PaymentAttempt
  -> Verified payment
  -> Fulfillment
  -> Shipment
```

### Existing entity reuse

| Existing entity            | V2 disposition                                                                         | Reason                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `RFQ`                      | KEEP as compatibility/storage foundation; REFACTOR toward Procurement Case or Request  | It captures buyer, request description, destination, status, and items. Customer terminology should become Request.                                         |
| `RFQItem`                  | KEEP / REFACTOR                                                                        | It supports product or custom request lines. Add snapshots or a clear link to PurchaseIntent later.                                                         |
| `Quotation`                | KEEP temporarily; REFACTOR toward internal SupplierQuote plus customer Offer if needed | Current entity mixes supplier identity, internal cost components, customer-facing total, and customer lifecycle. That is too much ownership for one object. |
| `Supplier`                 | KEEP; REFACTOR assignment/verification usage                                           | Current `findFirst()` selection is not a valid production workflow.                                                                                         |
| `Order`                    | KEEP; REFACTOR                                                                         | It should be created from an accepted Offer, with immutable snapshots and no direct quotation-service ownership.                                            |
| `Payment`                  | KEEP as persistence foundation; IMPLEMENT lifecycle                                    | It exists in schema but is unused by active routes/services.                                                                                                |
| `Shipment`/`ShipmentEvent` | KEEP as persistence foundation; IMPLEMENT fulfillment commands                         | They already model the minimal shipping state/event shape.                                                                                                  |
| `Escrow`                   | INVESTIGATE                                                                            | Schema exists, but no business/legal/payment release behavior is implemented. Do not make it part of the base V2 contract yet.                              |
| `Invoice`                  | INVESTIGATE                                                                            | Keep schema compatibility, but do not make invoice creation part of the first purchase/fulfillment slice without requirements.                              |

### Offer separation decision

The smallest safe evolution is:

- retain `Quotation` as the compatibility name initially;
- treat its customer-visible portion as an Offer contract;
- treat supplier cost/source details as internal procurement data;
- split SupplierQuote and Offer later only if one quotation record cannot cleanly enforce confidentiality, multiple supplier comparisons, revisions, or audit requirements.

A separate Offer is likely required before full procurement maturity because the customer offer should be an approved commercial snapshot, not a mutable supplier quote.

### Customer acceptance

Customer acceptance should atomically:

1. conditionally mark the eligible Offer accepted;
2. create exactly one Order with the offer’s immutable financial/product/delivery snapshot;
3. mark the Procurement Case complete or order-ready;
4. emit post-commit events.

The current implementation performs steps 1 and 2 in an interactive transaction, which is a useful starting point, but it lets `quotationService.js` directly call `orderService.js` and does not model Procurement ownership.

## 8. Payment Boundary

### Contract

```text
Order/PurchaseIntent intent
  -> PaymentAttempt created with amount/currency/order binding
  -> provider initialization
  -> provider reference/redirect
  -> provider verification
  -> signed webhook received
  -> webhook/event deduplication
  -> PaymentAttempt VERIFIED or FAILED
  -> Order conditionally PAID on verified success
```

### Responsibility placement

- **Order/Purchase application:** decides what amount and currency are payable and creates the payment intent request.
- **Payment application:** manages attempts, retries, statuses, reconciliation, and refund commands.
- **Provider infrastructure:** calls Paystack/Flutterwave, verifies signatures, normalizes provider responses, and never decides business order status by itself.
- **Webhook handler:** authenticates the provider event, persists/deduplicates it, and invokes the Payment application command.

### Required controls

- idempotency key at payment initialization, scoped to Order and operation;
- unique provider reference and provider event id where available;
- server-side amount and currency comparison against the immutable Order total;
- order/customer/provider binding validation;
- duplicate webhook protection before state mutation;
- retry policy for provider/network failures, with no duplicate charge or PaymentAttempt;
- refund idempotency key and provider refund reference;
- audit timestamps for initialized, provider-pending, verified, failed, and refunded states;
- no external provider calls inside a Prisma transaction;
- no Order `PAID` transition from a browser callback alone.

### Payment and Order consistency

The Payment application should perform a short transaction for local state changes, then publish an outbox event. The Order transition must be conditional and safe to retry. Payment status remains authoritative for money; Order status records the business consequence.

## 9. Procurement Boundary

Procurement owns all internal sourcing complexity:

- opening a sourcing case;
- normalizing the customer request;
- supplier eligibility and assignment;
- supplier outreach and responses;
- internal comparison and selection;
- cost breakdown and margin controls;
- internal approval;
- preparing a customer Offer;
- procurement readiness after payment;
- exceptions such as supplier rejection or changed availability.

Procurement must not own:

- customer payment verification;
- provider webhooks;
- the canonical customer Order total after an Order is created;
- shipment/carrier tracking;
- customer-facing internal supplier terminology.

The customer-facing Order should show a simple commercial promise. Procurement can remain advanced and detailed internally.

## 10. Fulfillment Boundary

Fulfillment begins after the Order is paid or after a separately approved post-payment condition. It owns:

- fulfillment readiness;
- packing/preparation;
- shipment creation;
- carrier and tracking details;
- customs milestone recording;
- delivery evidence;
- customer-visible tracking projection.

Fulfillment must not:

- initialize or verify payments;
- select suppliers or negotiate prices;
- rewrite immutable Order financials;
- infer payment from a shipment event.

For direct sale and sourcing-required purchases, fulfillment should consume a common paid Order contract. Procurement may provide additional internal instructions for sourcing-required orders, but it should not create a separate customer order experience.

## 11. Customer Terminology

| Internal concept          | Customer-facing terminology                           |
| ------------------------- | ----------------------------------------------------- |
| `PurchaseIntent`          | Request to buy / Checkout request                     |
| `DIRECT_SALE`             | Ready to buy                                          |
| `SOURCING_REQUIRED`       | We will source this for you                           |
| RFQ                       | Request                                               |
| RFQ Item                  | Requested item                                        |
| Procurement Case          | Internal sourcing work; do not expose                 |
| Supplier Assignment       | Internal sourcing step; do not expose                 |
| Supplier Quote            | Offer preparation; do not expose supplier terminology |
| Quotation/Offer           | Offer / Price and delivery offer                      |
| Supplier Selection        | Internal sourcing decision; do not expose             |
| Purchase Order            | Internal procurement document; do not expose          |
| PaymentAttempt            | Payment                                               |
| Provider webhook          | Payment confirmation                                  |
| Fulfillment               | Order preparation                                     |
| Shipment                  | Delivery / Tracking                                   |
| ShipmentEvent             | Tracking update                                       |
| Order `PENDING_PAYMENT`   | Awaiting payment                                      |
| Order `PAID`              | Order confirmed                                       |
| Procurement `OFFER_READY` | Offer ready                                           |

A customer should only see internal terminology when it is necessary for a legally or operationally meaningful action.

## 12. Architecture Mapping

### Presentation

- **KEEP:** public catalogue reads, buyer ownership checks, existing server-rendered pages, and customer-safe projections.
- **REFACTOR:** present a unified purchase/request entry point and customer Offer terminology. Keep internal admin screens detailed.
- **SIMPLIFY:** avoid making customers navigate RFQ, quotation, and order screens as separate concepts where one request/offer/order timeline can work.
- **INVESTIGATE:** cart UI only if multi-item direct purchase is a confirmed requirement. Do not add cart complexity by default.

### Application

- **KEEP:** product query service, ownership-scoped RFQ reads, pure pricing calculations, and conditional update patterns.
- **REFACTOR:** split `orderService.js` into order commands/queries and remove quotation-to-order direct ownership.
- **MOVE:** payment provider orchestration into a payment application module backed by infrastructure adapters; move procurement behavior out of quotation service.
- **SIMPLIFY:** use one customer purchase facade that routes to direct sale or sourcing-required internal workflows.
- **REMOVE:** assumptions that checkout is payment, and notification work from critical synchronous commands once an outbox exists.
- **INVESTIGATE:** whether the application repository boundary in the README is a real V2 requirement or should be simplified to focused Prisma query modules.

### Domain

- **KEEP:** integer-money and expiry rules as pure functions.
- **REFACTOR:** create canonical transition policies for Order, Payment, Procurement, Offer, and Shipment.
- **MOVE:** no framework/Prisma access into domain rules.
- **SIMPLIFY:** do not create entities for every UI concept; use PurchaseIntent, Order, PaymentAttempt, Procurement Case, Offer, and Shipment only where ownership requires it.
- **REMOVE:** duplicated status interpretations between RFQ, quotation, and order.
- **INVESTIGATE:** whether Escrow and Dispute deserve first-class V2 contracts now or remain later modules.

### Infrastructure

- **KEEP:** Prisma singleton, session management, token storage, email adapter shape, and explicit provider adapter boundary.
- **REFACTOR:** add payment gateway adapters, webhook verification, outbox persistence/worker path, and narrow repositories/query projections.
- **MOVE:** all provider-specific logic into infrastructure; keep payment business transitions in application/domain.
- **SIMPLIFY:** avoid creating a microservice or event bus before an outbox and worker are sufficient.
- **REMOVE:** placeholder claims that unimplemented adapters are already operational.
- **INVESTIGATE:** deployment/runtime support for workers, queues, scheduled expiry, and webhook retry handling on Vercel.

## 13. Database Impact

No schema change is proposed in this phase.

### Existing models that support V2

- `Product`: catalogue identity, price, currency, minimum order quantity, status, nullable stock. Supports product reference but not yet a confirmed sale capability.
- `ProductImage`, `Category`: catalogue projections.
- `RFQ`, `RFQItem`: request/procurement foundation, including custom products.
- `Quotation`: temporary Offer/procurement foundation.
- `Supplier`, `SupplierDocument`: supplier identity and verification foundation.
- `Order`, `OrderItem`: commercial and product-line foundation.
- `Payment`: provider reference, amount, currency, status, webhook payload foundation.
- `Shipment`, `ShipmentEvent`, `ShippingDocument`: fulfillment/tracking foundation.
- `Invoice`, `Escrow`, `Review`, `Ticket`: adjacent capabilities; not required for the first contract slice.
- `Notification`: post-commit customer/admin communication foundation.

### Future changes likely required

These are design impacts, not migration instructions:

- PurchaseIntent or equivalent pre-order commercial-intent persistence.
- Canonical purchase type on PurchaseIntent and immutable copy on Order.
- PaymentAttempt/event identity and idempotency data, unless the existing Payment model is extended to carry them.
- Immutable product/title/variant snapshots on OrderItem.
- Explicit Offer identity and accepted-offer linkage, especially if SupplierQuote and customer Offer are split.
- Procurement Case identity/status and explicit supplier assignment if RFQ is not sufficient.
- Order-to-fulfillment/shipment linkage if the current one-shipment constraint is too restrictive.
- Transition audit data or an event/outbox record for cross-module state changes.

### Relationships that may need change

- Current `Quotation.order` one-to-one is compatible with accepted-offer-to-order, but it should not make quotation the only order source.
- Current `Order.quotationId` is nullable and unique, which supports direct-sale orders without a quotation.
- Current `Order.supplierId` is required, which conflicts with a direct-sale order where no supplier/procurement assignment may be needed. **INVESTIGATE** whether direct-sale orders always have an internal supplier or whether this relation must become optional/flexible.
- Current `Shipment.orderId` is unique. **INVESTIGATE** whether split shipments are required before retaining that constraint as the V2 contract.
- Current `Payment.orderId` supports multiple payments per order, but provider event/idempotency uniqueness is incomplete for robust webhook processing.
- Current `RFQ` to `Quotation` supports many quotations, which is useful for internal supplier comparisons but not necessarily a clean customer Offer boundary.

### Fields that appear redundant or ambiguous

- `Order.status` currently includes payment, fulfillment, refund, and dispute concepts. V2 should reduce or clarify ownership.
- Public `paymentStatus` is derived from Order status even though Payment exists. This is redundant and unsafe.
- `Quotation.price` is represented through legacy input compatibility while the schema uses `productCost` plus component fields. V2 needs one authoritative financial contract.
- `RFQ.status` and `Quotation.status` are both used to describe progression toward a customer offer. Their responsibilities must be separated.
- `Product.stock` is nullable and unused operationally. **INVESTIGATE** before treating it as inventory authority.
- `Order.supplierId` may be redundant for direct sale if supplier ownership belongs only to Procurement/Fulfillment.
- `Escrow`, `Invoice`, and `Review` exist but are not part of the active purchase path. Keep them out of the first contract unless requirements require them.

### Indexes likely needed later

Confirmed likely needs:

- PurchaseIntent by buyer, status, purchase type, and created time;
- Order by buyer/status/created time and purchase type if reporting needs it;
- PaymentAttempt by order, provider reference, provider event id, idempotency key, and status;
- Procurement Case by status/assigned supplier/created time;
- Offer by procurement case/customer/status/expiry;
- Shipment by order/status/tracking number;
- Product by status/deletedAt/category and the chosen search strategy.

These are **future design candidates**, not immediate schema instructions. Exact indexes require production query plans and data volume.

### Confirmed versus INVESTIGATE

**Confirmed from current code:** Payment, Shipment, Procurement workflows are incomplete; Order is quotation-coupled; direct sale has no active path; Product stock is not used for availability; Payment provider/webhook logic is absent.

**INVESTIGATE before schema work:** inventory meaning, optional supplier on direct orders, split shipments, installment payments, escrow/legal requirements, separate SupplierQuote/Offer, outbox/worker hosting, and migration compatibility with existing production rows.

## 14. Migration Strategy

V1 is stable, so V2 should be additive and adapter-driven.

1. **Freeze contracts and terminology.** Document the state ownership and customer projections without changing current routes.
2. **Introduce pure domain policies.** Add transition tables and purchase type resolution as isolated logic, with no schema change until fields are proven.
3. **Add a PurchaseIntent application boundary.** Initially it can be backed by existing RFQ/order data or an additive persistence model; do not force direct-sale behavior through RFQ.
4. **Separate commands from reads.** Preserve current route responses while replacing broad includes with focused projections.
5. **Implement direct-sale behind a feature flag.** Resolve purchase type, create an unpaid Order/payment intent, and validate the flow without exposing it to all customers.
6. **Implement PaymentAttempt and webhook reconciliation.** Make provider events authoritative and idempotent before marking any order paid.
7. **Refactor quotation acceptance behind an Offer acceptance command.** Keep existing quotation routes as compatibility adapters.
8. **Introduce Procurement Case and explicit supplier assignment.** Migrate existing RFQ data as provenance; do not delete RFQ rows.
9. **Add common fulfillment commands and shipment updates.** Start fulfillment only from verified paid orders.
10. **Unify customer projections.** Present Request, Offer, Order, Payment, and Tracking in simple language while retaining internal admin detail.
11. **Measure and migrate gradually.** Add database-backed integration/concurrency tests, query timing, webhook replay tests, and feature-flag rollback paths.
12. **Deprecate only after adoption.** Do not remove RFQ/Quotation compatibility until all v1 records and clients are supported by the new contract.

No destructive rewrite, schema migration, route change, or UI change should occur as part of this design phase.

## 15. Risks

1. **Purchase classification ambiguity:** If “direct sale” is merely a fixed-price sourcing request rather than physical inventory, the customer promise and fulfillment contract must say so clearly.
2. **Inventory uncertainty:** Building reservations before confirming stock ownership and availability semantics would create unnecessary complexity and false guarantees.
3. **Supplier requirement on Order:** The current required `Order.supplierId` may conflict with direct sales and must be resolved before implementation.
4. **Offer versus SupplierQuote:** Keeping one Quotation record may leak internal cost data or make revisions/approval difficult; splitting too early may overbuild the procurement domain.
5. **Payment authority:** A redirect-based implementation would create false paid orders. Webhook verification and replay handling are release-blocking.
6. **Order creation timing:** Creating Orders before payment supports idempotency and customer support, but requires expiry/cancellation cleanup. Creating them only after payment complicates provider reconciliation. This is a business/operational decision to confirm.
7. **State migration:** Existing rows may contain `draft`, `pending`, `accepted`, and mixed semantics. A compatibility mapping is required before enforcing minimal V2 states.
8. **Fulfillment granularity:** A unique Shipment per Order is simple but may fail for partial or split delivery.
9. **Asynchronous execution:** Notifications, webhook retries, expiry processing, and fulfillment events need a reliable runtime mechanism compatible with deployment.
10. **Authorization boundary:** Admin, logistics, support, buyer, and future supplier permissions must be attached to commands, not inferred from UI routes alone.
11. **Financial immutability:** Product and quotation changes must never rewrite an existing payable Order snapshot.
12. **Concurrency:** Duplicate offer acceptance, duplicate checkout, duplicate payment initialization, repeated webhooks, and concurrent inventory claims require database-level conditional operations.

## A. V2 DOMAIN CONTRACT

```text
PurchaseIntent
  buyerId
  requested items/product or custom request
  destination
  resolved purchaseType: DIRECT_SALE | SOURCING_REQUIRED
  status: active | converted | expired | cancelled

Order
  buyer ownership
  purchaseType snapshot
  immutable line/product/financial/destination snapshot
  status: PENDING_PAYMENT | PAID | FULFILLMENT_IN_PROGRESS |
          SHIPPED | DELIVERED | COMPLETED | CANCELLED
  optional accepted Offer reference
  optional Procurement reference
  payment and fulfillment references

PaymentAttempt
  Order reference
  provider/provider reference
  amount/currency snapshot
  idempotency key and provider event identity
  status: INITIATED | PENDING_PROVIDER | VERIFIED | FAILED | REFUNDED

ProcurementCase
  PurchaseIntent reference
  request/items/destination
  supplier assignment and internal sourcing state
  status: OPEN | SUPPLIER_ASSIGNED | QUOTING | OFFER_READY |
          COMPLETED | CANCELLED

Offer
  approved customer price/delivery/expiry snapshot
  originating ProcurementCase
  status: DRAFT | READY | SENT | ACCEPTED | REJECTED | EXPIRED | CANCELLED

Shipment
  Order reference
  carrier/tracking data
  status: PREPARING | IN_TRANSIT | IN_CUSTOMS | DELIVERED
```

Core rule: only verified Payment success can make an Order `PAID`; only the Order owns the customer’s commercial snapshot; only Procurement owns supplier sourcing complexity; only Shipment owns physical delivery state.

## B. STATE MACHINE SUMMARY

```text
DIRECT_SALE:
PurchaseIntent -> Order(PENDING_PAYMENT) -> PaymentAttempt ->
verified Payment -> Order(PAID) -> Fulfillment -> Shipment -> Delivered

SOURCING_REQUIRED:
PurchaseIntent -> ProcurementCase -> Offer -> Customer acceptance ->
Order(PENDING_PAYMENT) -> PaymentAttempt -> verified Payment ->
Order(PAID) -> Fulfillment -> Shipment -> Delivered
```

State changes are conditional, timestamped, and idempotent. Cross-module side effects happen after the local transaction through an outbox/event mechanism.

## C. MODULE RESPONSIBILITIES

| Module          | Primary responsibility                                                         |
| --------------- | ------------------------------------------------------------------------------ |
| Catalogue       | Product visibility, customer-safe product data, sale capability input          |
| Purchase        | Customer intent, purchase-type resolution, checkout command                    |
| Order           | Commercial commitment, immutable snapshot, customer ownership, order lifecycle |
| Payment         | Attempts, provider integration boundary, verification, webhooks, refunds       |
| Procurement     | Supplier sourcing, internal comparison/approval, customer offer preparation    |
| Offer           | Time-bounded approved price/delivery offer and acceptance eligibility          |
| Fulfillment     | Post-payment readiness and operational work                                    |
| Shipment        | Carrier/tracking/delivery milestones                                           |
| Identity/Access | Authentication, role/permission checks, ownership scoping                      |
| Notifications   | Asynchronous customer/admin communication from committed events                |

## D. DATABASE IMPACT

No schema change is made or prescribed in this phase.

Existing foundations can support much of V2, but likely future additions include PurchaseIntent, canonical purchase type, payment idempotency/event identity, product snapshots, explicit procurement/offer provenance, and audit/outbox records.

The most important pre-implementation investigations are nullable `Order.supplierId` for direct sales, inventory semantics, SupplierQuote versus Offer separation, Payment webhook deduplication fields, and one-to-many versus one-to-one shipment behavior.

## E. IMPLEMENTATION SEQUENCE

1. Approve purchase type, order creation timing, inventory meaning, and customer terminology.
2. Add pure transition and ownership contracts.
3. Introduce PurchaseIntent and narrow query/command boundaries without breaking v1 routes.
4. Implement direct-sale order/payment intent behind a feature flag.
5. Implement authoritative idempotent payment/webhook processing.
6. Decouple Offer acceptance from quotation service and preserve v1 adapters.
7. Add explicit Procurement Case and supplier assignment.
8. Add common paid-order fulfillment and shipment commands.
9. Unify customer projections and terminology.
10. Add integration, concurrency, payment replay, and migration verification before enabling broadly.

## F. OPEN BUSINESS/TECHNICAL QUESTIONS

1. Does `DIRECT_SALE` guarantee physical stock, or only a fixed-price sourcing path?
2. Is Product stock authoritative, and who owns/reconciles it?
3. Can a direct-sale Order have no supplier, or is an internal supplier always known?
4. Must the Order be created before payment initialization, after payment verification, or as an expiring unpaid order?
5. Are multi-item carts required, or is Buy Now sufficient for V2?
6. Are installment payments, partial payments, escrow, or refunds required in the first V2 release?
7. Should an internal SupplierQuote and customer Offer be separate records?
8. Can customers accept only one Offer per Request, and can staff replace an Offer after rejection/expiry?
9. Does one Order support split shipments or partial fulfillment?
10. What runtime will process webhook retries, outbox events, offer expiry, and fulfillment work?
11. What exact Paystack/Flutterwave webhook event ids and signature rules apply?
12. What existing production records must remain readable under the new state mapping?
13. Which roles may perform supplier assignment, Offer approval, payment reconciliation, fulfillment transitions, refunds, and delivery confirmation?
14. What customer-facing delivery promise is valid before procurement has completed?

## Completion Statement

This is a design-only blueprint for the next implementation phase.

**No application code, Prisma schema, migrations, routes, UI, or tests were modified.**
