import assert from 'node:assert/strict';
import test from 'node:test';
import { reportingDayBounds } from './reporting-day.ts';

test('reporting day starts at 00:00 Lagos time', () => {
  const { startOfToday, startOfYesterday } = reportingDayBounds(new Date('2026-10-31T23:30:00Z'));
  assert.equal(startOfToday.toISOString(), '2026-10-31T23:00:00.000Z');
  assert.equal(startOfYesterday.toISOString(), '2026-10-30T23:00:00.000Z');
});

test('before the Lagos midnight it is still the previous Lagos day', () => {
  const { startOfToday } = reportingDayBounds(new Date('2026-10-31T22:59:00Z'));
  assert.equal(startOfToday.toISOString(), '2026-10-30T23:00:00.000Z');
});
