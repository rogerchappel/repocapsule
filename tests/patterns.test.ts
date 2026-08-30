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
  assert.equal(matchesPattern('src/nested/index.ts', 'src/*.ts'), false);
});

test('matches recursive globs across zero or more path segments', () => {
  assert.equal(matchesPattern('src/app.ts', 'src/**/*.ts'), true);
  assert.equal(matchesPattern('src/lib/app.ts', 'src/**/*.ts'), true);
  assert.equal(matchesPattern('src/lib/deep/app.ts', 'src/**/*.ts'), true);
  assert.equal(matchesPattern('src/lib/app.js', 'src/**/*.ts'), false);
  assert.equal(matchesPattern('app.ts', 'src/**/*.ts'), false);
});
