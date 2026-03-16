"use strict";
/**
 * Vector Tools Tests - State
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helpers_cjs_1 = require("./helpers.cjs");
(0, node_test_1.describe)('state-snapshot command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('missing STATE.md returns error', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('state-snapshot', tmpDir);
        node_assert_1.default.ok(result.success, `Command should succeed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.error, 'STATE.md not found', 'should report missing file');
    });
    (0, node_test_1.test)('extracts basic fields from STATE.md', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

**Current Phase:** 03
**Current Phase Name:** API Layer
**Total Phases:** 6
**Current Plan:** 03-02
**Total Plans in Phase:** 3
**Status:** In progress
**Progress:** 45%
**Last Activity:** 2024-01-15
**Last Activity Description:** Completed 03-01-PLAN.md
`);
        const result = (0, helpers_cjs_1.runGsdTools)('state-snapshot', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.current_phase, '03', 'current phase extracted');
        node_assert_1.default.strictEqual(output.current_phase_name, 'API Layer', 'phase name extracted');
        node_assert_1.default.strictEqual(output.total_phases, 6, 'total phases extracted');
        node_assert_1.default.strictEqual(output.current_plan, '03-02', 'current plan extracted');
        node_assert_1.default.strictEqual(output.total_plans_in_phase, 3, 'total plans extracted');
        node_assert_1.default.strictEqual(output.status, 'In progress', 'status extracted');
        node_assert_1.default.strictEqual(output.progress_percent, 45, 'progress extracted');
        node_assert_1.default.strictEqual(output.last_activity, '2024-01-15', 'last activity date extracted');
    });
    (0, node_test_1.test)('extracts decisions table', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

**Current Phase:** 01

## Decisions Made

| Phase | Decision | Rationale |
|-------|----------|-----------|
| 01 | Use Prisma | Better DX than raw SQL |
| 02 | JWT auth | Stateless authentication |
`);
        const result = (0, helpers_cjs_1.runGsdTools)('state-snapshot', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.decisions.length, 2, 'should have 2 decisions');
        node_assert_1.default.strictEqual(output.decisions[0].phase, '01', 'first decision phase');
        node_assert_1.default.strictEqual(output.decisions[0].summary, 'Use Prisma', 'first decision summary');
        node_assert_1.default.strictEqual(output.decisions[0].rationale, 'Better DX than raw SQL', 'first decision rationale');
    });
    (0, node_test_1.test)('extracts blockers list', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

**Current Phase:** 03

## Blockers

- Waiting for API credentials
- Need design review for dashboard
`);
        const result = (0, helpers_cjs_1.runGsdTools)('state-snapshot', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(output.blockers, [
            'Waiting for API credentials',
            'Need design review for dashboard',
        ], 'blockers extracted');
    });
    (0, node_test_1.test)('extracts session continuity info', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

**Current Phase:** 03

## Session

**Last Date:** 2024-01-15
**Stopped At:** Phase 3, Plan 2, Task 1
**Resume File:** .planning/phases/03-api/03-02-PLAN.md
`);
        const result = (0, helpers_cjs_1.runGsdTools)('state-snapshot', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.session.last_date, '2024-01-15', 'session date extracted');
        node_assert_1.default.strictEqual(output.session.stopped_at, 'Phase 3, Plan 2, Task 1', 'stopped at extracted');
        node_assert_1.default.strictEqual(output.session.resume_file, '.planning/phases/03-api/03-02-PLAN.md', 'resume file extracted');
    });
    (0, node_test_1.test)('handles paused_at field', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

**Current Phase:** 03
**Paused At:** Phase 3, Plan 1, Task 2 - mid-implementation
`);
        const result = (0, helpers_cjs_1.runGsdTools)('state-snapshot', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.paused_at, 'Phase 3, Plan 1, Task 2 - mid-implementation', 'paused_at extracted');
    });
    (0, node_test_1.test)('supports --cwd override when command runs outside project root', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Session State

**Current Phase:** 03
**Status:** Ready to plan
`);
        const outsideDir = fs_1.default.mkdtempSync(path_1.default.join(require('os').tmpdir(), 'vector-test-outside-'));
        try {
            const result = (0, helpers_cjs_1.runGsdTools)(`state-snapshot --cwd "${tmpDir}"`, outsideDir);
            node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
            const output = JSON.parse(result.output);
            node_assert_1.default.strictEqual(output.current_phase, '03', 'should read STATE.md from overridden cwd');
            node_assert_1.default.strictEqual(output.status, 'Ready to plan', 'should parse status from overridden cwd');
        }
        finally {
            (0, helpers_cjs_1.cleanup)(outsideDir);
        }
    });
    (0, node_test_1.test)('returns error for invalid --cwd path', () => {
        const invalid = path_1.default.join(tmpDir, 'does-not-exist');
        const result = (0, helpers_cjs_1.runGsdTools)(`state-snapshot --cwd "${invalid}"`, tmpDir);
        node_assert_1.default.ok(!result.success, 'should fail for invalid --cwd');
        node_assert_1.default.ok(result.error.includes('Invalid --cwd'), 'error should mention invalid --cwd');
    });
});
(0, node_test_1.describe)('state mutation commands', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('add-decision preserves dollar amounts without corrupting Decisions section', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

## Decisions
No decisions yet.

## Blockers
None
`);
        const result = (0, helpers_cjs_1.runGsdTools)(['state', 'add-decision', '--phase', '11-01', '--summary', 'Benchmark prices moved from $0.50 to $2.00 to $5.00', '--rationale', 'track cost growth'], tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const state = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.match(state, /- \[Phase 11-01\]: Benchmark prices moved from \$0\.50 to \$2\.00 to \$5\.00 — track cost growth/, 'decision entry should preserve literal dollar values');
        node_assert_1.default.strictEqual((state.match(/^## Decisions$/gm) || []).length, 1, 'Decisions heading should not be duplicated');
        node_assert_1.default.ok(!state.includes('No decisions yet.'), 'placeholder should be removed');
    });
    (0, node_test_1.test)('add-blocker preserves dollar strings without corrupting Blockers section', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

## Decisions
None

## Blockers
None
`);
        const result = (0, helpers_cjs_1.runGsdTools)(['state', 'add-blocker', '--text', 'Waiting on vendor quote $1.00 before approval'], tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const state = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.match(state, /- Waiting on vendor quote \$1\.00 before approval/, 'blocker entry should preserve literal dollar values');
        node_assert_1.default.strictEqual((state.match(/^## Blockers$/gm) || []).length, 1, 'Blockers heading should not be duplicated');
    });
    (0, node_test_1.test)('add-decision supports file inputs to preserve shell-sensitive dollar text', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

## Decisions
No decisions yet.

## Blockers
None
`);
        const summaryPath = path_1.default.join(tmpDir, 'decision-summary.txt');
        const rationalePath = path_1.default.join(tmpDir, 'decision-rationale.txt');
        fs_1.default.writeFileSync(summaryPath, 'Price tiers: $0.50, $2.00, else $5.00\n');
        fs_1.default.writeFileSync(rationalePath, 'Keep exact currency literals for budgeting\n');
        const result = (0, helpers_cjs_1.runGsdTools)(`state add-decision --phase 11-02 --summary-file "${summaryPath}" --rationale-file "${rationalePath}"`, tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const state = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.match(state, /- \[Phase 11-02\]: Price tiers: \$0\.50, \$2\.00, else \$5\.00 — Keep exact currency literals for budgeting/, 'file-based decision input should preserve literal dollar values');
    });
    (0, node_test_1.test)('add-blocker supports --text-file for shell-sensitive text', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

## Decisions
None

## Blockers
None
`);
        const blockerPath = path_1.default.join(tmpDir, 'blocker.txt');
        fs_1.default.writeFileSync(blockerPath, 'Vendor quote updated from $1.00 to $2.00 pending approval\n');
        const result = (0, helpers_cjs_1.runGsdTools)(`state add-blocker --text-file "${blockerPath}"`, tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const state = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.match(state, /- Vendor quote updated from \$1\.00 to \$2\.00 pending approval/);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// state json command (machine-readable STATE.md frontmatter)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('state json command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('missing STATE.md returns error', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('state json', tmpDir);
        node_assert_1.default.ok(result.success, `Command should succeed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.error, 'STATE.md not found', 'should report missing file');
    });
    (0, node_test_1.test)('builds frontmatter on-the-fly from body when no frontmatter exists', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

**Current Phase:** 05
**Current Phase Name:** Deployment
**Total Phases:** 8
**Current Plan:** 05-03
**Total Plans in Phase:** 4
**Status:** In progress
**Progress:** 60%
**Last Activity:** 2026-01-20
`);
        const result = (0, helpers_cjs_1.runGsdTools)('state json', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.vector_state_version, '1.0', 'should have version 1.0');
        node_assert_1.default.strictEqual(output.current_phase, '05', 'current phase extracted');
        node_assert_1.default.strictEqual(output.current_phase_name, 'Deployment', 'phase name extracted');
        node_assert_1.default.strictEqual(output.current_plan, '05-03', 'current plan extracted');
        node_assert_1.default.strictEqual(output.status, 'executing', 'status normalized to executing');
        node_assert_1.default.ok(output.last_updated, 'should have last_updated timestamp');
        node_assert_1.default.strictEqual(output.last_activity, '2026-01-20', 'last activity extracted');
        node_assert_1.default.ok(output.progress, 'should have progress object');
        node_assert_1.default.strictEqual(output.progress.percent, 60, 'progress percent extracted');
    });
    (0, node_test_1.test)('reads existing frontmatter when present', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `---
vector_state_version: 1.0
current_phase: 03
status: paused
stopped_at: Plan 2 of Phase 3
---

# Project State

**Current Phase:** 03
**Status:** Paused
`);
        const result = (0, helpers_cjs_1.runGsdTools)('state json', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.vector_state_version, '1.0', 'version from frontmatter');
        node_assert_1.default.strictEqual(output.current_phase, '03', 'phase from frontmatter');
        node_assert_1.default.strictEqual(output.status, 'paused', 'status from frontmatter');
        node_assert_1.default.strictEqual(output.stopped_at, 'Plan 2 of Phase 3', 'stopped_at from frontmatter');
    });
    (0, node_test_1.test)('normalizes various status values', () => {
        const statusTests = [
            { input: 'In progress', expected: 'executing' },
            { input: 'Ready to execute', expected: 'executing' },
            { input: 'Paused at Plan 3', expected: 'paused' },
            { input: 'Ready to plan', expected: 'planning' },
            { input: 'Phase complete — ready for verification', expected: 'verifying' },
            { input: 'Milestone complete', expected: 'completed' },
        ];
        for (const { input, expected } of statusTests) {
            fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 01\n**Status:** ${input}\n`);
            const result = (0, helpers_cjs_1.runGsdTools)('state json', tmpDir);
            node_assert_1.default.ok(result.success, `Command failed for status "${input}": ${result.error}`);
            const output = JSON.parse(result.output);
            node_assert_1.default.strictEqual(output.status, expected, `"${input}" should normalize to "${expected}"`);
        }
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// STATE.md frontmatter sync (write operations add frontmatter)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('STATE.md frontmatter sync', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('state update adds frontmatter to STATE.md', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

**Current Phase:** 02
**Status:** Ready to execute
`);
        const result = (0, helpers_cjs_1.runGsdTools)('state update Status "Executing Plan 1"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(content.startsWith('---\n'), 'should start with frontmatter delimiter');
        node_assert_1.default.ok(content.includes('vector_state_version: 1.0'), 'should have version field');
        node_assert_1.default.ok(content.includes('current_phase: 02'), 'frontmatter should have current phase');
        node_assert_1.default.ok(content.includes('**Current Phase:** 02'), 'body field should be preserved');
        node_assert_1.default.ok(content.includes('**Status:** Executing Plan 1'), 'updated field in body');
    });
    (0, node_test_1.test)('state patch adds frontmatter', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

**Current Phase:** 04
**Status:** Planning
**Current Plan:** 04-01
`);
        const result = (0, helpers_cjs_1.runGsdTools)('state patch --Status "In progress" --"Current Plan" 04-02', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(content.startsWith('---\n'), 'should have frontmatter after patch');
    });
    (0, node_test_1.test)('frontmatter is idempotent on multiple writes', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

**Current Phase:** 01
**Status:** Ready to execute
`);
        (0, helpers_cjs_1.runGsdTools)('state update Status "In progress"', tmpDir);
        (0, helpers_cjs_1.runGsdTools)('state update Status "Paused"', tmpDir);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        const delimiterCount = (content.match(/^---$/gm) || []).length;
        node_assert_1.default.strictEqual(delimiterCount, 2, 'should have exactly one frontmatter block (2 delimiters)');
        node_assert_1.default.ok(content.includes('status: paused'), 'frontmatter should reflect latest status');
    });
    (0, node_test_1.test)('round-trip: write then read via state json', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State

**Current Phase:** 07
**Current Phase Name:** Production
**Total Phases:** 10
**Status:** In progress
**Current Plan:** 07-05
**Progress:** 70%
`);
        (0, helpers_cjs_1.runGsdTools)('state update Status "Executing Plan 5"', tmpDir);
        const result = (0, helpers_cjs_1.runGsdTools)('state json', tmpDir);
        node_assert_1.default.ok(result.success, `state json failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.current_phase, '07', 'round-trip: phase preserved');
        node_assert_1.default.strictEqual(output.current_phase_name, 'Production', 'round-trip: phase name preserved');
        node_assert_1.default.strictEqual(output.status, 'executing', 'round-trip: status normalized');
        node_assert_1.default.ok(output.last_updated, 'round-trip: timestamp present');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// stateExtractField and stateReplaceField helpers
// ─────────────────────────────────────────────────────────────────────────────
const { stateExtractField, stateReplaceField } = require('../core/bin/lib/state.cjs');
(0, node_test_1.describe)('stateExtractField and stateReplaceField helpers', () => {
    // stateExtractField tests
    (0, node_test_1.test)('extracts simple field value', () => {
        const content = '# State\n\n**Status:** In progress\n';
        const result = stateExtractField(content, 'Status');
        node_assert_1.default.strictEqual(result, 'In progress', 'should extract simple field value');
    });
    (0, node_test_1.test)('extracts field with colon in value', () => {
        const content = '# State\n\n**Last Activity:** 2024-01-15 — Completed plan\n';
        const result = stateExtractField(content, 'Last Activity');
        node_assert_1.default.strictEqual(result, '2024-01-15 — Completed plan', 'should return full value after field pattern');
    });
    (0, node_test_1.test)('returns null for missing field', () => {
        const content = '# State\n\n**Phase:** 03\n';
        const result = stateExtractField(content, 'Status');
        node_assert_1.default.strictEqual(result, null, 'should return null when field not present');
    });
    (0, node_test_1.test)('is case-insensitive on field name', () => {
        const content = '# State\n\n**status:** Active\n';
        const result = stateExtractField(content, 'Status');
        node_assert_1.default.strictEqual(result, 'Active', 'should match field name case-insensitively');
    });
    // stateReplaceField tests
    (0, node_test_1.test)('replaces field value', () => {
        const content = '# State\n\n**Status:** Old\n';
        const result = stateReplaceField(content, 'Status', 'New');
        node_assert_1.default.ok(result !== null, 'should return updated content, not null');
        node_assert_1.default.ok(result.includes('**Status:** New'), 'output should contain updated field value');
        node_assert_1.default.ok(!result.includes('**Status:** Old'), 'output should not contain old field value');
    });
    (0, node_test_1.test)('returns null when field not found', () => {
        const content = '# State\n\n**Phase:** 03\n';
        const result = stateReplaceField(content, 'Status', 'New');
        node_assert_1.default.strictEqual(result, null, 'should return null when field not present');
    });
    (0, node_test_1.test)('preserves surrounding content', () => {
        const content = [
            '# Project State',
            '',
            '**Phase:** 03',
            '**Status:** Old',
            '**Last Activity:** 2024-01-15',
            '',
            '## Notes',
            'Some notes here.',
        ].join('\n');
        const result = stateReplaceField(content, 'Status', 'New');
        node_assert_1.default.ok(result !== null, 'should return updated content');
        node_assert_1.default.ok(result.includes('**Phase:** 03'), 'Phase line should be unchanged');
        node_assert_1.default.ok(result.includes('**Status:** New'), 'Status should be updated');
        node_assert_1.default.ok(result.includes('**Last Activity:** 2024-01-15'), 'Last Activity line should be unchanged');
        node_assert_1.default.ok(result.includes('## Notes'), 'Notes heading should be unchanged');
        node_assert_1.default.ok(result.includes('Some notes here.'), 'Notes content should be unchanged');
    });
    (0, node_test_1.test)('round-trip: extract then replace then extract', () => {
        const content = '# State\n\n**Phase:** 3\n';
        const extracted = stateExtractField(content, 'Phase');
        node_assert_1.default.strictEqual(extracted, '3', 'initial extract should return "3"');
        const updated = stateReplaceField(content, 'Phase', '4');
        node_assert_1.default.ok(updated !== null, 'replace should succeed');
        const reExtracted = stateExtractField(updated, 'Phase');
        node_assert_1.default.strictEqual(reExtracted, '4', 'extract after replace should return "4"');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdStateLoad, cmdStateGet, cmdStatePatch, cmdStateUpdate CLI tests
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('cmdStateLoad (state load)', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('returns config and state when STATE.md exists', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Status:** Active\n');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), JSON.stringify({ mode: 'yolo' }));
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state load', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.state_exists, true, 'state_exists should be true');
        node_assert_1.default.strictEqual(output.config_exists, true, 'config_exists should be true');
        node_assert_1.default.strictEqual(output.roadmap_exists, true, 'roadmap_exists should be true');
        node_assert_1.default.ok(output.state_raw.includes('**Status:** Active'), 'state_raw should contain STATE.md content');
    });
    (0, node_test_1.test)('returns state_exists false when STATE.md missing', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('state load', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.state_exists, false, 'state_exists should be false');
        node_assert_1.default.strictEqual(output.state_raw, '', 'state_raw should be empty string');
    });
    (0, node_test_1.test)('returns raw key=value format with --raw flag', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Status:** Active\n');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), JSON.stringify({ mode: 'yolo' }));
        const result = (0, helpers_cjs_1.runGsdTools)('state load --raw', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        node_assert_1.default.ok(result.output.includes('state_exists=true'), 'raw output should include state_exists=true');
        node_assert_1.default.ok(result.output.includes('config_exists=true'), 'raw output should include config_exists=true');
    });
});
(0, node_test_1.describe)('cmdStateGet (state get)', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('returns full content when no section specified', () => {
        const stateContent = '# Project State\n\n**Status:** Active\n**Phase:** 03\n';
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), stateContent);
        const result = (0, helpers_cjs_1.runGsdTools)('state get', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.content !== undefined, 'output should have content field');
        node_assert_1.default.ok(output.content.includes('**Status:** Active'), 'content should include full STATE.md text');
    });
    (0, node_test_1.test)('extracts bold field value', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Status:** Active\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state get Status', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output['Status'], 'Active', 'should extract Status field value');
    });
    (0, node_test_1.test)('extracts markdown section content', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Status:** Active\n\n## Blockers\n\n- item1\n- item2\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state get Blockers', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output['Blockers'] !== undefined, 'should have Blockers key in output');
        node_assert_1.default.ok(output['Blockers'].includes('item1'), 'section content should include item1');
        node_assert_1.default.ok(output['Blockers'].includes('item2'), 'section content should include item2');
    });
    (0, node_test_1.test)('returns error for nonexistent field', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Status:** Active\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state get Missing', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0 even for missing field: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.error !== undefined, 'output should have error field');
        node_assert_1.default.ok(output.error.toLowerCase().includes('not found'), 'error should mention "not found"');
    });
    (0, node_test_1.test)('returns error when STATE.md missing', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('state get Status', tmpDir);
        node_assert_1.default.ok(!result.success, 'command should fail when STATE.md is missing');
        node_assert_1.default.ok(result.error.includes('STATE.md') || result.output.includes('STATE.md'), 'error message should mention STATE.md');
    });
});
(0, node_test_1.describe)('cmdStatePatch and cmdStateUpdate (state patch, state update)', () => {
    let tmpDir;
    const stateMd = [
        '# Project State',
        '',
        '**Current Phase:** 03',
        '**Status:** In progress',
        '**Last Activity:** 2024-01-15',
    ].join('\n') + '\n';
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('state patch updates multiple fields at once', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), stateMd);
        const result = (0, helpers_cjs_1.runGsdTools)('state patch --Status Complete --"Current Phase" 04', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(updated.includes('**Status:** Complete'), 'Status should be updated to Complete');
        node_assert_1.default.ok(updated.includes('**Last Activity:** 2024-01-15'), 'Last Activity should be unchanged');
    });
    (0, node_test_1.test)('state patch reports failed fields that do not exist', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), stateMd);
        const result = (0, helpers_cjs_1.runGsdTools)('state patch --Status Done --Missing value', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(Array.isArray(output.updated), 'updated should be an array');
        node_assert_1.default.ok(output.updated.includes('Status'), 'Status should be in updated list');
        node_assert_1.default.ok(Array.isArray(output.failed), 'failed should be an array');
        node_assert_1.default.ok(output.failed.includes('Missing'), 'Missing should be in failed list');
    });
    (0, node_test_1.test)('state update changes a single field', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), stateMd);
        const result = (0, helpers_cjs_1.runGsdTools)('state update Status "Phase complete"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, true, 'updated should be true');
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(updated.includes('**Status:** Phase complete'), 'Status should be updated');
        node_assert_1.default.ok(updated.includes('**Current Phase:** 03'), 'Current Phase should be unchanged');
        node_assert_1.default.ok(updated.includes('**Last Activity:** 2024-01-15'), 'Last Activity should be unchanged');
    });
    (0, node_test_1.test)('state update reports field not found', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), stateMd);
        const result = (0, helpers_cjs_1.runGsdTools)('state update Missing value', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0 for not-found field: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, false, 'updated should be false');
        node_assert_1.default.ok(output.reason !== undefined, 'should include a reason');
    });
    (0, node_test_1.test)('state update returns error when STATE.md missing', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('state update Status value', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, false, 'updated should be false');
        node_assert_1.default.ok(output.reason.includes('STATE.md'), 'reason should mention STATE.md');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdStateAdvancePlan, cmdStateRecordMetric, cmdStateUpdateProgress
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('cmdStateAdvancePlan (state advance-plan)', () => {
    let tmpDir;
    const advanceFixture = [
        '# Project State',
        '',
        '**Current Plan:** 1',
        '**Total Plans in Phase:** 3',
        '**Status:** Executing',
        '**Last Activity:** 2024-01-10',
    ].join('\n') + '\n';
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('advances plan counter when not on last plan', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), advanceFixture);
        const before = new Date().toISOString().split('T')[0];
        const result = (0, helpers_cjs_1.runGsdTools)('state advance-plan', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.advanced, true, 'advanced should be true');
        node_assert_1.default.strictEqual(output.previous_plan, 1, 'previous_plan should be 1');
        node_assert_1.default.strictEqual(output.current_plan, 2, 'current_plan should be 2');
        node_assert_1.default.strictEqual(output.total_plans, 3, 'total_plans should be 3');
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(updated.includes('**Current Plan:** 2'), 'Current Plan should be updated to 2');
        node_assert_1.default.ok(updated.includes('**Status:** Ready to execute'), 'Status should be Ready to execute');
        const after = new Date().toISOString().split('T')[0];
        node_assert_1.default.ok(updated.includes(`**Last Activity:** ${before}`) || updated.includes(`**Last Activity:** ${after}`), `Last Activity should be today (${before}) or next day if midnight boundary (${after})`);
    });
    (0, node_test_1.test)('marks phase complete on last plan', () => {
        const lastPlanFixture = advanceFixture.replace('**Current Plan:** 1', '**Current Plan:** 3');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), lastPlanFixture);
        const result = (0, helpers_cjs_1.runGsdTools)('state advance-plan', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.advanced, false, 'advanced should be false');
        node_assert_1.default.strictEqual(output.reason, 'last_plan', 'reason should be last_plan');
        node_assert_1.default.strictEqual(output.status, 'ready_for_verification', 'status should be ready_for_verification');
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(updated.includes('Phase complete'), 'Status should contain Phase complete');
    });
    (0, node_test_1.test)('returns error when STATE.md missing', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('state advance-plan', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.error !== undefined, 'output should have error field');
        node_assert_1.default.ok(output.error.includes('STATE.md'), 'error should mention STATE.md');
    });
    (0, node_test_1.test)('returns error when plan fields not parseable', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Status:** Active\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state advance-plan', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.error !== undefined, 'output should have error field');
        node_assert_1.default.ok(output.error.toLowerCase().includes('cannot parse'), 'error should mention Cannot parse');
    });
});
(0, node_test_1.describe)('cmdStateRecordMetric (state record-metric)', () => {
    let tmpDir;
    const metricsFixture = [
        '# Project State',
        '',
        '## Performance Metrics',
        '',
        '| Plan | Duration | Tasks | Files |',
        '|------|----------|-------|-------|',
        '| Phase 1 P1 | 3min | 2 tasks | 3 files |',
        '',
        '## Session Continuity',
    ].join('\n') + '\n';
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('appends metric row to existing table', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), metricsFixture);
        const result = (0, helpers_cjs_1.runGsdTools)('state record-metric --phase 2 --plan 1 --duration 5min --tasks 3 --files 4', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.recorded, true, 'recorded should be true');
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(updated.includes('| Phase 2 P1 | 5min | 3 tasks | 4 files |'), 'new row should be present');
        node_assert_1.default.ok(updated.includes('| Phase 1 P1 | 3min | 2 tasks | 3 files |'), 'existing row should still be present');
    });
    (0, node_test_1.test)('replaces None yet placeholder with first metric', () => {
        const noneYetFixture = [
            '# Project State',
            '',
            '## Performance Metrics',
            '',
            '| Plan | Duration | Tasks | Files |',
            '|------|----------|-------|-------|',
            'None yet',
            '',
            '## Session Continuity',
        ].join('\n') + '\n';
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), noneYetFixture);
        const result = (0, helpers_cjs_1.runGsdTools)('state record-metric --phase 1 --plan 1 --duration 2min --tasks 1 --files 2', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(!updated.includes('None yet'), 'None yet placeholder should be removed');
        node_assert_1.default.ok(updated.includes('| Phase 1 P1 | 2min | 1 tasks | 2 files |'), 'new row should be present');
    });
    (0, node_test_1.test)('returns error when required fields missing', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), metricsFixture);
        const result = (0, helpers_cjs_1.runGsdTools)('state record-metric --phase 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.error !== undefined, 'output should have error field');
        node_assert_1.default.ok(output.error.includes('phase') || output.error.includes('plan') || output.error.includes('duration'), 'error should mention missing required fields');
    });
    (0, node_test_1.test)('returns error when STATE.md missing', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('state record-metric --phase 1 --plan 1 --duration 2min', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.error !== undefined, 'output should have error field');
        node_assert_1.default.ok(output.error.includes('STATE.md'), 'error should mention STATE.md');
    });
});
(0, node_test_1.describe)('cmdStateUpdateProgress (state update-progress)', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('calculates progress from plan/summary counts', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Progress:** [░░░░░░░░░░] 0%\n');
        // Phase 01: 1 PLAN + 1 SUMMARY = completed
        const phase01Dir = path_1.default.join(tmpDir, '.planning', 'phases', '01');
        fs_1.default.mkdirSync(phase01Dir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase01Dir, '01-01-PLAN.md'), '# Plan\n');
        fs_1.default.writeFileSync(path_1.default.join(phase01Dir, '01-01-SUMMARY.md'), '# Summary\n');
        // Phase 02: 1 PLAN only = not completed
        const phase02Dir = path_1.default.join(tmpDir, '.planning', 'phases', '02');
        fs_1.default.mkdirSync(phase02Dir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase02Dir, '02-01-PLAN.md'), '# Plan\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state update-progress', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, true, 'updated should be true');
        node_assert_1.default.strictEqual(output.percent, 50, 'percent should be 50');
        node_assert_1.default.strictEqual(output.completed, 1, 'completed should be 1');
        node_assert_1.default.strictEqual(output.total, 2, 'total should be 2');
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(updated.includes('50%'), 'STATE.md Progress should contain 50%');
    });
    (0, node_test_1.test)('handles zero plans gracefully', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Progress:** [░░░░░░░░░░] 0%\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state update-progress', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.percent, 0, 'percent should be 0 when no plans found');
    });
    (0, node_test_1.test)('returns error when Progress field missing', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Status:** Active\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state update-progress', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, false, 'updated should be false');
        node_assert_1.default.ok(output.reason !== undefined, 'should have a reason');
    });
    (0, node_test_1.test)('returns error when STATE.md missing', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('state update-progress', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.error !== undefined, 'output should have error field');
        node_assert_1.default.ok(output.error.includes('STATE.md'), 'error should mention STATE.md');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdStateResolveBlocker, cmdStateRecordSession
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('cmdStateResolveBlocker (state resolve-blocker)', () => {
    let tmpDir;
    const blockerFixture = [
        '# Project State',
        '',
        '## Blockers',
        '',
        '- Waiting for API credentials',
        '- Need design review for dashboard',
        '- Pending vendor approval',
        '',
        '## Session Continuity',
    ].join('\n') + '\n';
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('removes matching blocker line (case-insensitive substring match)', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), blockerFixture);
        const result = (0, helpers_cjs_1.runGsdTools)('state resolve-blocker --text "api credentials"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.resolved, true, 'resolved should be true');
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(!updated.includes('Waiting for API credentials'), 'matched blocker should be removed');
        node_assert_1.default.ok(updated.includes('Need design review for dashboard'), 'other blocker should still be present');
        node_assert_1.default.ok(updated.includes('Pending vendor approval'), 'other blocker should still be present');
    });
    (0, node_test_1.test)('adds None placeholder when last blocker resolved', () => {
        const singleBlockerFixture = [
            '# Project State',
            '',
            '## Blockers',
            '',
            '- Single blocker',
            '',
            '## Session Continuity',
        ].join('\n') + '\n';
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), singleBlockerFixture);
        const result = (0, helpers_cjs_1.runGsdTools)('state resolve-blocker --text "single blocker"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(!updated.includes('- Single blocker'), 'resolved blocker should be removed');
        // Section should contain "None" placeholder, not be empty
        const sectionMatch = updated.match(/## Blockers\n([\s\S]*?)(?=\n##|$)/i);
        node_assert_1.default.ok(sectionMatch, 'Blockers section should still exist');
        node_assert_1.default.ok(sectionMatch[1].includes('None'), 'Blockers section should contain None placeholder');
    });
    (0, node_test_1.test)('returns error when text not provided', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), blockerFixture);
        const result = (0, helpers_cjs_1.runGsdTools)('state resolve-blocker', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.error !== undefined, 'output should have error field');
        node_assert_1.default.ok(output.error.toLowerCase().includes('text'), 'error should mention text required');
    });
    (0, node_test_1.test)('returns error when STATE.md missing', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('state resolve-blocker --text "anything"', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.error !== undefined, 'output should have error field');
        node_assert_1.default.ok(output.error.includes('STATE.md'), 'error should mention STATE.md');
    });
    (0, node_test_1.test)('returns resolved true even if no line matches', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), blockerFixture);
        const result = (0, helpers_cjs_1.runGsdTools)('state resolve-blocker --text "nonexistent blocker text"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.resolved, true, 'resolved should be true even when no line matches');
    });
});
(0, node_test_1.describe)('cmdStateRecordSession (state record-session)', () => {
    let tmpDir;
    const sessionFixture = [
        '# Project State',
        '',
        '## Session Continuity',
        '',
        '**Last session:** 2024-01-10',
        '**Stopped at:** Phase 2, Plan 1',
        '**Resume file:** None',
    ].join('\n') + '\n';
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('updates session fields with stopped-at and resume-file', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), sessionFixture);
        const result = (0, helpers_cjs_1.runGsdTools)('state record-session --stopped-at "Phase 3, Plan 2" --resume-file ".planning/phases/03/03-02-PLAN.md"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.recorded, true, 'recorded should be true');
        node_assert_1.default.ok(Array.isArray(output.updated), 'updated should be an array');
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(updated.includes('Phase 3, Plan 2'), 'Stopped at should be updated');
        node_assert_1.default.ok(updated.includes('.planning/phases/03/03-02-PLAN.md'), 'Resume file should be updated');
        const today = new Date().toISOString().split('T')[0];
        node_assert_1.default.ok(updated.includes(today), 'Last session should be updated to today');
    });
    (0, node_test_1.test)('updates Last session timestamp even with no other options', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), sessionFixture);
        const result = (0, helpers_cjs_1.runGsdTools)('state record-session', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.recorded, true, 'recorded should be true');
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        const today = new Date().toISOString().split('T')[0];
        node_assert_1.default.ok(updated.includes(today), 'Last session should contain today\'s date');
    });
    (0, node_test_1.test)('sets Resume file to None when not specified', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), sessionFixture);
        const result = (0, helpers_cjs_1.runGsdTools)('state record-session --stopped-at "Phase 1 complete"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const updated = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(updated.includes('Phase 1 complete'), 'Stopped at should be updated');
        // Resume file should be set to None (default)
        const resumeMatch = updated.match(/\*\*Resume file:\*\*\s*(.*)/i);
        node_assert_1.default.ok(resumeMatch, 'Resume file field should exist');
        node_assert_1.default.ok(resumeMatch[1].trim() === 'None', 'Resume file should be None when not specified');
    });
    (0, node_test_1.test)('returns error when STATE.md missing', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('state record-session', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.error !== undefined, 'output should have error field');
        node_assert_1.default.ok(output.error.includes('STATE.md'), 'error should mention STATE.md');
    });
    (0, node_test_1.test)('returns recorded false when no session fields found', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Status:** Active\n**Phase:** 03\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state record-session', tmpDir);
        node_assert_1.default.ok(result.success, `Command should exit 0: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.recorded, false, 'recorded should be false when no session fields found');
        node_assert_1.default.ok(output.reason !== undefined, 'should have a reason');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// Milestone-scoped phase counting in frontmatter
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('milestone-scoped phase counting in frontmatter', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('total_phases counts only current milestone phases', () => {
        // ROADMAP lists only phases 5-6 (current milestone)
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), [
            '## Roadmap v2.0: Next Release',
            '',
            '### Phase 5: Auth',
            '**Goal:** Add authentication',
            '',
            '### Phase 6: Dashboard',
            '**Goal:** Build dashboard',
        ].join('\n'));
        // Disk has dirs 01-06 (01-04 are leftover from previous milestone)
        for (let i = 1; i <= 6; i++) {
            const padded = String(i).padStart(2, '0');
            const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', `${padded}-phase-${i}`);
            fs_1.default.mkdirSync(phaseDir, { recursive: true });
            // Add a plan to each
            fs_1.default.writeFileSync(path_1.default.join(phaseDir, `${padded}-01-PLAN.md`), '# Plan');
            fs_1.default.writeFileSync(path_1.default.join(phaseDir, `${padded}-01-SUMMARY.md`), '# Summary');
        }
        // Write a STATE.md and trigger a write that will sync frontmatter
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Current Phase:** 05\n**Status:** In progress\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state update Status "Executing"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        // Read the state json to check frontmatter
        const jsonResult = (0, helpers_cjs_1.runGsdTools)('state json', tmpDir);
        node_assert_1.default.ok(jsonResult.success, `state json failed: ${jsonResult.error}`);
        const output = JSON.parse(jsonResult.output);
        node_assert_1.default.strictEqual(Number(output.progress.total_phases), 2, 'should count only milestone phases (5 and 6), not all 6');
        node_assert_1.default.strictEqual(Number(output.progress.completed_phases), 2, 'both milestone phases have summaries');
    });
    (0, node_test_1.test)('total_phases includes ROADMAP phases without directories', () => {
        // ROADMAP lists 6 phases (5-10), but only 4 have directories on disk
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), [
            '## Roadmap v3.0',
            '',
            '### Phase 5: Auth',
            '### Phase 6: Dashboard',
            '### Phase 7: API',
            '### Phase 8: Notifications',
            '### Phase 9: Analytics',
            '### Phase 10: Polish',
        ].join('\n'));
        // Only phases 5-8 have directories (9 and 10 not yet planned)
        for (let i = 5; i <= 8; i++) {
            const padded = String(i).padStart(2, '0');
            const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', `${padded}-phase-${i}`);
            fs_1.default.mkdirSync(phaseDir, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.join(phaseDir, `${padded}-01-PLAN.md`), '# Plan');
            fs_1.default.writeFileSync(path_1.default.join(phaseDir, `${padded}-01-SUMMARY.md`), '# Summary');
        }
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Current Phase:** 08\n**Status:** In progress\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state update Status "Executing"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const jsonResult = (0, helpers_cjs_1.runGsdTools)('state json', tmpDir);
        node_assert_1.default.ok(jsonResult.success, `state json failed: ${jsonResult.error}`);
        const output = JSON.parse(jsonResult.output);
        node_assert_1.default.strictEqual(Number(output.progress.total_phases), 6, 'should count all 6 ROADMAP phases, not just 4 with directories');
        node_assert_1.default.strictEqual(Number(output.progress.completed_phases), 4, 'only 4 phases have summaries');
    });
    (0, node_test_1.test)('without ROADMAP counts all phases (pass-all filter)', () => {
        // No ROADMAP.md — all phases should be counted
        for (let i = 1; i <= 4; i++) {
            const padded = String(i).padStart(2, '0');
            const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', `${padded}-phase-${i}`);
            fs_1.default.mkdirSync(phaseDir, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.join(phaseDir, `${padded}-01-PLAN.md`), '# Plan');
        }
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Current Phase:** 01\n**Status:** Planning\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state update Status "In progress"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const jsonResult = (0, helpers_cjs_1.runGsdTools)('state json', tmpDir);
        node_assert_1.default.ok(jsonResult.success, `state json failed: ${jsonResult.error}`);
        const output = JSON.parse(jsonResult.output);
        node_assert_1.default.strictEqual(Number(output.progress.total_phases), 4, 'without ROADMAP should count all 4 phases');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// summary-extract command
// ─────────────────────────────────────────────────────────────────────────────
//# sourceMappingURL=state.test.cjs.map