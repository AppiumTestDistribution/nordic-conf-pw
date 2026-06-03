#!/usr/bin/env node
/**
 * Launches `playwright run-test-mcp-server` with cwd set to this project's
 * root, so the MCP server can resolve relative paths (e.g. `tests/seed.spec.ts`).
 *
 * Needed for Cline, which launches MCP servers from VS Code's install dir
 * rather than the workspace (Cline issue #2635). Roo Code sets cwd correctly
 * on its own, so this launcher is harmless there.
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

const isWin = process.platform === 'win32';
const cmd = isWin ? 'npx.cmd' : 'npx';

const child = spawn(cmd, ['playwright', 'run-test-mcp-server'], {
  stdio: 'inherit',
  shell: isWin,
  cwd: projectRoot,
});

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => child.kill(sig));
}
