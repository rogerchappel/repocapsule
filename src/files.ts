import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { matchesAnyPattern, normalizePath } from './patterns.js';
import { redactText } from './redact.js';
import type { CapsuleConfig, FileEntry, Redaction } from './types.js';

export async function collectFiles(root: string, config: CapsuleConfig): Promise<{ files: FileEntry[]; redactions: Redaction[]; warnings: string[] }> {
  const allFiles = await walk(root, root);
  const warnings: string[] = [];
  const redactions: Redaction[] = [];
  const files: FileEntry[] = [];

  for (const relativePath of allFiles) {
    if (!matchesAnyPattern(relativePath, config.include)) continue;
    if (matchesAnyPattern(relativePath, config.exclude)) continue;

    const absolutePath = path.join(root, relativePath);
    const info = await stat(absolutePath);
    const raw = await readFile(absolutePath);
    const truncated = raw.byteLength > config.maxFileBytes;
    const slice = truncated ? raw.subarray(0, config.maxFileBytes) : raw;
    const decoded = slice.toString('utf8');
    const redacted = redactText(decoded, config.allowHomePaths);
    redactions.push(...redacted.redactions);

    if (truncated) {
      warnings.push('truncated file: ' + relativePath);
    }

    files.push({
      path: relativePath,
      bytes: info.size,
      sha256: createHash('sha256').update(raw).digest('hex'),
      truncated,
      content: redacted.text
    });
  }

  files.sort((a, b) => a.path.localeCompare(b.path));
  warnings.sort();
  return { files, redactions, warnings };
}

async function walk(root: string, current: string): Promise<string[]> {
  const entries = await readdir(current, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const absolutePath = path.join(current, entry.name);
    const relativePath = normalizePath(path.relative(root, absolutePath));
    if (entry.isDirectory()) {
      if (['.git', 'node_modules', 'dist', 'build', 'coverage'].includes(entry.name)) continue;
      files.push(...await walk(root, absolutePath));
    } else if (entry.isFile()) {
      files.push(relativePath);
    }
  }

  return files;
}
