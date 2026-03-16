#!/usr/bin/env node
// Cross-platform test runner — resolves test file globs via Node
// instead of relying on shell expansion (which fails on Windows PowerShell/cmd).
// Propagates NODE_V8_COVERAGE so c8 collects coverage from the child process.

import { readdirSync } from 'fs';
import { join } from 'path';
import { execFileSync } from 'child_process';

const testDir = join(__dirname, '..', 'tests');
const files = readdirSync(testDir)
  .filter((f: string) => f.endsWith('.test.cjs'))
  .sort()
  .map((f: string) => join('tests', f));

if (files.length === 0) {
  console.error('No test files found in tests/');
  process.exit(1);
}

try {
  execFileSync(process.execPath, ['--test', ...files], {
    stdio: 'inherit',
    env: { ...process.env },
  });
} catch (err) {
  process.exit((err as NodeJS.ErrnoException & { status?: number }).status || 1);
}
