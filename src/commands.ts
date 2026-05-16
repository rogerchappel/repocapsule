import { run } from './process.js';
import { redactText } from './redact.js';
import type { CommandLog, Redaction } from './types.js';

export async function collectCommandLogs(root: string, commands: string[], allowHomePaths: boolean): Promise<{ logs: CommandLog[]; redactions: Redaction[] }> {
  const logs: CommandLog[] = [];
  const redactions: Redaction[] = [];

  for (const command of commands) {
    const result = await run(command, root);
    const stdout = redactText(result.stdout, allowHomePaths);
    const stderr = redactText(result.stderr, allowHomePaths);
    redactions.push(...stdout.redactions, ...stderr.redactions);
    logs.push({
      command,
      exitCode: result.exitCode,
      stdout: stdout.text,
      stderr: stderr.text,
      durationMs: 0
    });
  }

  return { logs, redactions };
}
