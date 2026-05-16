import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { collectFiles } from './files.js';
import type { CapsuleConfig, PackageInfo } from './types.js';

export async function collectPackageInfo(root: string, config: CapsuleConfig): Promise<PackageInfo[]> {
  const packageConfig = { ...config, include: ['package.json', '**/package.json'], exclude: config.exclude };
  const { files } = await collectFiles(root, packageConfig);
  const packages: PackageInfo[] = [];

  for (const file of files) {
    const absolutePath = path.join(root, file.path);
    try {
      const parsed = JSON.parse(await readFile(absolutePath, 'utf8')) as {
        name?: string;
        version?: string;
        scripts?: Record<string, string>;
        dependencies?: Record<string, string>;
        devDependencies?: Record<string, string>;
      };
      packages.push({
        path: file.path,
        name: parsed.name,
        version: parsed.version,
        scripts: Object.keys(parsed.scripts ?? {}).sort(),
        dependencies: Object.keys(parsed.dependencies ?? {}).sort(),
        devDependencies: Object.keys(parsed.devDependencies ?? {}).sort()
      });
    } catch {
      packages.push({
        path: file.path,
        scripts: [],
        dependencies: [],
        devDependencies: []
      });
    }
  }

  return packages.sort((a, b) => a.path.localeCompare(b.path));
}
