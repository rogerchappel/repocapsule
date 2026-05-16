import type { Capsule } from './types.js';

export function renderMarkdown(capsule: Capsule): string {
  const lines: string[] = [];
  lines.push('# RepoCapsule Report');
  lines.push('');
  lines.push('- Tool: repocapsule ' + capsule.tool.version);
  lines.push('- Root: ' + capsule.root);
  lines.push('- Git branch: ' + (capsule.git.branch ?? 'unknown'));
  lines.push('- Git head: ' + (capsule.git.head ?? 'unknown'));
  lines.push('- Files captured: ' + capsule.files.length);
  lines.push('- Commands captured: ' + capsule.commands.length);
  lines.push('');

  if (capsule.redactions.length > 0) {
    lines.push('## Redactions');
    lines.push('');
    for (const item of capsule.redactions) {
      lines.push('- ' + item.kind + ': ' + item.count);
    }
    lines.push('');
  }

  if (capsule.warnings.length > 0) {
    lines.push('## Warnings');
    lines.push('');
    for (const warning of capsule.warnings) {
      lines.push('- ' + warning);
    }
    lines.push('');
  }

  lines.push('## Packages');
  lines.push('');
  for (const pkg of capsule.packages) {
    lines.push('- ' + pkg.path + ': ' + (pkg.name ?? 'unnamed') + (pkg.version ? '@' + pkg.version : ''));
  }
  lines.push('');

  lines.push('## Files');
  lines.push('');
  for (const file of capsule.files) {
    lines.push('- ' + file.path + ' (' + file.bytes + ' bytes, sha256 ' + file.sha256.slice(0, 12) + ')');
  }
  lines.push('');

  if (capsule.commands.length > 0) {
    lines.push('## Commands');
    lines.push('');
    for (const command of capsule.commands) {
      lines.push('### ' + command.command);
      lines.push('');
      lines.push('- Exit: ' + String(command.exitCode));
      lines.push('- Duration: ' + command.durationMs + 'ms');
      if (command.stdout) {
        lines.push('');
        lines.push('~~~text');
        lines.push(command.stdout.trimEnd());
        lines.push('~~~');
      }
      if (command.stderr) {
        lines.push('');
        lines.push('~~~text');
        lines.push(command.stderr.trimEnd());
        lines.push('~~~');
      }
      lines.push('');
    }
  }

  return lines.join('\n').trimEnd() + '\n';
}
