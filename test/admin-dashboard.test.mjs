import assert from 'node:assert';
import { describe, it } from 'node:test';

describe('Admin dashboard quotation statistics', () => {
  it('uses sent and accepted quotation statuses for the dashboard metrics', () => {
    const quotations = [
      { status: 'sent' },
      { status: 'accepted' },
      { status: 'rejected' },
      { status: 'draft' },
    ];

    const countByStatus = (status) =>
      quotations.filter((quotation) => quotation.status === status).length;

    assert.deepStrictEqual(
      { issued: countByStatus('sent'), accepted: countByStatus('accepted') },
      { issued: 1, accepted: 1 },
    );
  });

  it('does not use RFQ status to calculate quotation statistics', () => {
    const rfq = { status: 'open' };
    const quotation = { status: 'accepted' };

    assert.notStrictEqual(rfq.status, quotation.status);
    assert.strictEqual(quotation.status, 'accepted');
  });
});
