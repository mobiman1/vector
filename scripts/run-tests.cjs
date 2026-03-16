#!/usr/bin/env node
"use strict";
// Cross-platform test runner — resolves test file globs via Node
// instead of relying on shell expansion (which fails on Windows PowerShell/cmd).
// Propagates NODE_V8_COVERAGE so c8 collects coverage from the child process.
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = require("fs");
const path_1 = require("path");
const child_process_1 = require("child_process");
const testDir = (0, path_1.join)(__dirname, '..', 'tests');
const files = (0, fs_1.readdirSync)(testDir)
    .filter((f) => f.endsWith('.test.cjs'))
    .sort()
    .map((f) => (0, path_1.join)('tests', f));
if (files.length === 0) {
    console.error('No test files found in tests/');
    process.exit(1);
}
try {
    (0, child_process_1.execFileSync)(process.execPath, ['--test', ...files], {
        stdio: 'inherit',
        env: { ...process.env },
    });
}
catch (err) {
    process.exit(err.status || 1);
}
//# sourceMappingURL=run-tests.cjs.map