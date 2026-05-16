import test from 'node:test';
import assert from 'node:assert/strict';
import { redactText } from '../src/redact.js';

test('redacts common token patterns and counts by kind', () => {
  const result = redactText('token=ghp_abcdefghijklmnopqrstuvwxyz123456 and Bearer abcdefghijklmnopqrstuvwxyz123456');

  assert.equal(result.text.includes('ghp_abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.equal(result.text.includes('Bearer abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.deepEqual(result.redactions.map((item) => item.kind), ['assignment-secret', 'bearer-token']);
});
