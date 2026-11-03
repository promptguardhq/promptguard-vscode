# Change Log

Product updates for every PromptGuard product, written for customers, are at [docs.promptguard.co/changelog](https://docs.promptguard.co/changelog); how long each version is supported is at [Versioning & support](https://docs.promptguard.co/versioning-and-support).

All notable changes to the PromptGuard VS Code extension will be documented in this file.

## [Unreleased]

## [0.6.8] - 2026-11-03

0.6.7 reached the GitHub release but not the Marketplace: its publish step
could not read the Marketplace credential. 0.6.8 is the same extension,
published to the Marketplace.

### Fixed

- **Releases publish to the Marketplace again.** The release workflow names
  its Google Cloud project when it signs in, so it can read the credential it
  publishes with.

## [0.6.7] - 2026-11-03

The repositories moved to the `promptguardhq` GitHub organization, and the
extension now points at the new location.

### Changed

- **The PromptGuard CLI is downloaded from `promptguardhq/promptguard-cli`.**
  The CLI installer, the install command the extension pre-fills in the
  terminal, and the manual-install link all named the old repository
  location, which only worked through GitHub's redirect.
- **The packaged extension no longer carries `scripts/`.** The release and
  git-hook scripts were shipped inside every `.vsix`; `.vscodeignore` now
  leaves them out.
- **The README says how to install in Cursor, Windsurf and other VS Code
  forks** (from the `.vsix` on the GitHub release, since the extension is not
  on Open VSX), that Escape cancels initialization, and how versions are
  supported.

### Security

- **minimatch and glob advisories (GHSA-g3hv-75wg-m249, GHSA-3g3m-2fjr-6pw4),
  and `@azure/msal-node`, `qs` and `serialize-javascript`, patched.**
  Development and packaging dependencies only: the extension declares no
  runtime dependencies, so none of them ship inside the `.vsix`. `npm audit`
  still lists eslint's minimatch 3.1.5, which eslint keeps on purpose.

### Added

- **Every Marketplace release is announced in Slack `#releases`.** The
  release workflow's new `announce` job posts the version, its GitHub Release
  and the Marketplace changelog after `publish`, through
  `scripts/post-release.sh`, a copy of the platform repo's script. It reads
  the `SLACK_RELEASES_WEBHOOK_URL` secret, and an unset secret or a Slack
  failure is a warning, never a failed release. The Marketplace already
  shows this file on its Changelog tab, because the package ships it.

## [0.6.6] - 2026-10-23

**No change to how the extension behaves.** Only `SECURITY.md`, which ships
inside the `.vsix`, changed since 0.6.5.

### Changed

- `SECURITY.md` links to the published disclosure policy
  (https://promptguard.co/security#reporting-a-vulnerability) instead of
  keeping its own copy of the response times.

## [0.6.5] - 2026-10-10

**No change to how the extension behaves.** Nothing under `src` changed since
0.6.4, and the extension declares no runtime dependencies, so none of the
packages below ship inside the `.vsix`. Every change is to the development and
packaging tree; this release exists so that tree's fixes are published rather
than only merged.

### Security

- **undici, markdown-it, brace-expansion and fast-uri advisories patched.**
  Development and packaging dependencies, reached through `@vscode/vsce`. The
  overrides now name the fixed releases: undici 7.29.1, markdown-it 14.3.1,
  fast-uri 3.1.8, and brace-expansion 1.1.21, 2.1.7 and 5.0.12 on its three
  release lines.
- **`braces` (GHSA-vfj7-8cjw-p6xm) is no longer in the tree.** It had no
  patched release and was reached through `@vscode/vsce` 3 → `secretlint` →
  `globby` → `fast-glob`. `@vscode/vsce` 4.0.0 drops that chain, and with it
  undici, markdown-it and fast-uri as well, so only brace-expansion remains of
  the packages above. `npm audit` reports no findings.

### Changed

- **`@vscode/vsce` 3.9.2 → 4.0.0**, the tool that packages and publishes the
  extension. It requires Node 22 or later, which CI and the release workflow
  already use. This is the first release published with it.
- `@types/node` 25.9.8, `typescript-eslint` (with its parser and plugin) 8.70.1
  and `prettier` 3.9.9 (#39). Type definitions, lint and formatting only.

## [0.6.4] - 2026-09-18

### Security

- **fast-uri, js-yaml and qs advisories patched** (#38). Development and
  packaging dependencies; nothing the extension does at runtime changes.
  Published so the Marketplace build no longer carries the vulnerable versions.

## [0.6.3] - 2026-09-06

**No change to how the extension behaves.** Nothing in this release alters what
you see or what the extension does; it is recorded rather than skipped so the
version bump is not unexplained.

### Changed

- **The published `.vsix` is now the artifact that was tested.** The release
  workflow used to rebuild the extension after CI had passed and publish that
  second build, so what reached the Marketplace was never the thing the tests
  ran against. It now downloads and publishes the tested package.
- Releases are gated on a non-empty CHANGELOG section, and the Release body is
  built from that section instead of a hardcoded block that described whichever
  release it was first written for.
- Pre-release tags are labelled as pre-releases.
- Secrets are scanned in CI rather than only by a local hook, and the pre-push
  gate is tracked in the repository instead of living on one machine.

### Fixed

- `npm test` runs on macOS again — `@vscode/test-electron` needed a bump (#33).

Dependency updates in this release are development-scope. The extension
declares no runtime dependencies at all, so none of them ship inside the
packaged `.vsix`.

## [0.6.2] - 2026-08-10

### Security

- Patched eight dependency advisories: `fast-uri`, `undici`, `js-yaml` and
  `brace-expansion`. All are development-scope, so none of them ship inside the
  packaged extension and **no behaviour changes for users** — this release exists
  so the repository reports clean.

## [0.6.0] - 2026-06-01

### Added

- Marketplace screenshots (inline diagnostics + quick-fix, status-bar states, sidebar view).
- `promptguard.autoInstallCli` now supports `auto` — silently install the CLI when it's not found — matching the documented behavior.
- `promptguard.scanOnSave` setting to re-scan the workspace when a supported file is saved (debounced).
- Sidebar quick actions for **Set API Key** and **Select Project**, plus a one-time first-run notice.

### Changed

- Unified refresh: a single `promptguard.refreshUI` command refreshes both the status bar and the tree, with a refresh button in the view title.
- API-key validation relaxed to accept any `pg_`-prefixed key (≥12 chars) so a backend key-format change can't break the client.
- CLI auto-install downloads are restricted to GitHub over HTTPS.

## [0.5.2] - 2026-04-18

### Fixed

- Packaged `.vsix` no longer includes the test suite, internal CI configs (`.github/`), AGENTS.md, `.pre-commit-config.yaml`, or ESLint/Prettier configs. Install size shrinks from ~74 KB / 46 files to ~53 KB / 29 files.

### Changed

- Bumped 7 dev-dependencies to current minor versions (`@eslint/js`, `@types/node`, `@typescript-eslint/*`, `eslint`, `glob`, `typescript-eslint`). `@types/vscode` deliberately held at `^1.80.0` to match `engines.vscode`.

## [0.2.1] - 2026-02-24

### Added

- AWS Bedrock provider support in init command
- Security scanning and PII redaction features to README
- Marketplace keywords for discoverability (cohere, aws-bedrock, gemini)

### Changed

- Updated documentation link to docs.promptguard.co

## [0.2.0] - 2026-02-20

### Added

- Precise diagnostic ranges using line/column data from CLI
- CodeAction provider for quick fixes on detected SDK usage
- Scan Selection command (right-click to scan selected text for threats)
- Redact Selection command (right-click to redact PII from selection)
- Scan File command (context menu on files in explorer)
- Secure API key storage using VS Code SecretStorage
- Sidebar tree view showing managed files and protection status
- Auto-download CLI installer from GitHub releases
- Progress indicators for long-running operations
- Helpful notification when CLI is not found
- Comprehensive test suite for all features

## [0.1.3] - 2026-01-15

### Added

- Gemini and Groq providers to init command

### Fixed

- Command injection vulnerability by using execFile instead of exec
- Redundant statusBar reference duplication

## [0.1.2] - 2025-12-01

### Changed

- Improved type safety by removing all 'any' types and unsafe type assertions
- Replaced polling mechanism with event-driven status updates for better performance
- Enhanced CLI wrapper with proper TypeScript types

### Fixed

- Fixed remaining type safety issues in CLI wrapper
- Removed unsafe `(window as any)` hacks

## [0.1.1] - 2025-11-30

### Added

- Extension icon for marketplace display

## [0.1.0] - 2025-11-30

### Added

- Initial release
- LLM SDK detection with diagnostics
- Status bar indicator
- Command palette integration
- CLI wrapper for all PromptGuard commands
- Support for TypeScript, JavaScript, and Python
- Auto-detection of CLI binary location
