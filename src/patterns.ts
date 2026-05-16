export function matchesAnyPattern(relativePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(relativePath, pattern));
}

export function matchesPattern(relativePath: string, pattern: string): boolean {
  const path = normalizePath(relativePath);
  const normalizedPattern = normalizePath(pattern);

  if (normalizedPattern.endsWith('/**')) {
    const prefix = normalizedPattern.slice(0, -3);
    return path === prefix || path.startsWith(prefix + '/');
  }

  if (normalizedPattern.startsWith('**/')) {
    const suffix = normalizedPattern.slice(3);
    return path === suffix || path.endsWith('/' + suffix);
  }

  if (normalizedPattern.includes('*')) {
    return globToRegExp(normalizedPattern).test(path);
  }

  return path === normalizedPattern;
}

export function normalizePath(input: string): string {
  return input.replaceAll('\\\\', '/').replace(/^\.\//, '');
}

function globToRegExp(pattern: string): RegExp {
  const escaped = pattern
    .split('*')
    .map(escapeRegExp)
    .join('[^/]*');
  return new RegExp('^' + escaped + '$');
}

function escapeRegExp(input: string): string {
  let output = '';
  for (const char of input) {
    output += '.+?^{}()|[]\\$'.includes(char) ? '\\' + char : char;
  }
  return output;
}
