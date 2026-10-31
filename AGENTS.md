# AGENTS.md

VS Code extension for PromptGuard: flags unprotected LLM SDK call sites as
diagnostics, and drives the PromptGuard CLI for scanning, fixing and status.
Scripts are in `package.json`; contributor workflow, test-file map and CI
steps are in `CONTRIBUTING.md`.

## The CLI is the only backend

Every scan, redaction, status and project lookup shells out to the CLI through
`src/cli.ts` and parses its stdout; the extension never calls
`api.promptguard.co`. Its contract is the CLI's stdout and exit codes, and
**exit 2 means findings with valid JSON on stdout**, not failure — treating
non-zero as failure has already shipped a bug here.
`src/test/suite/cliContract.test.ts` pins that contract against a stub binary.
**Read `docs/adr/0001-*` and `0002-*` before** changing how the CLI is invoked
or its output parsed, adding a network call, or adding API types / a spec-sync
workflow.

## Constraints

- **Zero runtime npm dependencies**: all logic goes through the CLI or VS Code
  APIs, which keeps the extension light and is why packaging uses
  `npx vsce package --no-dependencies`. Add packages as devDependencies only.
- **Stay compatible with VS Code ^1.80** (`engines.vscode`). The installed
  `@types/vscode` resolves to a much newer version, so `tsc` passing does not
  prove an API exists in 1.80; check the API's introduction version.

## Testing

`npm test` compiles first, then launches a real VS Code via
`@vscode/test-electron` (Mocha); it cannot run in plain Node. On headless
Linux run `xvfb-run -a npm test`.

## Secrets

Run `pre-commit install` once per clone: it wires a pre-push gitleaks scan of
the pushed commits. The repo is public and ships to the Marketplace, so a
credential that reaches `main` is world-readable at once and must be rotated,
not reverted; CI's `secret-scan.yml` is the backstop that `--no-verify` cannot
skip. Commit no API keys, tokens or credentials. When a test fixture
legitimately has to look like a key, add its path to the allowlist in
`.gitleaks.toml` (a written, reviewable exemption) rather than assembling the
key from fragments to dodge the scanner.

## GitHub holds no secrets

**Change a secret in Secret Manager; GitHub holds none.** Workflows read every
secret at run time from Google Secret Manager (`promptguard-production-472014`),
signed in as this repository through Workload Identity; GitHub keeps only
identifiers, as variables (`vars.*`). A workflow that names any `secrets.*` but
`GITHUB_TOKEN` fails CI (`scripts/check_no_github_secrets.py`). The inventory,
and how to add a secret with its per-secret grant:
[`ENVIRONMENT_VARIABLES.md` § CI/CD-only](https://github.com/promptguardhq/promptguard/blob/main/docs/04_engineering/reference/ENVIRONMENT_VARIABLES.md#cicd-only)
in the platform repo.

## Agent skills

### Issue tracker

Issues live in this repo's GitHub Issues, worked via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five canonical triage roles, each label string equal to its name. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `CONTEXT.md` plus `docs/adr/` at the repo root; add to them as terms and decisions settle. See `docs/agents/domain.md`.
