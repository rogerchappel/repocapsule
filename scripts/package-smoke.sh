#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d "/tmp/repocapsule-package-smoke.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT

cd "$repo_root"
npm run build >/dev/null
pack_json="$(npm pack --json --pack-destination "$tmp_dir")"
tarball="$(node -e "const data = JSON.parse(process.argv[1]); console.log(data[0].filename)" "$pack_json")"
node -e "const data = JSON.parse(process.argv[1]); const files = new Set(data[0].files.map((file) => file.path)); for (const required of ['dist/src/cli.js', 'dist/src/index.js', 'examples/bug-report-capsule.md', 'fixtures/sample-repo/package.json']) { if (!files.has(required)) { console.error('Missing package file: ' + required); process.exit(1); } }" "$pack_json"

mkdir -p "$tmp_dir/app"
cd "$tmp_dir/app"
npm init -y >/dev/null
npm install "$tmp_dir/$tarball" >/dev/null

node -e "import('repocapsule').then((mod) => { if (typeof mod.createCapsule !== 'function') process.exit(1); })"

mkdir -p "$tmp_dir/sample-repo"
cp -R "$repo_root/fixtures/sample-repo/." "$tmp_dir/sample-repo/"
./node_modules/.bin/repocapsule doctor --root "$tmp_dir/sample-repo" >/dev/null
./node_modules/.bin/repocapsule scan --root "$tmp_dir/sample-repo" --output capsule.json --markdown report.md >/dev/null
test -s "$tmp_dir/sample-repo/capsule.json"
test -s "$tmp_dir/sample-repo/report.md"
