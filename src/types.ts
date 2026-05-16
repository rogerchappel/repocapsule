export type CapsuleConfig = {
  schemaVersion: 1;
  include: string[];
  exclude: string[];
  maxFileBytes: number;
  allowHomePaths: boolean;
  commands: string[];
};

export type Redaction = {
  kind: string;
  count: number;
};

export type FileEntry = {
  path: string;
  bytes: number;
  sha256: string;
  truncated: boolean;
  content: string;
};

export type GitInfo = {
  available: boolean;
  branch: string | null;
  head: string | null;
  status: string[];
  remotes: string[];
};

export type PackageInfo = {
  path: string;
  name?: string;
  version?: string;
  scripts: string[];
  dependencies: string[];
  devDependencies: string[];
};

export type CommandLog = {
  command: string;
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
};

export type Capsule = {
  schemaVersion: 1;
  generatedAt: string;
  tool: {
    name: 'repocapsule';
    version: string;
  };
  root: string;
  git: GitInfo;
  packages: PackageInfo[];
  files: FileEntry[];
  commands: CommandLog[];
  redactions: Redaction[];
  warnings: string[];
};

export type ScanOptions = {
  root: string;
  config: CapsuleConfig;
  commands?: string[];
};
