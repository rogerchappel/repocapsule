# Bug Report Capsule Workflow

Use this workflow when a maintainer asks for local evidence that can be
reviewed before sharing. It keeps the capture narrow, redacts common secrets,
and writes both machine-readable JSON and Markdown.

## 1. Create a focused config

```sh
repocapsule init
```

Edit `repocapsule.config.json` so `include` only names the files needed for the
bug report, such as `package.json`, `src/**`, `tests/**`, and the failing
fixture.

## 2. Capture the failure

```sh
repocapsule scan --cmd "npm test" --markdown .repocapsule/report.md
```

The command writes `.repocapsule/capsule.json` and
`.repocapsule/report.md`. The command output is captured locally; it is not
uploaded.

## 3. Review before sharing

```sh
repocapsule doctor
repocapsule report --input .repocapsule/capsule.json --output .repocapsule/report.md
```

Open both generated files and confirm that paths, logs, dependency names, and
selected file contents are appropriate for the issue. Delete the `.repocapsule/`
directory when the report is no longer needed.
