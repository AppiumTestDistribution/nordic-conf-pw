#!/usr/bin/env node
/**
 * Cross-platform replacement for `diff -r .roo/skills .clinerules/skills`.
 * Walks both trees, compares file lists + contents. Exits non-zero on drift.
 */
const { readdirSync, readFileSync, existsSync } = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const A = path.join(root, '.roo', 'skills');
const B = path.join(root, '.clinerules', 'skills');

function* walk(dir, base = dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(p, base);
    else yield path.relative(base, p);
  }
}

if (!existsSync(A) || !existsSync(B)) {
  console.error(`Missing tree:\n  ${A} ${existsSync(A) ? '' : '(absent)'}\n  ${B} ${existsSync(B) ? '' : '(absent)'}`);
  console.error(`Run \`npm run skills:sync\` to create the mirror.`);
  process.exit(1);
}

const filesA = new Set(walk(A));
const filesB = new Set(walk(B));
const onlyA = [...filesA].filter(f => !filesB.has(f));
const onlyB = [...filesB].filter(f => !filesA.has(f));
const differ = [...filesA]
  .filter(f => filesB.has(f))
  .filter(f => readFileSync(path.join(A, f)) + '' !== readFileSync(path.join(B, f)) + '');

if (onlyA.length || onlyB.length || differ.length) {
  if (onlyA.length) console.error(`Only in .roo/skills:\n  ${onlyA.join('\n  ')}`);
  if (onlyB.length) console.error(`Only in .clinerules/skills:\n  ${onlyB.join('\n  ')}`);
  if (differ.length) console.error(`Differ:\n  ${differ.join('\n  ')}`);
  console.error(`\nRun \`npm run skills:sync\` to repair.`);
  process.exit(1);
}

console.log('skills in sync');
