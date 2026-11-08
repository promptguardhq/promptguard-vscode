#!/usr/bin/env bash
# The local gate: what .github/workflows/ci.yml runs, as one command. Run it
# before you hand back a change; the pre-push hook runs it too.
#
#   bash scripts/check.sh            # everything CI runs
#   bash scripts/check.sh --fast     # skip the VS Code test run (the pre-push hook)
#
# Not covered: `vsce package`. Needs `npm ci` first. The test run downloads
# and drives a real VS Code, which is why the hook skips it.
set -euo pipefail
cd "$(git rev-parse --show-toplevel)"
step() { printf '==> %s\n' "$*"; }

step "GitHub holds no secrets; agent files load and resolve; no em or en dashes"
python3 scripts/check_no_github_secrets.py --check
python3 scripts/check_agent_files.py --check
python3 scripts/check_no_dashes.py --check

step "architecture fitness: CLI-only backend, no network, zero runtime deps"
node scripts/check-architecture.mjs

step "lint and format"
npm run lint --silent
npm run format:check --silent
step "compile"
npm run compile --silent
test -f out/extension.js || { echo "check: out/extension.js missing after compile" >&2; exit 1; }
if [ "${1:-}" != "--fast" ]; then
  step "tests (a real VS Code)"
  npm test --silent
fi
echo "check: all passed"
