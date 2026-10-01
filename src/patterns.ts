export function matchesAnyPattern(relativePath: string, patterns: string[]): boolean {
  return patterns.some((pattern) => matchesPattern(relativePath, pattern));
}

export function matchesPattern(relativePath: string, pattern: string): boolean {
  const path = normalizePath(relativePath);
  const normalizedPattern = normalizePath(pattern);

  if (normalizedPattern.includes('*')) {
    if (!isSupportedGlob(normalizedPattern)) return false;
    return globToRegExp(normalizedPattern).test(path);
  }

  return path === normalizedPattern;
}

export function normalizePath(input: string): string {
  return input.replaceAll('\\\\', '/').replace(/^\.\//, '');
}

function isSupportedGlob(pattern: string): boolean {
  for (let index = 0; index < pattern.length; index += 1) {
    const char = pattern[index]!;
    if (char === '?' || char === '[' || char === ']' || char === '{' || char === '}') return false;
    if (char === '*' && pattern[index + 1] === '*') {
      if (index > 0 && pattern[index - 1] !== '/') return false;
      const after = pattern[index + 2];
      if (after !== undefined && after !== '/') return false;
      index += 1;
    }
  }
  return true;
}

function globToRegExp(pattern: string): RegExp {
  let source = '';

  for (let index = 0; index < pattern.length;) {
    if (pattern[index] !== '*') {
      source += escapeRegExp(pattern[index]!);
      index += 1;
    } else if (pattern[index + 1] !== '*') {
      source += '[^/]*';
      index += 1;
    } else {
      index += 2;
      if (pattern[index] === '/') {
        source += '(?:[^/]+/)*';
        index += 1;
      } else {
        source += '.*';
      }
    }
  }

  return new RegExp('^' + source + '$');
}

function escapeRegExp(input: string): string {
  let output = '';
  for (const char of input) {
    output += '.+?^{}()|[]\\$'.includes(char) ? '\\' + char : char;
  }
  return output;
}
