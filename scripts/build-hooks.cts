#!/usr/bin/env node
/**
 * Copy Vector hooks to dist for installation.
 */

import fs from 'fs';
import path from 'path';

const HOOKS_DIR = path.join(__dirname, '..', 'hooks');
const DIST_DIR = path.join(HOOKS_DIR, 'dist');

// Hooks to copy (compiled .cjs output from .cts source)
const HOOKS_TO_COPY = [
  'vector-check-update.cjs',
  'vector-context-monitor.cjs',
  'vector-statusline.cjs',
];

function build(): void {
  if (!fs.existsSync(DIST_DIR)) {
    fs.mkdirSync(DIST_DIR, { recursive: true });
  }

  for (const hook of HOOKS_TO_COPY) {
    const src = path.join(HOOKS_DIR, hook);
    const dest = path.join(DIST_DIR, hook);

    if (!fs.existsSync(src)) {
      console.warn(`Warning: ${hook} not found, skipping`);
      continue;
    }

    console.log(`Copying ${hook}...`);
    fs.copyFileSync(src, dest);
    console.log(`  → ${dest}`);
  }

  console.log('\nBuild complete.');
}

build();
