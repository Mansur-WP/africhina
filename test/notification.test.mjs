import assert from 'node:assert';
import { describe, it } from 'node:test';
import { buildNotificationWhere } from '../src/application/notifications/notificationQuery.js';

describe('Notification query ownership', () => {
  it('always scopes notification reads to the authenticated user', () => {
    assert.deepStrictEqual(buildNotificationWhere('customer-a'), {
      userId: 'customer-a',
    });
  });

  it('adds unread filtering without accepting a client user id', () => {
    assert.deepStrictEqual(buildNotificationWhere('customer-a', true), {
      userId: 'customer-a',
      read: false,
    });
  });
});
