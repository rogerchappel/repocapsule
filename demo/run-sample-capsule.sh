#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d "/tmp/repocapsule-demo.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT

cp -R "$repo_root/fixtures/sample-repo/." "$tmp_dir/"

cd "$repo_root"
npm run build >/dev/null

node dist/src/cli.js scan \
  --root "$tmp_dir" \
  --output capsule.json \
  --markdown report.md \
  --cmd "npm test" >/dev/null

node dist/src/cli.js report \
  --root "$tmp_dir" \
  --input capsule.json \
  --output report-from-json.md >/dev/null

test -s "$tmp_dir/capsule.json"
test -s "$tmp_dir/report.md"
test -s "$tmp_dir/report-from-json.md"

if grep -R "ghp_abcdefghijklmnopqrstuvwxyz123456" "$tmp_dir/capsule.json" "$tmp_dir/report.md" >/dev/null; then
  echo "demo output leaked the fixture token" >&2
  exit 1
fi

node -e "const fs=require('node:fs'); const c=JSON.parse(fs.readFileSync(process.argv[1], 'utf8')); if (!Array.isArray(c.files) || c.files.length < 3) process.exit(1); if (!Array.isArray(c.commands) || c.commands.length !== 1) process.exit(1);" "$tmp_dir/capsule.json"

echo "Wrote demo capsule: $tmp_dir/capsule.json"
echo "Wrote demo report:  $tmp_dir/report.md"
