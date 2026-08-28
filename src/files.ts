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
    if (!isUtf8Text(raw)) {
      warnings.push('skipped binary file: ' + relativePath);
      continue;
    }
    const truncated = raw.byteLength > config.maxFileBytes;
    const slice = truncated ? raw.subarray(0, config.maxFileBytes) : raw;
    const decoded = decodeUtf8Prefix(slice);
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

const utf8Decoder = new TextDecoder('utf-8', { fatal: true });

function isUtf8Text(raw: Buffer): boolean {
  if (raw.includes(0)) return false;
  try {
    utf8Decoder.decode(raw);
    return true;
  } catch {
    return false;
  }
}

function decodeUtf8Prefix(raw: Buffer): string {
  for (let end = raw.byteLength; end >= Math.max(0, raw.byteLength - 3); end -= 1) {
    try {
      return utf8Decoder.decode(raw.subarray(0, end));
    } catch {
      // A byte limit may split a multi-byte character; retry at its boundary.
    }
  }
  return '';
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
