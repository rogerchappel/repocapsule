import { spawn } from 'node:child_process';

export type RunResult = {
  exitCode: number | null;
  stdout: string;
  stderr: string;
  durationMs: number;
};

export function run(command: string, cwd: string): Promise<RunResult> {
  const started = Date.now();
  return new Promise((resolve) => {
    const child = spawn(command, {
      cwd,
      shell: true,
      env: { ...process.env, FORCE_COLOR: '0', NO_COLOR: '1' }
    });
    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf8');
    });
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8');
    });
    child.on('error', (error) => {
      stderr += error.message;
      resolve({ exitCode: null, stdout, stderr, durationMs: Date.now() - started });
    });
    child.on('close', (exitCode) => {
      resolve({ exitCode, stdout, stderr, durationMs: Date.now() - started });
    });
  });
}
