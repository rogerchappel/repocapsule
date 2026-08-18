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
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`${configPath}: invalid JSON: ${(error as Error).message}`);
    }
    return normalizeConfig(parsed, configPath);
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

export function normalizeConfig(input: unknown, configPath = CONFIG_FILE): CapsuleConfig {
  if (!isRecord(input)) {
    throw configError(configPath, 'configuration must be a JSON object');
  }

  if (input.schemaVersion !== undefined && input.schemaVersion !== 1) {
    throw configError(configPath, 'schemaVersion must be 1');
  }
  const include = stringArray(input, 'include', configPath);
  const exclude = stringArray(input, 'exclude', configPath);
  const commands = stringArray(input, 'commands', configPath);
  if (input.maxFileBytes !== undefined &&
      (typeof input.maxFileBytes !== 'number' || !Number.isSafeInteger(input.maxFileBytes) || input.maxFileBytes <= 0)) {
    throw configError(configPath, 'maxFileBytes must be a positive safe integer');
  }
  if (input.allowHomePaths !== undefined && typeof input.allowHomePaths !== 'boolean') {
    throw configError(configPath, 'allowHomePaths must be a boolean');
  }

  return {
    schemaVersion: 1,
    include: include ?? [...DEFAULT_CONFIG.include],
    exclude: exclude ? [...DEFAULT_CONFIG.exclude, ...exclude] : [...DEFAULT_CONFIG.exclude],
    maxFileBytes: input.maxFileBytes === undefined
      ? DEFAULT_CONFIG.maxFileBytes
      : input.maxFileBytes as number,
    allowHomePaths: input.allowHomePaths === undefined ? DEFAULT_CONFIG.allowHomePaths : input.allowHomePaths as boolean,
    commands: commands ?? [...DEFAULT_CONFIG.commands]
  };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringArray(
  input: Record<string, unknown>,
  field: 'include' | 'exclude' | 'commands',
  configPath: string
): string[] | undefined {
  const value = input[field];
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) {
    throw configError(configPath, `${field} must be an array of strings`);
  }
  for (const [index, item] of value.entries()) {
    if (typeof item !== 'string') {
      throw configError(configPath, `${field}[${index}] must be a string`);
    }
  }
  return [...value] as string[];
}

function configError(configPath: string, message: string): Error {
  return new Error(`${configPath}: ${message}`);
}
