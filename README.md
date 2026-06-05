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

Use a different repository root:

~~~sh
repocapsule scan --root ../some-project --output /tmp/some-project-capsule.json
~~~

## What It Captures

- Git branch, HEAD, status, and remotes when git is available.
- Package names, versions, scripts, dependencies, and dev dependencies from package.json files.
- Included text files with stable ordering, SHA-256 hashes, byte sizes, truncation flags, and redacted content.
- Optional command stdout and stderr.
- Redaction counts and warnings.

## JSON Output

Capsules are deterministic by design:

- Object keys are sorted before writing.
- File traversal and arrays are sorted.
- generatedAt is fixed in the MVP so repeated scans can be diffed.
- Command duration is normalized to 0 because wall-clock timing is not reproducible.

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

repocapsule init writes repocapsule.config.json:

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

## Verify

~~~sh
npm test
npm run check
npm run build
npm run smoke
bash scripts/validate.sh
~~~

## Limitations

- Text files only; binary contents are not interpreted.
- Glob support is intentionally small and focused on common include/exclude patterns.
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
