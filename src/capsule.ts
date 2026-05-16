import path from 'node:path';
import { collectCommandLogs } from './commands.js';
import { collectFiles } from './files.js';
import { collectGitInfo } from './git.js';
import { collectPackageInfo } from './packages.js';
import { mergeRedactions, redactText } from './redact.js';
import type { Capsule, ScanOptions } from './types.js';
import { VERSION } from './version.js';

export async function createCapsule(options: ScanOptions): Promise<Capsule> {
  const root = path.resolve(options.root);
  const commands = options.commands ?? options.config.commands;
  const [git, packages, fileResult, commandResult] = await Promise.all([
    collectGitInfo(root),
    collectPackageInfo(root, options.config),
    collectFiles(root, options.config),
    collectCommandLogs(root, commands, options.config.allowHomePaths)
  ]);
  const redactedRoot = redactText(root, options.config.allowHomePaths);

  return {
    schemaVersion: 1,
    generatedAt: '1970-01-01T00:00:00.000Z',
    tool: {
      name: 'repocapsule',
      version: VERSION
    },
    root: redactedRoot.text,
    git,
    packages,
    files: fileResult.files,
    commands: commandResult.logs,
    redactions: mergeRedactions([
      redactedRoot.redactions,
      fileResult.redactions,
      commandResult.redactions
    ]),
    warnings: fileResult.warnings
  };
}

export function stableJson(value: unknown): string {
  return JSON.stringify(sortValue(value), null, 2) + '\n';
}

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, item]) => [key, sortValue(item)])
    );
  }
  return value;
}
