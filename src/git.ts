import { run } from './process.js';
import type { GitInfo } from './types.js';

export async function collectGitInfo(root: string): Promise<GitInfo> {
  const inside = await run('git rev-parse --is-inside-work-tree', root);
  if (inside.exitCode !== 0) {
    return { available: false, branch: null, head: null, status: [], remotes: [] };
  }

  const [branch, head, status, remotes] = await Promise.all([
    run('git branch --show-current', root),
    run('git rev-parse HEAD', root),
    run('git status --short', root),
    run('git remote -v', root)
  ]);

  return {
    available: true,
    branch: clean(branch.stdout) || null,
    head: clean(head.stdout) || null,
    status: lines(status.stdout),
    remotes: normalizeRemotes(remotes.stdout)
  };
}

function lines(input: string): string[] {
  return input
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .sort();
}

function clean(input: string): string {
  return input.trim();
}

function normalizeRemotes(input: string): string[] {
  return lines(input).map((line) => line.replace(/\s+/g, ' '));
}
