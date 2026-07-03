# Sanitized Bug Report Demo

This recipe shows how to create a local RepoCapsule report from the checked-in
sample repository, including a command log, without uploading data.

## Run the demo

```sh
bash demo/run-sample-capsule.sh
```

The script:

- copies `fixtures/sample-repo` into a temporary directory;
- builds the local CLI;
- writes `capsule.json` and `report.md`;
- records one command with `--cmd "npm test"`;
- verifies the fixture token is redacted from JSON and Markdown output.

## Manual version

```sh
npm run build
tmp_dir="$(mktemp -d)"
cp -R fixtures/sample-repo/. "$tmp_dir/"
node dist/src/cli.js scan --root "$tmp_dir" --output capsule.json --markdown report.md --cmd "npm test"
node dist/src/cli.js report --root "$tmp_dir" --input capsule.json --output report-from-json.md
```

Inspect both files before sharing them in an issue or with another agent.
RepoCapsule is designed to make review easier, not to replace human review.

## What to point out in a walkthrough

- The report is generated from local files and local command output.
- Default excludes avoid `.git`, `node_modules`, build output, caches, and
  `.repocapsule` output directories.
- Secret-like fixture content is redacted before the script succeeds.
- The JSON stays deterministic so repeated captures can be diffed.
