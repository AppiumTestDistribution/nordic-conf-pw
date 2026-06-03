#!/usr/bin/env node
/**
 * Cross-platform replacement for `rsync -a --delete .roo/skills/ .clinerules/skills/`.
 * Uses Node's built-in fs.cpSync — no shell dependency, works on Windows.
 */
const { rmSync, cpSync, existsSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const src = path.join(root, '.roo', 'skills');
const dst = path.join(root, '.clinerules', 'skills');

if (!existsSync(src)) {
  console.error(`Source missing: ${src}`);
  process.exit(1);
}

rmSync(dst, { recursive: true, force: true });
cpSync(src, dst, { recursive: true });
console.log(`Synced ${path.relative(root, src)} → ${path.relative(root, dst)}`);
