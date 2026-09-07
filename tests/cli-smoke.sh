#!/usr/bin/env bash
set -euo pipefail

expect_failure() {
  local expected=$1
  shift
  local stderr
  if stderr=$(node "$repo_root/dist/src/cli.js" "$@" 2>&1 >/dev/null); then
    echo "expected command to fail: $*" >&2
    exit 1
  fi
  [[ "$stderr" == *"$expected"* ]] || {
    echo "expected stderr to contain '$expected', got: $stderr" >&2
    exit 1
  }
}

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tmp_dir="$(mktemp -d "/tmp/repocapsule-smoke.XXXXXX")"
trap 'rm -rf "$tmp_dir"' EXIT

cp -R "$repo_root/fixtures/sample-repo/." "$tmp_dir/"

malformed_root="$tmp_dir/malformed"
mkdir -p "$malformed_root"
printf '%s\n' '{"commands":"touch command-ran"}' >"$malformed_root/repocapsule.config.json"
expect_failure 'repocapsule.config.json: commands must be an array of strings' \
  scan --root "$malformed_root" --output capsule.json
test ! -e "$malformed_root/capsule.json"
test ! -e "$malformed_root/command-ran"

expect_failure 'Unknown option: --bogus' doctor --bogus value
expect_failure 'Unknown option: --ouptut' scan --ouptut capsule.json
for option in root output cmd; do
  expect_failure "Option --$option requires a value" scan "--$option"
done
expect_failure 'Option --root requires a value' doctor --root=

expect_failure 'Option --output is not valid for doctor' doctor --output ignored.json
expect_failure 'Option --input is not valid for init' init --root "$tmp_dir/init-target" --input ignored.json
expect_failure 'Option --cmd is not valid for report' report --cmd 'printf ignored'
expect_failure 'Option --input is not valid for scan' scan --input ignored.json
expect_failure 'Option --cmd is not valid for record' record --cmd 'printf ignored' -- printf valid
expect_failure 'Unexpected argument for doctor: unexpected' doctor unexpected
expect_failure 'Unexpected argument for init: unexpected' init unexpected
expect_failure 'Unexpected argument for scan: unexpected' scan unexpected
expect_failure 'Unexpected argument for report: unexpected' report unexpected
expect_failure 'Command scan does not accept --' scan -- printf unexpected
expect_failure 'Unexpected argument for record before --: unexpected' record unexpected -- printf valid

test ! -e "$tmp_dir/ignored.json"
test ! -e "$tmp_dir/init-target/repocapsule.config.json"

init_root="$tmp_dir/init-target"
mkdir -p "$init_root"
node "$repo_root/dist/src/cli.js" init --root "$init_root" | grep -F 'Wrote repocapsule.config.json' >/dev/null
test -s "$init_root/repocapsule.config.json"
cp "$init_root/repocapsule.config.json" "$tmp_dir/initial-config.json"
expect_failure 'repocapsule.config.json already exists; refusing to overwrite it' init --root "$init_root"
cmp "$tmp_dir/initial-config.json" "$init_root/repocapsule.config.json"

node "$repo_root/dist/src/cli.js" --help | grep -q '^Usage:'
node "$repo_root/dist/src/cli.js" --version | grep -Eq '^[0-9]+\.[0-9]+\.[0-9]+'
node "$repo_root/dist/src/cli.js" scan --help | grep -q '^Usage:'

node "$repo_root/dist/src/cli.js" doctor --root "$tmp_dir" >/dev/null
node "$repo_root/dist/src/cli.js" scan --root="$tmp_dir" --output=capsule.json --markdown=report.md \
  --cmd='printf first' --cmd 'printf second' >/dev/null
node "$repo_root/dist/src/cli.js" report --root "$tmp_dir" --input capsule.json --output report-again.md >/dev/null
node "$repo_root/dist/src/cli.js" record --root "$tmp_dir" --output record.json --markdown record.md -- \
  node -e 'setTimeout(() => console.log(process.argv.slice(1).join("|")), 100)' -- alpha "two words" >/dev/null

test -s "$tmp_dir/capsule.json"
test -s "$tmp_dir/report.md"
test -s "$tmp_dir/report-again.md"
test -s "$tmp_dir/record.json"
test -s "$tmp_dir/record.md"

if grep -R "ghp_abcdefghijklmnopqrstuvwxyz123456" "$tmp_dir/capsule.json" "$tmp_dir/report.md"; then
  echo "secret token leaked into smoke output" >&2
  exit 1
fi

node -e "const fs=require('node:fs'); const c=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); if(c.files.length < 3 || c.commands.length !== 2 || c.commands[0].command !== 'printf first' || c.commands[1].command !== 'printf second') process.exit(1)" "$tmp_dir/capsule.json"
node -e "const fs=require('node:fs'); const c=JSON.parse(fs.readFileSync(process.argv[1],'utf8')); const markdown=fs.readFileSync(process.argv[2],'utf8'); const log=c.commands[0]; if(c.commands.length !== 1 || log.exitCode !== 0 || log.stdout.trim() !== 'alpha|two words' || !log.command.includes(\"'-e'\") || !log.command.includes(\"'--'\") || log.durationMs <= 0 || !markdown.includes('- Duration: ' + log.durationMs + 'ms')) process.exit(1)" "$tmp_dir/record.json" "$tmp_dir/record.md"

if node "$repo_root/dist/src/cli.js" record --root "$tmp_dir" --output missing.json -- >"$tmp_dir/missing.stdout" 2>"$tmp_dir/missing.stderr"; then
  echo "record without a post-delimiter command unexpectedly succeeded" >&2
  exit 1
fi
grep -F "record requires a command after --" "$tmp_dir/missing.stderr" >/dev/null
test ! -e "$tmp_dir/missing.json"
