# V2 Product Purchase and Cart Foundation

## Product Purchase Mode

Products now use `purchaseMode` with exactly two values:

- `DIRECT_SALE`: physically available in Nigeria, eligible for the direct-sale cart, and eligible for direct-sale checkout.
- `SOURCING_REQUIRED`: not directly available; customers use the existing request/RFQ flow.

Existing products default to `SOURCING_REQUIRED` so the V1 sourcing behavior remains unchanged.

## Cart Rules

The persistent buyer cart accepts only active, non-deleted `DIRECT_SALE` products. Cart lines are unique per buyer cart and product. Quantity must be an integer of at least one, must meet `minimumOrderQty`, and must not exceed current stock. Prices, stock, purchase mode, and totals are always re-read from the server.

Adding to or editing a cart does not decrement stock.

## Inventory Assumptions

`Product.stock` is treated as a non-negative direct-sale availability quantity for this slice. Direct-sale checkout atomically decrements stock inside a serializable database transaction while creating the pending-payment order and records an active reservation on the Order. This is the smallest protection against two concurrent checkouts overselling the same row without introducing reservations or stock-ledger tables.

The reservation expires after 30 minutes. The future payment slice must commit it after verified payment, or release it on payment failure/expiry. Release is idempotent and restores the exact order quantities once.

## PurchaseIntent

`PurchaseIntent` records the buyer, resolved `DIRECT_SALE` mode, source cart, destination, lifecycle status, and optional idempotency key. It is converted as part of direct-sale order preparation and links the resulting Order without exposing procurement concepts to the customer.

## Direct-Sale Checkout Flow

```text
Buyer cart
  -> server reloads every Product
  -> verifies direct-sale mode, active visibility, minimum quantity, and stock
  -> serializable transaction decrements stock
  -> creates PurchaseIntent
  -> creates immutable Order and OrderItems
  -> clears cart
  -> returns Order(PENDING_PAYMENT)
```

Paystack is not initialized in this slice. No Payment record is created and no order is marked paid.

## Order Creation Behavior

Direct-sale orders have:

- `purchaseMode = DIRECT_SALE`;
- `status = pending_payment`;
- no supplier;
- server-calculated total and currency;
- immutable product title, product id, quantity, unit price, currency, and subtotal snapshots;
- destination/shipping address snapshot.

The existing RFQ/quotation order path remains available and is marked `SOURCING_REQUIRED` for compatibility.

## Known Limitations

- No Paystack payment attempt or webhook verification yet.
- No automatic expiry worker or payment-triggered reservation release yet; the release command exists for the payment slice.
- No procurement or fulfillment/shipping implementation.
- Existing V1 order-item snapshots may have null legacy title/currency values; new orders populate them.
- Product management UI/API for setting purchase mode and stock is not part of this slice; values currently require existing administrative/data tooling.
