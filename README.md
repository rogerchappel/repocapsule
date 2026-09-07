# RepoCapsule

Sanitized deterministic repo capsules for bug reports and agent debugging. RepoCapsule turns a local repository into reviewed JSON plus readable Markdown: git facts, package metadata, selected files, and failing command logs without uploading anything by default.

## Install

From source:

~~~sh
npm install
npm run build
npm link
~~~

Or run directly from a checkout:

~~~sh
node dist/src/cli.js --help
~~~

## Quickstart

~~~sh
repocapsule init
repocapsule scan --markdown .repocapsule/report.md
repocapsule report --input .repocapsule/capsule.json --output .repocapsule/report.md
repocapsule doctor
~~~

Capture a failing command log:

~~~sh
repocapsule scan --cmd "npm test" --markdown .repocapsule/report.md
~~~

Or record a command directly. Everything after `--` is passed to that command,
including flags and arguments:

~~~sh
repocapsule record --output .repocapsule/capsule.json -- npm test -- --runInBand
~~~

Use a different repository root:

~~~sh
repocapsule scan --root ../some-project --output /tmp/some-project-capsule.json
~~~

## Command Line

~~~text
repocapsule init [--root DIR]
repocapsule scan [--root DIR] [--output FILE] [--markdown FILE] [--cmd COMMAND]
repocapsule record [--root DIR] [--output FILE] [--markdown FILE] -- COMMAND [ARGS...]
repocapsule report [--root DIR] [--input FILE] [--output FILE]
repocapsule doctor [--root DIR]
repocapsule --help
repocapsule --version
~~~

Options are command-specific. The `record` command is the only command that accepts positional arguments; place its command and arguments after `--`.
`repocapsule init` creates a new configuration and exits with an error without
changing the file if `repocapsule.config.json` already exists.

See [examples/bug-report-capsule.md](examples/bug-report-capsule.md) for a maintainer-facing workflow that captures a failing command and reviews the generated files before sharing.

## Demo

Run the checked-in fixture demo to generate both JSON and Markdown reports in a
temporary workspace:

~~~sh
bash demo/run-sample-capsule.sh
~~~

The walkthrough in [docs/tutorials/sanitized-bug-report.md](docs/tutorials/sanitized-bug-report.md)
explains the same flow step by step. Promotion drafts for a short video or
social thread live in [docs/promo/social-hooks.md](docs/promo/social-hooks.md).

## What It Captures

- Git branch, HEAD, status, and remotes when git is available.
- Package names, versions, scripts, dependencies, and dev dependencies from package.json files.
- Included text files with stable ordering, SHA-256 hashes, byte sizes, truncation flags, and redacted content.
- Optional command stdout and stderr.
- Redaction counts and warnings.

## JSON Output

Capsules use a stable schema with a clear stability contract:

- Object keys are sorted before writing.
- File traversal and arrays are sorted.
- `generatedAt` is fixed (`1970-01-01T00:00:00.000Z`) so repeated scans can be diffed.
- Git facts, package metadata, file SHA-256 hashes, and redacted content are fully deterministic for the same input.
- Command durations (`durationMs`) are measured at runtime using wall-clock time; they are always positive but vary between captures.

The default output path is .repocapsule/capsule.json. Markdown reports can be generated alongside JSON with --markdown or later with repocapsule report.

## Safety Model

RepoCapsule is local-first and share-by-review:

- No network calls are required for CLI use.
- .git, node_modules, dist, build, coverage, caches, .env files, keys, and .repocapsule outputs are ignored by default.
- Common GitHub, OpenAI, AWS, bearer token, password, token, secret, and api key patterns are redacted.
- Home directory paths are redacted unless allowHomePaths is enabled in repocapsule.config.json.
- Capsules are never uploaded automatically.

Always inspect capsule JSON and Markdown before attaching them to an issue or handing them to another agent.

## Configuration

`repocapsule init` writes `repocapsule.config.json` only when that file does not
already exist:

~~~json
{
  "schemaVersion": 1,
  "include": ["package.json", "src/**", "tests/**", "README.md"],
  "exclude": [".env", ".env.*"],
  "maxFileBytes": 64000,
  "allowHomePaths": false,
  "commands": []
}
~~~

Keep include patterns narrow for public reports. Add fixtures and failing test files intentionally rather than capturing whole repositories.

All fields are optional; omitted fields use the defaults written by `repocapsule init`.
Custom `exclude` entries are appended to the built-in safety exclusions. `schemaVersion`
must be `1`; `include`, `exclude`, and `commands` must be arrays of strings;
and `allowHomePaths` must be a boolean. `maxFileBytes` must be an integer from `1` through
`9,007,199,254,740,991` (`Number.MAX_SAFE_INTEGER`); fractional, zero, negative,
and larger values are rejected. Invalid configuration stops before scanning, running configured commands,
or writing output, with an error that identifies the configuration path and field.

## Verify

~~~sh
npm test
npm run check
npm run build
npm run smoke
npm run package:smoke
bash scripts/validate.sh
~~~

## Limitations

- Included files must be valid UTF-8 text without NUL bytes. Binary files are
  omitted from JSON and Markdown output and reported as
  `skipped binary file: <path>` warnings.
- Glob support is intentionally small: `*` matches characters within one path segment,
  while `**` matches across directories. A recursive segment such as `**/` matches zero
  or more directories, so `src/**/*.ts` includes both `src/app.ts` and
  `src/lib/deep/app.ts`. Other glob operators such as `?`, character classes, and braces
  are treated literally.
- No hosted storage, telemetry, auth, or background daemon.
- Redaction is a safety net, not a guarantee. Review output before sharing.

## Contributing

See CONTRIBUTING.md for contribution expectations and SECURITY.md for vulnerability reporting.

## License

MIT

## Verification

Run these checks before opening a PR or publishing a release:

```bash
npm test
npm run smoke
npm run package:smoke
npm run release:check
```
