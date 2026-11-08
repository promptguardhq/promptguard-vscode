#!/usr/bin/env node
/**
 * Architecture fitness check: the rules of ADR-0001 ("the extension reaches
 * PromptGuard only by running the CLI") and AGENTS.md, checked mechanically
 * instead of left to review.
 *
 *   1. Zero runtime npm dependencies. package.json has no `dependencies` (nor
 *      `optionalDependencies`); packaging relies on it
 *      (`vsce package --no-dependencies`).
 *   2. Only the CLI wrapper spawns processes. `child_process` is imported by
 *      `src/cli.ts`, through which every scan, redaction, status and project
 *      lookup goes, and by `src/cliInstaller.ts`, which runs the binary it
 *      just downloaded with `--version` to verify it. Nothing else.
 *   3. No network calls but the installer's. `http`, `https`, `http2`, `net`,
 *      `tls`, `dgram`, a fetch client package, or a `fetch(` /
 *      `XMLHttpRequest` / `WebSocket` call appear only in
 *      `src/cliInstaller.ts`, which fetches CLI release builds from GitHub
 *      (ADR-0001: "The only network code is src/cliInstaller.ts").
 *   4. The extension never calls the PromptGuard API: no source names the API
 *      host. (Links to app.promptguard.co opened in the browser are fine.)
 *
 * `src/test/` is exempt: tests drive a stub CLI and may do as they please.
 *
 *   node scripts/check-architecture.mjs
 *
 * Dependency-free on purpose, so it needs nothing but node.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const SRC = path.join(ROOT, "src");
const TESTS = path.join(SRC, "test");

const SPAWN_ALLOWED = new Set(["src/cli.ts", "src/cliInstaller.ts"]);
const NETWORK_ALLOWED = new Set(["src/cliInstaller.ts"]);
const NETWORK_MODULES = new Set([
  "http",
  "https",
  "http2",
  "net",
  "tls",
  "dgram",
  "undici",
  "node-fetch",
  "axios",
  "got",
  "ws",
]);
const NETWORK_GLOBALS = /\b(fetch|XMLHttpRequest|WebSocket|EventSource)\s*\(|\bnew\s+(XMLHttpRequest|WebSocket|EventSource)\b/g;
const API_HOST = /\bapi(?:\.staging)?\.promptguard\.co\b/g;

const violations = [];
function fail(where, rule, fix) {
  violations.push(`${where}: ${rule}\n    fix: ${fix}`);
}

// --- package.json ----------------------------------------------------------

const pkg = JSON.parse(readFileSync(path.join(ROOT, "package.json"), "utf8"));
for (const field of ["dependencies", "optionalDependencies"]) {
  const names = Object.keys(pkg[field] ?? {});
  if (names.length > 0) {
    fail(
      `package.json ${field}`,
      `the extension has zero runtime npm dependencies, but ${field} lists ${names.join(", ")}`,
      "do the work through the CLI or a VS Code API instead; a build or test tool belongs in " +
        "devDependencies (AGENTS.md, Constraints)",
    );
  }
}

// --- source scan -----------------------------------------------------------

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return full === TESTS ? [] : walk(full);
    return entry.name.endsWith(".ts") ? [full] : [];
  });
}

/** Blank out comments, keeping strings and newlines, so prose is not read as code. */
function stripComments(source) {
  const out = source.split("");
  let i = 0;
  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];
    if (c === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") out[i++] = " ";
      continue;
    }
    if (c === "/" && next === "*") {
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) {
        if (source[i] !== "\n") out[i] = " ";
        i++;
      }
      out[i] = " ";
      out[i + 1] = " ";
      i += 2;
      continue;
    }
    if (c === '"' || c === "'" || c === "`") {
      i++;
      while (i < source.length && source[i] !== c) i += source[i] === "\\" ? 2 : 1;
    }
    i++;
  }
  return out.join("");
}

const lineOf = (text, offset) => text.slice(0, offset).split("\n").length;
const MODULE_REFS = [
  /\bfrom\s*["']([^"']+)["']/g,
  /^[ \t]*import\s*["']([^"']+)["']/gm,
  /\b(?:require|import)\s*\(\s*["']([^"']+)["']\s*\)/g,
];

for (const file of walk(SRC)) {
  const rel = path.relative(ROOT, file).split(path.sep).join("/");
  const code = stripComments(readFileSync(file, "utf8"));
  const at = (offset) => `${rel}:${lineOf(code, offset)}`;

  for (const pattern of MODULE_REFS) {
    for (const m of code.matchAll(pattern)) {
      const mod = m[1].replace(/^node:/, "").split("/")[0];
      if (mod === "child_process" && !SPAWN_ALLOWED.has(rel)) {
        fail(
          at(m.index),
          `imports child_process; only src/cli.ts runs the CLI (ADR-0001)`,
          "call the CLI through the wrappers exported by src/cli.ts (add one there if the " +
            "command is new) instead of spawning a process here",
        );
      }
      if (NETWORK_MODULES.has(mod) && !NETWORK_ALLOWED.has(rel)) {
        fail(
          at(m.index),
          `imports "${m[1]}"; the extension makes no network calls but the CLI installer's (ADR-0001)`,
          "get the data from the CLI (src/cli.ts parses its stdout); if the API is genuinely " +
            "needed, that reverses ADR-0001, so supersede the ADR first",
        );
      }
    }
  }

  if (!NETWORK_ALLOWED.has(rel)) {
    for (const m of code.matchAll(NETWORK_GLOBALS)) {
      fail(
        at(m.index),
        `calls ${m[1] ?? m[2]}; the extension makes no network calls but the CLI installer's (ADR-0001)`,
        "get the data from the CLI (src/cli.ts) instead of the network",
      );
    }
  }

  for (const m of code.matchAll(API_HOST)) {
    fail(
      at(m.index),
      `names the PromptGuard API host (${m[0]}); the extension never calls the API (ADR-0001)`,
      "go through the CLI, which owns credentials, retries and the API's shapes",
    );
  }
}

if (violations.length > 0) {
  console.error(`check-architecture: ${violations.length} violation(s)\n`);
  for (const v of violations) console.error(`  ${v}\n`);
  console.error("The rules and why they exist: the header of scripts/check-architecture.mjs.");
  process.exit(1);
}
console.log("check-architecture: ok");
