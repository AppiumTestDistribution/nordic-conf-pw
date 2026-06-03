#!/usr/bin/env node
/**
 * Merges this project's `playwright-test` MCP server into Cline's global
 * `cline_mcp_settings.json`. Idempotent. Preserves other servers the user has.
 *
 * Writes to every detected Cline host (VS Code, Cursor, VSCodium, Code Insiders).
 *
 * Cline launches MCP servers from the host's install dir (not the workspace),
 * so we override `command` to point at this project's `scripts/mcp-launcher.cjs`
 * via its absolute path. The launcher `cd`s to the project root before
 * exec'ing the real MCP server, fixing relative-path resolution (the
 * "seed test not found" error).
 *
 * Run: `npm run cline:setup`
 */
const { homedir, platform } = require('node:os');
const { join, dirname, resolve } = require('node:path');
const { existsSync, readFileSync, writeFileSync, mkdirSync } = require('node:fs');

const SERVER_KEY = 'playwright-test';
const PROJECT_ROOT = resolve(__dirname, '..');
const PROJECT_MCP_PATH = join(PROJECT_ROOT, '.roo', 'mcp.json');
const LAUNCHER_PATH = join(PROJECT_ROOT, 'scripts', 'mcp-launcher.cjs');

const SETTINGS_SEGMENTS = ['User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'];

// Hosts that ship the Cline extension. Order matches the parent dir under
// the per-OS Application Support / config root.
const HOST_DIRS = ['Code', 'Cursor', 'Code - Insiders', 'VSCodium'];

function hostRoot() {
  const home = homedir();
  switch (platform()) {
    case 'darwin':
      return join(home, 'Library', 'Application Support');
    case 'linux':
      return join(home, '.config');
    case 'win32':
      return process.env.APPDATA || join(home, 'AppData', 'Roaming');
    default:
      throw new Error(`Unsupported platform: ${platform()}`);
  }
}

function detectedHostConfigs() {
  const root = hostRoot();
  return HOST_DIRS
    .map(host => ({ host, path: join(root, host, ...SETTINGS_SEGMENTS) }))
    // Include hosts where the host dir exists (extension may be installed
    // but the config file not yet created — we'll create it).
    .filter(({ path: p }) => existsSync(dirname(dirname(dirname(p)))));
}

function readJson(path, fallback) {
  if (!existsSync(path)) return fallback;
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`Existing file at ${path} is not valid JSON. Fix or remove it before re-running.\n  ${e.message}`);
  }
}

function main() {
  const projectMcp = readJson(PROJECT_MCP_PATH, null);
  if (!projectMcp?.mcpServers?.[SERVER_KEY]) {
    throw new Error(`Project MCP file missing or has no '${SERVER_KEY}' server: ${PROJECT_MCP_PATH}`);
  }
  if (!existsSync(LAUNCHER_PATH)) {
    throw new Error(`Launcher script missing: ${LAUNCHER_PATH}`);
  }

  const projectServer = { ...projectMcp.mcpServers[SERVER_KEY] };
  delete projectServer.type;
  projectServer.command = 'node';
  projectServer.args = [LAUNCHER_PATH];

  const targets = detectedHostConfigs();
  if (targets.length === 0) {
    throw new Error(`No Cline host (VS Code / Cursor / VSCodium / Code Insiders) detected on this machine.`);
  }

  for (const { host, path: target } of targets) {
    mkdirSync(dirname(target), { recursive: true });
    const existing = readJson(target, { mcpServers: {} });
    existing.mcpServers ||= {};

    const before = JSON.stringify(existing.mcpServers[SERVER_KEY] ?? null);
    existing.mcpServers[SERVER_KEY] = projectServer;
    const after = JSON.stringify(projectServer);

    if (before === after) {
      console.log(`✓ [${host}] already configured identically.`);
    } else {
      writeFileSync(target, JSON.stringify(existing, null, 2) + '\n');
      console.log(`✓ [${host}] updated.`);
    }
    console.log(`    ${target}`);
  }

  console.log(`\n→ Launcher: ${LAUNCHER_PATH}`);
  console.log(`Next: reload the host(s) above (Cmd/Ctrl-Shift-P → "Developer: Reload Window").`);
  console.log(`If a tool still reports "not found" after reload, open Cline's MCP panel and toggle the tool on individually — UI toggles override disabledTools.`);
}

try {
  main();
} catch (e) {
  console.error('cline:setup failed:', e.message);
  process.exit(1);
}
