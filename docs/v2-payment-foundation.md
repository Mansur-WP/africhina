# V2 Payment Domain Foundation

## Scope

Phase 4A established the local PaymentAttempt foundation for Paystack. Phase 4B adds server-side Paystack initialization only. It does not process webhooks, verify payments, mark orders paid, release/commit stock reservations, refund payments, or start fulfillment.

## Payment Ownership

The existing `Payment` model is reused as the payment-attempt record. Payment owns:

- attempt identity and Order association;
- provider (`paystack` only for V2);
- provider reference when available;
- amount and currency copied from the immutable Order snapshot;
- idempotency key;
- provider event identity when available;
- lifecycle status and verification/failure timestamps.

Payment does not own Product pricing, cart contents, stock, procurement, suppliers, shipment, or fulfillment.

## Lifecycle

```text
INITIATED -> PENDING_PROVIDER -> VERIFIED
                         \-> FAILED
VERIFIED -> REFUNDED      (future refund phase)
```

Only a future authoritative Paystack verification/webhook command may move a payment to `VERIFIED`. This phase does not change Order status and does not call stock reservation commit/release operations.

Legacy enum values (`pending`, `success`, `failed`, `refunded`) remain in the Prisma enum so existing records remain readable. New V2 commands use the explicit uppercase lifecycle values.

## Idempotency

Payment attempts have a database-backed unique constraint on `(orderId, idempotencyKey)`. A repeated initialization request for the same buyer, Order, and key returns the existing attempt instead of creating another one. A new key can create a retry attempt after a failed attempt.

The buyer is resolved from the authenticated session and must own the Order. Client amount, currency, provider, supplier, stock, and buyer values are not accepted as authority.

## Money Invariant

Amounts remain integer minor units. Payment amount and currency are copied from `Order.totalAmount` and `Order.currency`. Provider confirmation must later match both values exactly before verification.

## Paystack Adapter Boundary

`src/infrastructure/payments/paystackGateway.js` defines the future adapter operations:

- `initializePayment()`
- `verifyPayment()`
- `verifyWebhookSignature()`
- `refundPayment()`

`initializePayment()` now performs the server-to-server Paystack transaction initialization request. The remaining operations fail closed with `501 NOT_IMPLEMENTED`.

Initialization flow:

```text
Authenticated buyer + Order(PENDING_PAYMENT)
    -> local Payment(INITIATED) with server Order amount/currency/email
    -> Paystack initialize request outside the database transaction
    -> store provider reference + authorization URL
    -> Payment(PENDING_PROVIDER)
    -> return authorization URL
```

The Paystack adapter converts Africhina minor-unit amounts directly to Paystack's required minor-unit request field. It accepts only the configured payment currency policy (`NGN`), validates Paystack's success response, and returns only the provider reference and authorization URL.

Payment references are collision-resistant random values and are stored in `Payment.providerRef`. The same `orderId + idempotencyKey` reuses the existing logical attempt. An existing pending attempt with an authorization URL is returned without another provider initialization call.

The callback URL is informational only. **Browser return is not payment confirmation.** The callback page never marks a payment verified or an Order paid; only a later authoritative webhook/verification phase may do that.

Future configuration variables:

- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

No secret values are stored in source code or returned to customers.

## Intentionally Not Implemented

- Paystack verification and webhook processing
- Paystack verification and webhook processing
- Order `PAID` transitions
- Payment-triggered stock reservation commit/release
- Refund behavior
- Procurement
- Fulfillment and shipment
- Payment API routes or customer payment UI
