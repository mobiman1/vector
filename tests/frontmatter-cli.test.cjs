"use strict";
/**
 * Vector Tools Tests - frontmatter CLI integration
 *
 * Integration tests for the 4 frontmatter subcommands (get, set, merge, validate)
 * exercised through vector-tools.cjs via execSync.
 *
 * Each test creates its own temp file, runs the CLI command, asserts output,
 * and cleans up in afterEach (per-test cleanup with individual temp files).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const helpers_cjs_1 = require("./helpers.cjs");
// Track temp files for cleanup
let tempFiles = [];
function writeTempFile(content) {
    const tmpFile = path_1.default.join(os_1.default.tmpdir(), `vector-fm-test-${Date.now()}-${Math.random().toString(36).slice(2)}.md`);
    fs_1.default.writeFileSync(tmpFile, content, 'utf-8');
    tempFiles.push(tmpFile);
    return tmpFile;
}
(0, node_test_1.afterEach)(() => {
    for (const f of tempFiles) {
        try {
            fs_1.default.unlinkSync(f);
        }
        catch { /* already cleaned */ }
    }
    tempFiles = [];
});
// ─── frontmatter get ────────────────────────────────────────────────────────
(0, node_test_1.describe)('frontmatter get', () => {
    (0, node_test_1.test)('returns all fields as JSON', () => {
        const file = writeTempFile('---\nphase: 01\nplan: 01\ntype: execute\n---\nbody text');
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter get ${file}`);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.strictEqual(parsed.phase, '01');
        node_assert_1.default.strictEqual(parsed.plan, '01');
        node_assert_1.default.strictEqual(parsed.type, 'execute');
    });
    (0, node_test_1.test)('returns specific field with --field', () => {
        const file = writeTempFile('---\nphase: 01\nplan: 02\ntype: tdd\n---\nbody');
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter get ${file} --field phase`);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.strictEqual(parsed.phase, '01');
    });
    (0, node_test_1.test)('returns error for missing field', () => {
        const file = writeTempFile('---\nphase: 01\n---\n');
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter get ${file} --field nonexistent`);
        // The command succeeds (exit 0) but returns an error object in JSON
        node_assert_1.default.ok(result.success, 'Command should exit 0');
        const parsed = JSON.parse(result.output);
        node_assert_1.default.ok(parsed.error, 'Should have error field');
        node_assert_1.default.ok(parsed.error.includes('Field not found'), 'Error should mention "Field not found"');
    });
    (0, node_test_1.test)('returns error for missing file', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('frontmatter get /nonexistent/path/file.md');
        node_assert_1.default.ok(result.success, 'Command should exit 0 with error JSON');
        const parsed = JSON.parse(result.output);
        node_assert_1.default.ok(parsed.error, 'Should have error field');
    });
    (0, node_test_1.test)('handles file with no frontmatter', () => {
        const file = writeTempFile('Plain text with no frontmatter delimiters.');
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter get ${file}`);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(parsed, {}, 'Should return empty object for no frontmatter');
    });
});
// ─── frontmatter set ────────────────────────────────────────────────────────
(0, node_test_1.describe)('frontmatter set', () => {
    (0, node_test_1.test)('updates existing field', () => {
        const file = writeTempFile('---\nphase: 01\ntype: execute\n---\nbody');
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter set ${file} --field phase --value "02"`);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        // Read back and verify
        const content = fs_1.default.readFileSync(file, 'utf-8');
        const { extractFrontmatter } = require('../core/bin/lib/frontmatter.cjs');
        const fm = extractFrontmatter(content);
        node_assert_1.default.strictEqual(fm.phase, '02');
    });
    (0, node_test_1.test)('adds new field', () => {
        const file = writeTempFile('---\nphase: 01\n---\nbody');
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter set ${file} --field status --value "active"`);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const content = fs_1.default.readFileSync(file, 'utf-8');
        const { extractFrontmatter } = require('../core/bin/lib/frontmatter.cjs');
        const fm = extractFrontmatter(content);
        node_assert_1.default.strictEqual(fm.status, 'active');
    });
    (0, node_test_1.test)('handles JSON array value', () => {
        const file = writeTempFile('---\nphase: 01\n---\nbody');
        const result = (0, helpers_cjs_1.runGsdTools)(['frontmatter', 'set', file, '--field', 'tags', '--value', '["a","b"]']);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const content = fs_1.default.readFileSync(file, 'utf-8');
        const { extractFrontmatter } = require('../core/bin/lib/frontmatter.cjs');
        const fm = extractFrontmatter(content);
        node_assert_1.default.ok(Array.isArray(fm.tags), 'tags should be an array');
        node_assert_1.default.deepStrictEqual(fm.tags, ['a', 'b']);
    });
    (0, node_test_1.test)('returns error for missing file', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('frontmatter set /nonexistent/file.md --field phase --value "01"');
        node_assert_1.default.ok(result.success, 'Command should exit 0 with error JSON');
        const parsed = JSON.parse(result.output);
        node_assert_1.default.ok(parsed.error, 'Should have error field');
    });
    (0, node_test_1.test)('preserves body content after set', () => {
        const bodyText = '\n\n# My Heading\n\nSome paragraph with special chars: $, %, &.';
        const file = writeTempFile('---\nphase: 01\n---' + bodyText);
        (0, helpers_cjs_1.runGsdTools)(`frontmatter set ${file} --field phase --value "02"`);
        const content = fs_1.default.readFileSync(file, 'utf-8');
        node_assert_1.default.ok(content.includes('# My Heading'), 'heading should be preserved');
        node_assert_1.default.ok(content.includes('Some paragraph with special chars: $, %, &.'), 'body content should be preserved');
    });
});
// ─── frontmatter merge ──────────────────────────────────────────────────────
(0, node_test_1.describe)('frontmatter merge', () => {
    (0, node_test_1.test)('merges multiple fields into frontmatter', () => {
        const file = writeTempFile('---\nphase: 01\n---\nbody');
        const result = (0, helpers_cjs_1.runGsdTools)(['frontmatter', 'merge', file, '--data', '{"plan":"02","type":"tdd"}']);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const content = fs_1.default.readFileSync(file, 'utf-8');
        const { extractFrontmatter } = require('../core/bin/lib/frontmatter.cjs');
        const fm = extractFrontmatter(content);
        node_assert_1.default.strictEqual(fm.phase, '01', 'original field should be preserved');
        node_assert_1.default.strictEqual(fm.plan, '02', 'merged field should be present');
        node_assert_1.default.strictEqual(fm.type, 'tdd', 'merged field should be present');
    });
    (0, node_test_1.test)('overwrites existing fields on conflict', () => {
        const file = writeTempFile('---\nphase: 01\ntype: execute\n---\nbody');
        const result = (0, helpers_cjs_1.runGsdTools)(['frontmatter', 'merge', file, '--data', '{"phase":"02"}']);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const content = fs_1.default.readFileSync(file, 'utf-8');
        const { extractFrontmatter } = require('../core/bin/lib/frontmatter.cjs');
        const fm = extractFrontmatter(content);
        node_assert_1.default.strictEqual(fm.phase, '02', 'conflicting field should be overwritten');
        node_assert_1.default.strictEqual(fm.type, 'execute', 'non-conflicting field should be preserved');
    });
    (0, node_test_1.test)('returns error for missing file', () => {
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter merge /nonexistent/file.md --data '{"phase":"01"}'`);
        node_assert_1.default.ok(result.success, 'Command should exit 0 with error JSON');
        const parsed = JSON.parse(result.output);
        node_assert_1.default.ok(parsed.error, 'Should have error field');
    });
    (0, node_test_1.test)('returns error for invalid JSON data', () => {
        const file = writeTempFile('---\nphase: 01\n---\nbody');
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter merge ${file} --data 'not json'`);
        // cmdFrontmatterMerge calls error() which exits with code 1
        node_assert_1.default.ok(!result.success, 'Command should fail with non-zero exit code');
        node_assert_1.default.ok(result.error.includes('Invalid JSON'), 'Error should mention invalid JSON');
    });
});
// ─── frontmatter validate ───────────────────────────────────────────────────
(0, node_test_1.describe)('frontmatter validate', () => {
    (0, node_test_1.test)('reports valid for complete plan frontmatter', () => {
        const content = `---
phase: 01
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/auth.ts]
autonomous: true
must_haves:
  truths:
    - "All tests pass"
---
body`;
        const file = writeTempFile(content);
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter validate ${file} --schema plan`);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.strictEqual(parsed.valid, true, 'Should be valid');
        node_assert_1.default.deepStrictEqual(parsed.missing, [], 'No fields should be missing');
        node_assert_1.default.strictEqual(parsed.schema, 'plan');
    });
    (0, node_test_1.test)('reports invalid with missing fields', () => {
        const file = writeTempFile('---\nphase: 01\n---\nbody');
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter validate ${file} --schema plan`);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.strictEqual(parsed.valid, false, 'Should be invalid');
        node_assert_1.default.ok(parsed.missing.length > 0, 'Should have missing fields');
        // plan schema requires: phase, plan, type, wave, depends_on, files_modified, autonomous, must_haves
        // phase is present, so 7 should be missing
        node_assert_1.default.strictEqual(parsed.missing.length, 7, 'Should have 7 missing required fields');
        node_assert_1.default.ok(parsed.missing.includes('plan'), 'plan should be in missing');
        node_assert_1.default.ok(parsed.missing.includes('type'), 'type should be in missing');
        node_assert_1.default.ok(parsed.missing.includes('must_haves'), 'must_haves should be in missing');
    });
    (0, node_test_1.test)('validates against summary schema', () => {
        const content = `---
phase: 01
plan: 01
subsystem: testing
tags: [unit-tests, yaml]
duration: 5min
completed: 2026-02-25
---
body`;
        const file = writeTempFile(content);
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter validate ${file} --schema summary`);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.strictEqual(parsed.valid, true, 'Should be valid for summary schema');
        node_assert_1.default.strictEqual(parsed.schema, 'summary');
    });
    (0, node_test_1.test)('validates against verification schema', () => {
        const content = `---
phase: 01
verified: 2026-02-25
status: passed
score: 5/5
---
body`;
        const file = writeTempFile(content);
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter validate ${file} --schema verification`);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.strictEqual(parsed.valid, true, 'Should be valid for verification schema');
        node_assert_1.default.strictEqual(parsed.schema, 'verification');
    });
    (0, node_test_1.test)('returns error for unknown schema', () => {
        const file = writeTempFile('---\nphase: 01\n---\n');
        const result = (0, helpers_cjs_1.runGsdTools)(`frontmatter validate ${file} --schema unknown`);
        // cmdFrontmatterValidate calls error() which exits with code 1
        node_assert_1.default.ok(!result.success, 'Command should fail with non-zero exit code');
        node_assert_1.default.ok(result.error.includes('Unknown schema'), 'Error should mention unknown schema');
    });
    (0, node_test_1.test)('returns error for missing file', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('frontmatter validate /nonexistent/file.md --schema plan');
        node_assert_1.default.ok(result.success, 'Command should exit 0 with error JSON');
        const parsed = JSON.parse(result.output);
        node_assert_1.default.ok(parsed.error, 'Should have error field');
    });
});
//# sourceMappingURL=frontmatter-cli.test.cjs.map