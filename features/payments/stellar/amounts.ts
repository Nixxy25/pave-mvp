// Stellar amounts are decimal strings with at most 7 fractional digits. They are
// converted to integer 1e-7 units with string arithmetic; floats are never used.
export function toUnits(amount: string): string {
  const match = /^(\d{1,12})(?:\.(\d{1,7}))?$/.exec(amount);
  if (!match) throw new Error(`Invalid Stellar amount: ${amount}`);
  return `${match[1]}${(match[2] ?? '').padEnd(7, '0')}`.replace(/^0+(?=\d)/, '');
}

export function compareUnits(a: string, b: string): number {
  const left = BigInt(a);
  const right = BigInt(b);
  return left < right ? -1 : left > right ? 1 : 0;
}

// Inverse of toUnits: integer 1e-7 units to a Stellar decimal string.
export function fromUnits(units: string): string {
  if (!/^\d{1,19}$/.test(units)) throw new Error(`Invalid amount units: ${units}`);
  const padded = units.padStart(8, '0');
  return `${padded.slice(0, -7).replace(/^0+(?=\d)/, '')}.${padded.slice(-7)}`;
}

// Customer-facing amounts are rounded UP to whole cents (1e5 units) so an invoice is
// never under-quoted; integer arithmetic only.
export const CENT_UNITS = BigInt(100000);
export function roundUpToCents(exactUnits: bigint): bigint {
  if (exactUnits <= BigInt(0)) throw new Error('Amount must be positive.');
  return ((exactUnits + CENT_UNITS - BigInt(1)) / CENT_UNITS) * CENT_UNITS;
}
