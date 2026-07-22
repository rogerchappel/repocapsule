import test from 'node:test';
import assert from 'node:assert/strict';
import os from 'node:os';
import { redactText } from '../src/redact.js';

test('redacts common token patterns and counts by kind', () => {
  const result = redactText('token=ghp_abcdefghijklmnopqrstuvwxyz123456 and Bearer abcdefghijklmnopqrstuvwxyz123456');

  assert.equal(result.text.includes('ghp_abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.equal(result.text.includes('Bearer abcdefghijklmnopqrstuvwxyz123456'), false);
  assert.deepEqual(result.redactions.map((item) => item.kind), ['assignment-secret', 'bearer-token', 'github-token']);
});

test('redacts fine-grained GitHub tokens', () => {
  const token = 'github_pat_1234567890abcdefghijklmnop';
  const result = redactText(token);

  assert.equal(result.text, '[REDACTED:github-token]');
  assert.equal(result.text.includes(token), false);
  assert.deepEqual(result.redactions, [{ kind: 'github-token', count: 1 }]);
});

test('redacts quoted and unquoted secret assignments', () => {
  const values = ['double-quoted-secret-value', 'single-quoted-secret-value', 'unquoted-secret-value'];
  const input = `TOKEN="${values[0]}"\nsecret='${values[1]}'\napi_key=${values[2]}`;
  const result = redactText(input);

  assert.equal(result.text, [
    'TOKEN=[REDACTED:assignment-secret]',
    'secret=[REDACTED:assignment-secret]',
    'api_key=[REDACTED:assignment-secret]'
  ].join('\n'));
  for (const value of values) {
    assert.equal(result.text.includes(value), false);
  }
  assert.deepEqual(result.redactions, [{ kind: 'assignment-secret', count: 3 }]);
});

test('redacts the current user home path by default', () => {
  const home = os.homedir();
  const result = redactText(`${home}/example/project`);

  assert.equal(result.text, '[REDACTED:home]/example/project');
  assert.deepEqual(result.redactions, [{ kind: 'home-path', count: 1 }]);
});
