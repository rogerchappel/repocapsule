import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { CapsuleConfig } from './types.js';

export const CONFIG_FILE = 'repocapsule.config.json';

export const DEFAULT_CONFIG: CapsuleConfig = {
  schemaVersion: 1,
  include: [
    'package.json',
    'package-lock.json',
    'pnpm-lock.yaml',
    'yarn.lock',
    'bun.lockb',
    'tsconfig.json',
    'src/**',
    'tests/**',
    'fixtures/**',
    'README.md',
    'docs/**'
  ],
  exclude: [
    '.git/**',
    'node_modules/**',
    'dist/**',
    'build/**',
    'coverage/**',
    '.next/**',
    '.turbo/**',
    '.cache/**',
    '.repocapsule/**',
    '*.pem',
    '*.key',
    '.env',
    '.env.*'
  ],
  maxFileBytes: 64_000,
  allowHomePaths: false,
  commands: []
};

export async function loadConfig(root: string): Promise<CapsuleConfig> {
  const configPath = path.join(root, CONFIG_FILE);
  try {
    const raw = await readFile(configPath, 'utf8');
    const parsed = JSON.parse(raw) as Partial<CapsuleConfig>;
    return normalizeConfig(parsed);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return DEFAULT_CONFIG;
    }
    throw error;
  }
}

export async function writeDefaultConfig(root: string): Promise<string> {
  const configPath = path.join(root, CONFIG_FILE);
  await writeFile(configPath, JSON.stringify(DEFAULT_CONFIG, null, 2) + '\n', 'utf8');
  return configPath;
}

export function normalizeConfig(input: Partial<CapsuleConfig>): CapsuleConfig {
  return {
    schemaVersion: 1,
    include: input.include?.length ? [...input.include] : [...DEFAULT_CONFIG.include],
    exclude: input.exclude?.length ? [...DEFAULT_CONFIG.exclude, ...input.exclude] : [...DEFAULT_CONFIG.exclude],
    maxFileBytes: Number.isFinite(input.maxFileBytes) && input.maxFileBytes! > 0
      ? Math.floor(input.maxFileBytes!)
      : DEFAULT_CONFIG.maxFileBytes,
    allowHomePaths: Boolean(input.allowHomePaths),
    commands: input.commands ? [...input.commands] : [...DEFAULT_CONFIG.commands]
  };
}
