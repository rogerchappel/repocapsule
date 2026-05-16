import test from 'node:test';
import assert from 'node:assert/strict';
import { matchesPattern } from '../src/patterns.js';

test('matches directory globs deterministically', () => {
  assert.equal(matchesPattern('src/index.ts', 'src/**'), true);
  assert.equal(matchesPattern('src/nested/file.ts', 'src/**'), true);
  assert.equal(matchesPattern('docs/readme.md', 'src/**'), false);
});

test('matches suffix and single-star globs', () => {
  assert.equal(matchesPattern('apps/demo/package.json', '**/package.json'), true);
  assert.equal(matchesPattern('.env.local', '.env.*'), true);
});
