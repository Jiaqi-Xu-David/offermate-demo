import { readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { execFileSync } from 'node:child_process';

const roots = ['src', 'functions', 'tests', 'scripts'];
const files = [];

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await visit(path);
    else if (/\.(?:js|mjs)$/.test(entry.name)) files.push(path);
  }
}

for (const root of roots) await visit(root);
for (const file of files.sort()) execFileSync(process.execPath, ['--check', file], { stdio: 'pipe' });
console.log(`Syntax OK: ${files.length} JavaScript files.`);
