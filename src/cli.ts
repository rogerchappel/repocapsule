#!/usr/bin/env node
import { realpathSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCapsule, stableJson } from './capsule.js';
import { CONFIG_FILE, loadConfig, writeDefaultConfig } from './config.js';
import { renderMarkdown } from './markdown.js';
import { VERSION } from './version.js';

type ParsedArgs = {
  command: string;
  flags: Map<string, string[]>;
  positionals: string[];
};

export async function main(argv = process.argv.slice(2)): Promise<number> {
  const args = parseArgs(argv);

  if (args.flags.has('help') || !args.command) {
    printHelp();
    return 0;
  }

  if (args.flags.has('version')) {
    console.log(VERSION);
    return 0;
  }

  try {
    if (args.command === 'init') return await initCommand(args);
    if (args.command === 'scan') return await scanCommand(args, false);
    if (args.command === 'record') return await scanCommand(args, true);
    if (args.command === 'report') return await reportCommand(args);
    if (args.command === 'doctor') return await doctorCommand(args);
    console.error('Unknown command: ' + args.command);
    return 1;
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

function parseArgs(argv: string[]): ParsedArgs {
  const flags = new Map<string, string[]>();
  const positionals: string[] = [];
  let command = '';

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index]!;
    if (!command && !arg.startsWith('-')) {
      command = arg;
      continue;
    }
    if (arg.startsWith('--')) {
      const [rawKey, inlineValue] = arg.slice(2).split('=', 2);
      const key = rawKey!;
      const value = inlineValue ?? (argv[index + 1] && !argv[index + 1]!.startsWith('-') ? argv[++index] : 'true');
      flags.set(key, [...(flags.get(key) ?? []), value!]);
    } else {
      positionals.push(arg);
    }
  }

  return { command, flags, positionals };
}

async function initCommand(args: ParsedArgs): Promise<number> {
  const root = resolveRoot(args);
  const configPath = await writeDefaultConfig(root);
  console.log('Wrote ' + path.relative(root, configPath));
  return 0;
}

async function scanCommand(args: ParsedArgs, includeCommandPositionals: boolean): Promise<number> {
  const root = resolveRoot(args);
  const config = await loadConfig(root);
  const output = flag(args, 'output') ?? '.repocapsule/capsule.json';
  const markdown = flag(args, 'markdown');
  const commands = flags(args, 'cmd');
  if (includeCommandPositionals && args.positionals.length > 0) {
    commands.push(args.positionals.join(' '));
  }

  const capsule = await createCapsule({
    root,
    config,
    commands: commands.length > 0 ? commands : config.commands
  });
  await writeOutput(root, output, stableJson(capsule));
  if (markdown) {
    await writeOutput(root, markdown, renderMarkdown(capsule));
  }
  console.log(path.relative(root, path.resolve(root, output)));
  return 0;
}

async function reportCommand(args: ParsedArgs): Promise<number> {
  const root = resolveRoot(args);
  const input = flag(args, 'input') ?? '.repocapsule/capsule.json';
  const output = flag(args, 'output') ?? '.repocapsule/report.md';
  const capsule = JSON.parse(await readFile(path.resolve(root, input), 'utf8'));
  await writeOutput(root, output, renderMarkdown(capsule));
  console.log(path.relative(root, path.resolve(root, output)));
  return 0;
}

async function doctorCommand(args: ParsedArgs): Promise<number> {
  const root = resolveRoot(args);
  const config = await loadConfig(root);
  console.log(stableJson({
    ok: true,
    root,
    configFile: CONFIG_FILE,
    include: config.include.length,
    exclude: config.exclude.length,
    maxFileBytes: config.maxFileBytes,
    commands: config.commands.length
  }));
  return 0;
}

function resolveRoot(args: ParsedArgs): string {
  return path.resolve(flag(args, 'root') ?? process.cwd());
}

async function writeOutput(root: string, target: string, content: string): Promise<void> {
  const outputPath = path.resolve(root, target);
  await mkdir(path.dirname(outputPath), { recursive: true });
  await writeFile(outputPath, content, 'utf8');
}

function flag(args: ParsedArgs, name: string): string | undefined {
  return args.flags.get(name)?.at(-1);
}

function flags(args: ParsedArgs, name: string): string[] {
  return [...(args.flags.get(name) ?? [])].filter((value) => value !== 'true');
}

function printHelp(): void {
  console.log([
    'repocapsule ' + VERSION,
    '',
    'Usage:',
    '  repocapsule init [--root DIR]',
    '  repocapsule scan [--root DIR] [--output FILE] [--markdown FILE] [--cmd COMMAND]',
    '  repocapsule record [--root DIR] [--output FILE] -- COMMAND',
    '  repocapsule report [--root DIR] [--input FILE] [--output FILE]',
    '  repocapsule doctor [--root DIR]',
    ''
  ].join('\n'));
}

const invokedPath = process.argv[1];
if (invokedPath && realpathSync(fileURLToPath(import.meta.url)) === realpathSync(invokedPath)) {
  process.exitCode = await main();
}
