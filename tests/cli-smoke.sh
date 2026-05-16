#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d "/tmp/repocapsule-smoke.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT

cp -R "$repo_root/fixtures/sample-repo/." "$tmp_dir/"

node "$repo_root/dist/cli.js" doctor --root "$tmp_dir" >/dev/null
node "$repo_root/dist/cli.js" scan --root "$tmp_dir" --output capsule.json --markdown report.md >/dev/null
node "$repo_root/dist/cli.js" report --root "$tmp_dir" --input capsule.json --output report-again.md >/dev/null

test -s "$tmp_dir/capsule.json"
test -s "$tmp_dir/report.md"
test -s "$tmp_dir/report-again.md"

if grep -R "ghp_abcdefghijklmnopqrstuvwxyz123456" "$tmp_dir/capsule.json" "$tmp_dir/report.md"; then
  echo "secret token leaked into smoke output" >&2
  exit 1
fi

node -e "const fs=require('node:fs'); const c=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if(c.files.length < 3 || c.commands.length !== 1) process.exit(1)" "$tmp_dir/capsule.json"
