// Checks the deal fee rule in src/lib/fees.ts. Run: node scripts/check-fees.mjs (Node 22.6+ runs the .ts directly).
import assert from 'node:assert/strict';

import { FULL_RATE, LAUNCH_RATE, mapleFee } from '../src/lib/fees.ts';

assert.equal(mapleFee(4_000_000, 'KRW', FULL_RATE), 320_000);
assert.equal(mapleFee(4_000_000, 'KRW', LAUNCH_RATE), 200_000);
assert.equal(mapleFee(100_000, 'KRW', FULL_RATE), 10_000, 'the ₩10,000 minimum');
assert.equal(mapleFee(5_000, 'KRW', FULL_RATE), 5_000, 'never more than the deal');
assert.equal(mapleFee(4_000_000, 'KRW', 0), 0, 'pilot events pay 0%');
assert.equal(mapleFee(0, 'KRW', FULL_RATE), 0, 'in-kind only');
assert.equal(mapleFee(250_000, 'USD', FULL_RATE), 20_000, 'no minimum outside KRW');
console.log('fees ok');
