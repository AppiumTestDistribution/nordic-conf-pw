#!/usr/bin/env node
/**
 * Merges this project's `playwright-test` MCP server into Cline's global
 * `cline_mcp_settings.json`. Idempotent. Preserves other servers the user has.
 *
 * Cline launches MCP servers from VS Code's install dir (not the workspace),
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

function clineSettingsPath() {
  const home = homedir();
  const segments = ['Code', 'User', 'globalStorage', 'saoudrizwan.claude-dev', 'settings', 'cline_mcp_settings.json'];
  switch (platform()) {
    case 'darwin':
      return join(home, 'Library', 'Application Support', ...segments);
    case 'linux':
      return join(home, '.config', ...segments);
    case 'win32':
      return join(process.env.APPDATA || join(home, 'AppData', 'Roaming'), ...segments);
    default:
      throw new Error(`Unsupported platform: ${platform()}`);
  }
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

  // Start from the project's MCP entry (keeps alwaysAllow + disabledTools),
  // then override command/args to use the absolute-path launcher so Cline
  // picks the right cwd.
  const projectServer = { ...projectMcp.mcpServers[SERVER_KEY] };
  delete projectServer.type;
  projectServer.command = 'node';
  projectServer.args = [LAUNCHER_PATH];

  const target = clineSettingsPath();
  mkdirSync(dirname(target), { recursive: true });

  const existing = readJson(target, { mcpServers: {} });
  existing.mcpServers ||= {};

  const before = JSON.stringify(existing.mcpServers[SERVER_KEY] ?? null);
  existing.mcpServers[SERVER_KEY] = projectServer;
  const after = JSON.stringify(projectServer);

  if (before === after) {
    console.log(`✓ Cline already has '${SERVER_KEY}' configured identically.`);
    console.log(`  ${target}`);
    return;
  }

  writeFileSync(target, JSON.stringify(existing, null, 2) + '\n');
  console.log(`✓ Updated Cline global settings:`);
  console.log(`  ${target}`);
  console.log(`  → Launcher: ${LAUNCHER_PATH}`);
  console.log(`\nNext: reload VS Code (Cmd/Ctrl-Shift-P → "Developer: Reload Window").`);
  console.log(`Then in Cline's MCP panel you should see '${SERVER_KEY}' connected.`);
}

try {
  main();
} catch (e) {
  console.error('cline:setup failed:', e.message);
  process.exit(1);
}
