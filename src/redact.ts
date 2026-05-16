import os from 'node:os';
import type { Redaction } from './types.js';

type Pattern = {
  kind: string;
  regex: RegExp;
  replacement: string;
};

const SECRET_PATTERNS: Pattern[] = [
  { kind: 'github-token', regex: /gh[pousr]_[A-Za-z0-9_]{20,}/g, replacement: '[REDACTED:github-token]' },
  { kind: 'openai-key', regex: /sk-[A-Za-z0-9_-]{20,}/g, replacement: '[REDACTED:openai-key]' },
  { kind: 'aws-access-key', regex: /AKIA[0-9A-Z]{16}/g, replacement: '[REDACTED:aws-access-key]' },
  { kind: 'bearer-token', regex: /Bearer\s+[A-Za-z0-9._~+/=-]{20,}/gi, replacement: 'Bearer [REDACTED:bearer-token]' },
  { kind: 'assignment-secret', regex: /\b(?:api[_-]?key|token|secret|password)\s*=\s*[^\s'"]+/gi, replacement: '[REDACTED:assignment-secret]' }
];

export function redactText(input: string, allowHomePaths = false): { text: string; redactions: Redaction[] } {
  const counts = new Map<string, number>();
  let text = input;

  for (const pattern of SECRET_PATTERNS) {
    text = text.replace(pattern.regex, (match) => {
      counts.set(pattern.kind, (counts.get(pattern.kind) ?? 0) + 1);
      return preserveAssignmentName(match, pattern.replacement);
    });
  }

  if (!allowHomePaths) {
    const home = os.homedir();
    if (home) {
      const escapedHome = escapeRegExp(home);
      const homeRegex = new RegExp(escapedHome + '(?=/|$)', 'g');
      text = text.replace(homeRegex, () => {
        counts.set('home-path', (counts.get('home-path') ?? 0) + 1);
        return '[REDACTED:home]';
      });
    }
  }

  return {
    text,
    redactions: [...counts.entries()]
      .map(([kind, count]) => ({ kind, count }))
      .sort((a, b) => a.kind.localeCompare(b.kind))
  };
}

export function mergeRedactions(items: Redaction[][]): Redaction[] {
  const counts = new Map<string, number>();
  for (const list of items) {
    for (const item of list) {
      counts.set(item.kind, (counts.get(item.kind) ?? 0) + item.count);
    }
  }
  return [...counts.entries()]
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => a.kind.localeCompare(b.kind));
}

function preserveAssignmentName(match: string, replacement: string): string {
  const assignment = match.match(/^([^=]+)=/);
  return assignment ? assignment[1] + '=' + replacement : replacement;
}

function escapeRegExp(input: string): string {
  let output = '';
  for (const char of input) {
    output += '.+?^{}()|[]\\$'.includes(char) ? '\\' + char : char;
  }
  return output;
}
