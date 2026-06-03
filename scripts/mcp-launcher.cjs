#!/usr/bin/env node
/**
 * Launches `playwright run-test-mcp-server` with cwd set to this project's
 * root, so the MCP server can resolve relative paths (e.g. `tests/seed.spec.ts`).
 *
 * Needed for Cline, which launches MCP servers from VS Code's install dir
 * rather than the workspace (Cline issue #2635). Roo Code sets cwd correctly
 * on its own, so this launcher is harmless there.
 *
 * Also repairs Cline tool-call payloads: Cline sometimes serializes deeply
 * nested array/object args as JSON strings rather than real arrays. The MCP
 * server's Zod input schema rejects those ("expected array, received string").
 * For known-affected tools we detect the string form and JSON.parse it before
 * forwarding to the server. Roo passes real arrays, so the intercept is a
 * no-op there.
 */
const { spawn } = require('node:child_process');
const path = require('node:path');

const projectRoot = path.resolve(__dirname, '..');
process.chdir(projectRoot);

const isWin = process.platform === 'win32';
const cmd = isWin ? 'npx.cmd' : 'npx';

const NESTED_ARRAY_ARGS = {
  planner_save_plan: ['suites'],
  planner_submit_plan: ['suites'],
};

function repairToolCall(msg) {
  if (!msg || msg.method !== 'tools/call' || !msg.params) return msg;
  const { name, arguments: args } = msg.params;
  const keys = NESTED_ARRAY_ARGS[name];
  if (!keys || !args || typeof args !== 'object') return msg;
  for (const key of keys) {
    const val = args[key];
    if (typeof val === 'string' && (val.startsWith('[') || val.startsWith('{'))) {
      try {
        args[key] = JSON.parse(val);
      } catch {
        // leave as-is; server will surface its own validation error
      }
    }
  }
  return msg;
}

const child = spawn(cmd, ['playwright', 'run-test-mcp-server'], {
  stdio: ['pipe', 'pipe', 'inherit'],
  shell: isWin,
  cwd: projectRoot,
});

child.stdout.pipe(process.stdout);

let inBuf = '';
process.stdin.on('data', chunk => {
  inBuf += chunk.toString('utf8');
  let nl;
  while ((nl = inBuf.indexOf('\n')) !== -1) {
    const line = inBuf.slice(0, nl);
    inBuf = inBuf.slice(nl + 1);
    if (!line.trim()) {
      child.stdin.write('\n');
      continue;
    }
    let msg;
    try {
      msg = JSON.parse(line);
    } catch {
      child.stdin.write(line + '\n');
      continue;
    }
    child.stdin.write(JSON.stringify(repairToolCall(msg)) + '\n');
  }
});

process.stdin.on('end', () => child.stdin.end());

child.on('exit', (code, signal) => {
  if (signal) process.kill(process.pid, signal);
  process.exit(code ?? 1);
});

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => child.kill(sig));
}
