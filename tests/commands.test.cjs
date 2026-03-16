"use strict";
/**
 * Vector Tools Tests - Commands
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const node_child_process_1 = require("node:child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const helpers_cjs_1 = require("./helpers.cjs");
(0, node_test_1.describe)('history-digest command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('empty phases directory returns valid schema', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('history-digest', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const digest = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(digest.phases, {}, 'phases should be empty object');
        node_assert_1.default.deepStrictEqual(digest.decisions, [], 'decisions should be empty array');
        node_assert_1.default.deepStrictEqual(digest.tech_stack, [], 'tech_stack should be empty array');
    });
    (0, node_test_1.test)('nested frontmatter fields extracted correctly', () => {
        // Create phase directory with SUMMARY containing nested frontmatter
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        const summaryContent = `---
phase: "01"
name: "Foundation Setup"
dependency-graph:
  provides:
    - "Database schema"
    - "Auth system"
  affects:
    - "API layer"
tech-stack:
  added:
    - "prisma"
    - "jose"
patterns-established:
  - "Repository pattern"
  - "JWT auth flow"
key-decisions:
  - "Use Prisma over Drizzle"
  - "JWT in httpOnly cookies"
---

# Summary content here
`;
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), summaryContent);
        const result = (0, helpers_cjs_1.runGsdTools)('history-digest', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const digest = JSON.parse(result.output);
        // Check nested dependency-graph.provides
        node_assert_1.default.ok(digest.phases['01'], 'Phase 01 should exist');
        node_assert_1.default.deepStrictEqual(digest.phases['01'].provides.sort(), ['Auth system', 'Database schema'], 'provides should contain nested values');
        // Check nested dependency-graph.affects
        node_assert_1.default.deepStrictEqual(digest.phases['01'].affects, ['API layer'], 'affects should contain nested values');
        // Check nested tech-stack.added
        node_assert_1.default.deepStrictEqual(digest.tech_stack.sort(), ['jose', 'prisma'], 'tech_stack should contain nested values');
        // Check patterns-established (flat array)
        node_assert_1.default.deepStrictEqual(digest.phases['01'].patterns.sort(), ['JWT auth flow', 'Repository pattern'], 'patterns should be extracted');
        // Check key-decisions
        node_assert_1.default.strictEqual(digest.decisions.length, 2, 'Should have 2 decisions');
        node_assert_1.default.ok(digest.decisions.some((d) => d.decision === 'Use Prisma over Drizzle'), 'Should contain first decision');
    });
    (0, node_test_1.test)('multiple phases merged into single digest', () => {
        // Create phase 01
        const phase01Dir = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(phase01Dir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase01Dir, '01-01-SUMMARY.md'), `---
phase: "01"
name: "Foundation"
provides:
  - "Database"
patterns-established:
  - "Pattern A"
key-decisions:
  - "Decision 1"
---
`);
        // Create phase 02
        const phase02Dir = path_1.default.join(tmpDir, '.planning', 'phases', '02-api');
        fs_1.default.mkdirSync(phase02Dir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase02Dir, '02-01-SUMMARY.md'), `---
phase: "02"
name: "API"
provides:
  - "REST endpoints"
patterns-established:
  - "Pattern B"
key-decisions:
  - "Decision 2"
tech-stack:
  added:
    - "zod"
---
`);
        const result = (0, helpers_cjs_1.runGsdTools)('history-digest', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const digest = JSON.parse(result.output);
        // Both phases present
        node_assert_1.default.ok(digest.phases['01'], 'Phase 01 should exist');
        node_assert_1.default.ok(digest.phases['02'], 'Phase 02 should exist');
        // Decisions merged
        node_assert_1.default.strictEqual(digest.decisions.length, 2, 'Should have 2 decisions total');
        // Tech stack merged
        node_assert_1.default.deepStrictEqual(digest.tech_stack, ['zod'], 'tech_stack should have zod');
    });
    (0, node_test_1.test)('malformed SUMMARY.md skipped gracefully', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        // Valid summary
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), `---
phase: "01"
provides:
  - "Valid feature"
---
`);
        // Malformed summary (no frontmatter)
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-02-SUMMARY.md'), `# Just a heading
No frontmatter here
`);
        // Another malformed summary (broken YAML)
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-03-SUMMARY.md'), `---
broken: [unclosed
---
`);
        const result = (0, helpers_cjs_1.runGsdTools)('history-digest', tmpDir);
        node_assert_1.default.ok(result.success, `Command should succeed despite malformed files: ${result.error}`);
        const digest = JSON.parse(result.output);
        node_assert_1.default.ok(digest.phases['01'], 'Phase 01 should exist');
        node_assert_1.default.ok(digest.phases['01'].provides.includes('Valid feature'), 'Valid feature should be extracted');
    });
    (0, node_test_1.test)('flat provides field still works (backward compatibility)', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), `---
phase: "01"
provides:
  - "Direct provides"
---
`);
        const result = (0, helpers_cjs_1.runGsdTools)('history-digest', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const digest = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(digest.phases['01'].provides, ['Direct provides'], 'Direct provides should work');
    });
    (0, node_test_1.test)('inline array syntax supported', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), `---
phase: "01"
provides: [Feature A, Feature B]
patterns-established: ["Pattern X", "Pattern Y"]
---
`);
        const result = (0, helpers_cjs_1.runGsdTools)('history-digest', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const digest = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(digest.phases['01'].provides.sort(), ['Feature A', 'Feature B'], 'Inline array should work');
        node_assert_1.default.deepStrictEqual(digest.phases['01'].patterns.sort(), ['Pattern X', 'Pattern Y'], 'Inline quoted array should work');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// phases list command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('summary-extract command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('missing file returns error', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('summary-extract .planning/phases/01-test/01-01-SUMMARY.md', tmpDir);
        node_assert_1.default.ok(result.success, `Command should succeed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.error, 'File not found', 'should report missing file');
    });
    (0, node_test_1.test)('extracts all fields from SUMMARY.md', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), `---
one-liner: Set up Prisma with User and Project models
key-files:
  - prisma/schema.prisma
  - src/lib/db.ts
tech-stack:
  added:
    - prisma
    - zod
patterns-established:
  - Repository pattern
  - Dependency injection
key-decisions:
  - Use Prisma over Drizzle: Better DX and ecosystem
  - Single database: Start simple, shard later
requirements-completed:
  - AUTH-01
  - AUTH-02
---

# Summary

Full summary content here.
`);
        const result = (0, helpers_cjs_1.runGsdTools)('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.path, '.planning/phases/01-foundation/01-01-SUMMARY.md', 'path correct');
        node_assert_1.default.strictEqual(output.one_liner, 'Set up Prisma with User and Project models', 'one-liner extracted');
        node_assert_1.default.deepStrictEqual(output.key_files, ['prisma/schema.prisma', 'src/lib/db.ts'], 'key files extracted');
        node_assert_1.default.deepStrictEqual(output.tech_added, ['prisma', 'zod'], 'tech added extracted');
        node_assert_1.default.deepStrictEqual(output.patterns, ['Repository pattern', 'Dependency injection'], 'patterns extracted');
        node_assert_1.default.strictEqual(output.decisions.length, 2, 'decisions extracted');
        node_assert_1.default.deepStrictEqual(output.requirements_completed, ['AUTH-01', 'AUTH-02'], 'requirements completed extracted');
    });
    (0, node_test_1.test)('selective extraction with --fields', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), `---
one-liner: Set up database
key-files:
  - prisma/schema.prisma
tech-stack:
  added:
    - prisma
patterns-established:
  - Repository pattern
key-decisions:
  - Use Prisma: Better DX
requirements-completed:
  - AUTH-01
---
`);
        const result = (0, helpers_cjs_1.runGsdTools)('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md --fields one_liner,key_files,requirements_completed', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.one_liner, 'Set up database', 'one_liner included');
        node_assert_1.default.deepStrictEqual(output.key_files, ['prisma/schema.prisma'], 'key_files included');
        node_assert_1.default.deepStrictEqual(output.requirements_completed, ['AUTH-01'], 'requirements_completed included');
        node_assert_1.default.strictEqual(output.tech_added, undefined, 'tech_added excluded');
        node_assert_1.default.strictEqual(output.patterns, undefined, 'patterns excluded');
        node_assert_1.default.strictEqual(output.decisions, undefined, 'decisions excluded');
    });
    (0, node_test_1.test)('handles missing frontmatter fields gracefully', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), `---
one-liner: Minimal summary
---

# Summary
`);
        const result = (0, helpers_cjs_1.runGsdTools)('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.one_liner, 'Minimal summary', 'one-liner extracted');
        node_assert_1.default.deepStrictEqual(output.key_files, [], 'key_files defaults to empty');
        node_assert_1.default.deepStrictEqual(output.tech_added, [], 'tech_added defaults to empty');
        node_assert_1.default.deepStrictEqual(output.patterns, [], 'patterns defaults to empty');
        node_assert_1.default.deepStrictEqual(output.decisions, [], 'decisions defaults to empty');
        node_assert_1.default.deepStrictEqual(output.requirements_completed, [], 'requirements_completed defaults to empty');
    });
    (0, node_test_1.test)('parses key-decisions with rationale', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), `---
key-decisions:
  - Use Prisma: Better DX than alternatives
  - JWT tokens: Stateless auth for scalability
---
`);
        const result = (0, helpers_cjs_1.runGsdTools)('summary-extract .planning/phases/01-foundation/01-01-SUMMARY.md', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.decisions[0].summary, 'Use Prisma', 'decision summary parsed');
        node_assert_1.default.strictEqual(output.decisions[0].rationale, 'Better DX than alternatives', 'decision rationale parsed');
        node_assert_1.default.strictEqual(output.decisions[1].summary, 'JWT tokens', 'second decision summary');
        node_assert_1.default.strictEqual(output.decisions[1].rationale, 'Stateless auth for scalability', 'second decision rationale');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// init commands tests
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('progress command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('renders JSON progress', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0 MVP\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Done');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-02-PLAN.md'), '# Plan 2');
        const result = (0, helpers_cjs_1.runGsdTools)('progress json', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.total_plans, 2, '2 total plans');
        node_assert_1.default.strictEqual(output.total_summaries, 1, '1 summary');
        node_assert_1.default.strictEqual(output.percent, 50, '50%');
        node_assert_1.default.strictEqual(output.phases.length, 1, '1 phase');
        node_assert_1.default.strictEqual(output.phases[0].status, 'In Progress', 'phase in progress');
    });
    (0, node_test_1.test)('renders bar format', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Done');
        const result = (0, helpers_cjs_1.runGsdTools)('progress bar --raw', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        node_assert_1.default.ok(result.output.includes('1/1'), 'should include count');
        node_assert_1.default.ok(result.output.includes('100%'), 'should include 100%');
    });
    (0, node_test_1.test)('renders table format', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0 MVP\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        const result = (0, helpers_cjs_1.runGsdTools)('progress table --raw', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        node_assert_1.default.ok(result.output.includes('Phase'), 'should have table header');
        node_assert_1.default.ok(result.output.includes('foundation'), 'should include phase name');
    });
    (0, node_test_1.test)('does not crash when summaries exceed plans (orphaned SUMMARY.md)', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0 MVP\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(p1, { recursive: true });
        // 1 plan but 2 summaries (orphaned SUMMARY.md after PLAN.md deletion)
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Done');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-02-SUMMARY.md'), '# Orphaned summary');
        // bar format - should not crash with RangeError
        const barResult = (0, helpers_cjs_1.runGsdTools)('progress bar --raw', tmpDir);
        node_assert_1.default.ok(barResult.success, `Bar format crashed: ${barResult.error}`);
        node_assert_1.default.ok(barResult.output.includes('100%'), 'percent should be clamped to 100%');
        // table format - should not crash with RangeError
        const tableResult = (0, helpers_cjs_1.runGsdTools)('progress table --raw', tmpDir);
        node_assert_1.default.ok(tableResult.success, `Table format crashed: ${tableResult.error}`);
        // json format - percent should be clamped
        const jsonResult = (0, helpers_cjs_1.runGsdTools)('progress json', tmpDir);
        node_assert_1.default.ok(jsonResult.success, `JSON format crashed: ${jsonResult.error}`);
        const output = JSON.parse(jsonResult.output);
        node_assert_1.default.ok(output.percent <= 100, `percent should be <= 100 but got ${output.percent}`);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// todo complete command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('todo complete command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('moves todo from pending to completed', () => {
        const pendingDir = path_1.default.join(tmpDir, '.planning', 'todos', 'pending');
        fs_1.default.mkdirSync(pendingDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'add-dark-mode.md'), `title: Add dark mode\narea: ui\ncreated: 2025-01-01\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('todo complete add-dark-mode.md', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.completed, true);
        // Verify moved
        node_assert_1.default.ok(!fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'todos', 'pending', 'add-dark-mode.md')), 'should be removed from pending');
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'todos', 'completed', 'add-dark-mode.md')), 'should be in completed');
        // Verify completion timestamp added
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'todos', 'completed', 'add-dark-mode.md'), 'utf-8');
        node_assert_1.default.ok(content.startsWith('completed:'), 'should have completed timestamp');
    });
    (0, node_test_1.test)('fails for nonexistent todo', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('todo complete nonexistent.md', tmpDir);
        node_assert_1.default.ok(!result.success, 'should fail');
        node_assert_1.default.ok(result.error.includes('not found'), 'error mentions not found');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// scaffold command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('scaffold command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('scaffolds context file', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('scaffold context --phase 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.created, true);
        // Verify file content
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api', '03-CONTEXT.md'), 'utf-8');
        node_assert_1.default.ok(content.includes('Phase 3'), 'should reference phase number');
        node_assert_1.default.ok(content.includes('Decisions'), 'should have decisions section');
        node_assert_1.default.ok(content.includes('Discretion Areas'), 'should have discretion section');
    });
    (0, node_test_1.test)('scaffolds UAT file', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('scaffold uat --phase 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.created, true);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api', '03-UAT.md'), 'utf-8');
        node_assert_1.default.ok(content.includes('User Acceptance Testing'), 'should have UAT heading');
        node_assert_1.default.ok(content.includes('Test Results'), 'should have test results section');
    });
    (0, node_test_1.test)('scaffolds verification file', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('scaffold verification --phase 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.created, true);
        const content = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api', '03-VERIFICATION.md'), 'utf-8');
        node_assert_1.default.ok(content.includes('Goal-Backward Verification'), 'should have verification heading');
    });
    (0, node_test_1.test)('scaffolds phase directory', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('scaffold phase-dir --phase 5 --name User Dashboard', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.created, true);
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'phases', '05-user-dashboard')), 'directory should be created');
    });
    (0, node_test_1.test)('does not overwrite existing files', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-CONTEXT.md'), '# Existing content');
        const result = (0, helpers_cjs_1.runGsdTools)('scaffold context --phase 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.created, false, 'should not overwrite');
        node_assert_1.default.strictEqual(output.reason, 'already_exists');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdGenerateSlug tests (CMD-01)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('generate-slug command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('converts normal text to slug', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('generate-slug "Hello World"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.slug, 'hello-world');
    });
    (0, node_test_1.test)('strips special characters', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('generate-slug "Test@#$%^Special!!!"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.slug, 'test-special');
    });
    (0, node_test_1.test)('preserves numbers', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('generate-slug "Phase 3 Plan"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.slug, 'phase-3-plan');
    });
    (0, node_test_1.test)('strips leading and trailing hyphens', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('generate-slug "---leading-trailing---"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.slug, 'leading-trailing');
    });
    (0, node_test_1.test)('fails when no text provided', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('generate-slug', tmpDir);
        node_assert_1.default.ok(!result.success, 'should fail without text');
        node_assert_1.default.ok(result.error.includes('text required'), 'error should mention text required');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdCurrentTimestamp tests (CMD-01)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('current-timestamp command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('date format returns YYYY-MM-DD', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('current-timestamp date', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.match(output.timestamp, /^\d{4}-\d{2}-\d{2}$/, 'should be YYYY-MM-DD format');
    });
    (0, node_test_1.test)('filename format returns ISO without colons or fractional seconds', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('current-timestamp filename', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.match(output.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/, 'should replace colons with hyphens and strip fractional seconds');
    });
    (0, node_test_1.test)('full format returns full ISO string', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('current-timestamp full', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.match(output.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'should be full ISO format');
    });
    (0, node_test_1.test)('default (no format) returns full ISO string', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('current-timestamp', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.match(output.timestamp, /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/, 'default should be full ISO format');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdListTodos tests (CMD-02)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('list-todos command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('empty directory returns zero count', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('list-todos', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.count, 0, 'count should be 0');
        node_assert_1.default.deepStrictEqual(output.todos, [], 'todos should be empty');
    });
    (0, node_test_1.test)('returns multiple todos with correct fields', () => {
        const pendingDir = path_1.default.join(tmpDir, '.planning', 'todos', 'pending');
        fs_1.default.mkdirSync(pendingDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'add-tests.md'), 'title: Add unit tests\narea: testing\ncreated: 2026-01-15\n');
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'fix-bug.md'), 'title: Fix login bug\narea: auth\ncreated: 2026-01-20\n');
        const result = (0, helpers_cjs_1.runGsdTools)('list-todos', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.count, 2, 'should have 2 todos');
        node_assert_1.default.strictEqual(output.todos.length, 2, 'todos array should have 2 entries');
        const testTodo = output.todos.find((t) => t.file === 'add-tests.md');
        node_assert_1.default.ok(testTodo, 'add-tests.md should be in results');
        node_assert_1.default.strictEqual(testTodo.title, 'Add unit tests');
        node_assert_1.default.strictEqual(testTodo.area, 'testing');
        node_assert_1.default.strictEqual(testTodo.created, '2026-01-15');
    });
    (0, node_test_1.test)('area filter returns only matching todos', () => {
        const pendingDir = path_1.default.join(tmpDir, '.planning', 'todos', 'pending');
        fs_1.default.mkdirSync(pendingDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'ui-task.md'), 'title: UI task\narea: ui\ncreated: 2026-01-01\n');
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'api-task.md'), 'title: API task\narea: api\ncreated: 2026-01-01\n');
        const result = (0, helpers_cjs_1.runGsdTools)('list-todos ui', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.count, 1, 'should have 1 matching todo');
        node_assert_1.default.strictEqual(output.todos[0].area, 'ui', 'should only return ui area');
    });
    (0, node_test_1.test)('area filter miss returns zero count', () => {
        const pendingDir = path_1.default.join(tmpDir, '.planning', 'todos', 'pending');
        fs_1.default.mkdirSync(pendingDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'task.md'), 'title: Some task\narea: backend\ncreated: 2026-01-01\n');
        const result = (0, helpers_cjs_1.runGsdTools)('list-todos nonexistent-area', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.count, 0, 'should have 0 matching todos');
    });
    (0, node_test_1.test)('malformed files use defaults', () => {
        const pendingDir = path_1.default.join(tmpDir, '.planning', 'todos', 'pending');
        fs_1.default.mkdirSync(pendingDir, { recursive: true });
        // File with no title or area fields
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'malformed.md'), 'some random content\nno fields here\n');
        const result = (0, helpers_cjs_1.runGsdTools)('list-todos', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.count, 1, 'malformed file should still be counted');
        node_assert_1.default.strictEqual(output.todos[0].title, 'Untitled', 'missing title defaults to Untitled');
        node_assert_1.default.strictEqual(output.todos[0].area, 'general', 'missing area defaults to general');
        node_assert_1.default.strictEqual(output.todos[0].created, 'unknown', 'missing created defaults to unknown');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdVerifyPathExists tests (CMD-02)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('verify-path-exists command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('existing file returns exists=true with type=file', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, 'test-file.txt'), 'hello');
        const result = (0, helpers_cjs_1.runGsdTools)('verify-path-exists test-file.txt', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.exists, true);
        node_assert_1.default.strictEqual(output.type, 'file');
    });
    (0, node_test_1.test)('existing directory returns exists=true with type=directory', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, 'test-dir'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('verify-path-exists test-dir', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.exists, true);
        node_assert_1.default.strictEqual(output.type, 'directory');
    });
    (0, node_test_1.test)('missing path returns exists=false', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('verify-path-exists nonexistent/path', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.exists, false);
        node_assert_1.default.strictEqual(output.type, null);
    });
    (0, node_test_1.test)('absolute path resolves correctly', () => {
        const absFile = path_1.default.join(tmpDir, 'abs-test.txt');
        fs_1.default.writeFileSync(absFile, 'content');
        const result = (0, helpers_cjs_1.runGsdTools)(`verify-path-exists ${absFile}`, tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.exists, true);
        node_assert_1.default.strictEqual(output.type, 'file');
    });
    (0, node_test_1.test)('fails when no path provided', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('verify-path-exists', tmpDir);
        node_assert_1.default.ok(!result.success, 'should fail without path');
        node_assert_1.default.ok(result.error.includes('path required'), 'error should mention path required');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdResolveModel tests (CMD-03)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('resolve-model command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('known agent returns model and profile without unknown_agent', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('resolve-model vector-planner', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.model, 'should have model field');
        node_assert_1.default.ok(output.profile, 'should have profile field');
        node_assert_1.default.strictEqual(output.unknown_agent, undefined, 'should not have unknown_agent for known agent');
    });
    (0, node_test_1.test)('unknown agent returns unknown_agent=true', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('resolve-model fake-nonexistent-agent', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.unknown_agent, true, 'should flag unknown agent');
    });
    (0, node_test_1.test)('default profile fallback when no config exists', () => {
        // tmpDir has no config.json, so defaults to balanced profile
        const result = (0, helpers_cjs_1.runGsdTools)('resolve-model vector-executor', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.profile, 'balanced', 'should default to balanced profile');
        node_assert_1.default.ok(output.model, 'should resolve a model');
    });
    (0, node_test_1.test)('fails when no agent-type provided', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('resolve-model', tmpDir);
        node_assert_1.default.ok(!result.success, 'should fail without agent-type');
        node_assert_1.default.ok(result.error.includes('agent-type required'), 'error should mention agent-type required');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdCommit tests (CMD-04)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('commit command', () => {
    const { execSync } = require('child_process');
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempGitProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('skips when commit_docs is false', () => {
        // Write config with commit_docs: false
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), JSON.stringify({ commit_docs: false }));
        const result = (0, helpers_cjs_1.runGsdTools)('commit "test message"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.committed, false);
        node_assert_1.default.strictEqual(output.reason, 'skipped_commit_docs_false');
    });
    (0, node_test_1.test)('skips when .planning is gitignored', () => {
        // Add .planning/ to .gitignore and commit it so git recognizes the ignore
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.gitignore'), '.planning/\n');
        execSync('git add .gitignore', { cwd: tmpDir, stdio: 'pipe' });
        execSync('git commit -m "add gitignore"', { cwd: tmpDir, stdio: 'pipe' });
        const result = (0, helpers_cjs_1.runGsdTools)('commit "test message"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.committed, false);
        node_assert_1.default.strictEqual(output.reason, 'skipped_gitignored');
    });
    (0, node_test_1.test)('handles nothing to commit', () => {
        // Don't modify any files after initial commit
        const result = (0, helpers_cjs_1.runGsdTools)('commit "test message"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.committed, false);
        node_assert_1.default.strictEqual(output.reason, 'nothing_to_commit');
    });
    (0, node_test_1.test)('creates real commit with correct hash', () => {
        // Create a new file in .planning/
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'test-file.md'), '# Test\n');
        const result = (0, helpers_cjs_1.runGsdTools)('commit "test: add test file" --files .planning/test-file.md', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.committed, true, 'should have committed');
        node_assert_1.default.ok(output.hash, 'should have a commit hash');
        node_assert_1.default.strictEqual(output.reason, 'committed');
        // Verify via git log
        const gitLog = execSync('git log --oneline -1', { cwd: tmpDir, encoding: 'utf-8' }).trim();
        node_assert_1.default.ok(gitLog.includes('test: add test file'), 'git log should contain the commit message');
        node_assert_1.default.ok(gitLog.includes(output.hash), 'git log should contain the returned hash');
    });
    (0, node_test_1.test)('amend mode works without crashing', () => {
        // Create a file and commit it first
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'amend-file.md'), '# Initial\n');
        execSync('git add .planning/amend-file.md', { cwd: tmpDir, stdio: 'pipe' });
        execSync('git commit -m "initial file"', { cwd: tmpDir, stdio: 'pipe' });
        // Modify the file and amend
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'amend-file.md'), '# Amended\n');
        const result = (0, helpers_cjs_1.runGsdTools)('commit "ignored" --files .planning/amend-file.md --amend', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.committed, true, 'amend should succeed');
        // Verify only 2 commits total (initial setup + amended)
        const logCount = execSync('git log --oneline', { cwd: tmpDir, encoding: 'utf-8' }).trim().split('\n').length;
        node_assert_1.default.strictEqual(logCount, 2, 'should have 2 commits (initial + amended)');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdWebsearch tests (CMD-05)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('websearch command', () => {
    const { cmdWebsearch } = require('../core/bin/lib/commands.cjs');
    let origFetch;
    let origApiKey;
    let origStdoutWrite;
    let captured;
    (0, node_test_1.beforeEach)(() => {
        origFetch = global.fetch;
        origApiKey = process.env.BRAVE_API_KEY;
        origStdoutWrite = process.stdout.write;
        captured = '';
        process.stdout.write = (chunk) => { captured += chunk; return true; };
    });
    (0, node_test_1.afterEach)(() => {
        global.fetch = origFetch;
        if (origApiKey !== undefined) {
            process.env.BRAVE_API_KEY = origApiKey;
        }
        else {
            delete process.env.BRAVE_API_KEY;
        }
        process.stdout.write = origStdoutWrite;
    });
    (0, node_test_1.test)('returns available=false when BRAVE_API_KEY is unset', async () => {
        delete process.env.BRAVE_API_KEY;
        await cmdWebsearch('test query', {}, false);
        const output = JSON.parse(captured);
        node_assert_1.default.strictEqual(output.available, false);
        node_assert_1.default.ok(output.reason.includes('BRAVE_API_KEY'), 'should mention missing API key');
    });
    (0, node_test_1.test)('returns error when no query provided', async () => {
        process.env.BRAVE_API_KEY = 'test-key';
        await cmdWebsearch(null, {}, false);
        const output = JSON.parse(captured);
        node_assert_1.default.strictEqual(output.available, false);
        node_assert_1.default.ok(output.error.includes('Query required'), 'should mention query required');
    });
    (0, node_test_1.test)('returns results for successful API response', async () => {
        process.env.BRAVE_API_KEY = 'test-key';
        global.fetch = (async () => ({
            ok: true,
            json: async () => ({
                web: {
                    results: [
                        { title: 'Test Result', url: 'https://example.com', description: 'A test result', age: '1d' },
                    ],
                },
            }),
        }));
        await cmdWebsearch('test query', { limit: 5, freshness: 'pd' }, false);
        const output = JSON.parse(captured);
        node_assert_1.default.strictEqual(output.available, true);
        node_assert_1.default.strictEqual(output.query, 'test query');
        node_assert_1.default.strictEqual(output.count, 1);
        node_assert_1.default.strictEqual(output.results[0].title, 'Test Result');
        node_assert_1.default.strictEqual(output.results[0].url, 'https://example.com');
        node_assert_1.default.strictEqual(output.results[0].age, '1d');
    });
    (0, node_test_1.test)('constructs correct URL parameters', async () => {
        process.env.BRAVE_API_KEY = 'test-key';
        let capturedUrl = '';
        global.fetch = (async (url) => {
            capturedUrl = url.toString();
            return {
                ok: true,
                json: async () => ({ web: { results: [] } }),
            };
        });
        await cmdWebsearch('node.js testing', { limit: 5, freshness: 'pd' }, false);
        const parsed = new URL(capturedUrl);
        node_assert_1.default.strictEqual(parsed.searchParams.get('q'), 'node.js testing', 'query param should decode to original string');
        node_assert_1.default.strictEqual(parsed.searchParams.get('count'), '5', 'count param should be 5');
        node_assert_1.default.strictEqual(parsed.searchParams.get('freshness'), 'pd', 'freshness param should be pd');
    });
    (0, node_test_1.test)('handles API error (non-200 status)', async () => {
        process.env.BRAVE_API_KEY = 'test-key';
        global.fetch = (async () => ({
            ok: false,
            status: 429,
        }));
        await cmdWebsearch('test query', {}, false);
        const output = JSON.parse(captured);
        node_assert_1.default.strictEqual(output.available, false);
        node_assert_1.default.ok(output.error.includes('429'), 'error should include status code');
    });
    (0, node_test_1.test)('handles network failure', async () => {
        process.env.BRAVE_API_KEY = 'test-key';
        global.fetch = async () => {
            throw new Error('Network timeout');
        };
        await cmdWebsearch('test query', {}, false);
        const output = JSON.parse(captured);
        node_assert_1.default.strictEqual(output.available, false);
        node_assert_1.default.strictEqual(output.error, 'Network timeout');
    });
});
(0, node_test_1.describe)('stats command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('returns valid JSON with empty project', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('stats', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const stats = JSON.parse(result.output);
        node_assert_1.default.ok(Array.isArray(stats.phases), 'phases should be an array');
        node_assert_1.default.strictEqual(stats.total_plans, 0);
        node_assert_1.default.strictEqual(stats.total_summaries, 0);
        node_assert_1.default.strictEqual(stats.percent, 0);
        node_assert_1.default.strictEqual(stats.phases_completed, 0);
        node_assert_1.default.strictEqual(stats.phases_total, 0);
        node_assert_1.default.strictEqual(stats.requirements_total, 0);
        node_assert_1.default.strictEqual(stats.requirements_complete, 0);
    });
    (0, node_test_1.test)('counts phases, plans, and summaries correctly', () => {
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-auth');
        const p2 = path_1.default.join(tmpDir, '.planning', 'phases', '02-api');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.mkdirSync(p2, { recursive: true });
        // Phase 1: 2 plans, 2 summaries (complete)
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-02-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-02-SUMMARY.md'), '# Summary');
        // Phase 2: 1 plan, 0 summaries (planned)
        fs_1.default.writeFileSync(path_1.default.join(p2, '02-01-PLAN.md'), '# Plan');
        const result = (0, helpers_cjs_1.runGsdTools)('stats', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const stats = JSON.parse(result.output);
        node_assert_1.default.strictEqual(stats.phases_total, 2);
        node_assert_1.default.strictEqual(stats.phases_completed, 1);
        node_assert_1.default.strictEqual(stats.total_plans, 3);
        node_assert_1.default.strictEqual(stats.total_summaries, 2);
        node_assert_1.default.strictEqual(stats.percent, 50);
        node_assert_1.default.strictEqual(stats.plan_percent, 67);
    });
    (0, node_test_1.test)('counts requirements from REQUIREMENTS.md', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), `# Requirements

## v1 Requirements

- [x] **AUTH-01**: User can sign up
- [x] **AUTH-02**: User can log in
- [ ] **API-01**: REST endpoints
- [ ] **API-02**: GraphQL support
`);
        const result = (0, helpers_cjs_1.runGsdTools)('stats', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const stats = JSON.parse(result.output);
        node_assert_1.default.strictEqual(stats.requirements_total, 4);
        node_assert_1.default.strictEqual(stats.requirements_complete, 2);
    });
    (0, node_test_1.test)('reads last activity from STATE.md', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 01\n**Status:** In progress\n**Last Activity:** 2025-06-15\n**Last Activity Description:** Working\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('stats', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const stats = JSON.parse(result.output);
        node_assert_1.default.strictEqual(stats.last_activity, '2025-06-15');
    });
    (0, node_test_1.test)('reads last activity from plain STATE.md template format', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# Project State\n\n## Current Position\n\nPhase: 1 of 2 (Foundation)\nPlan: 1 of 1 in current phase\nStatus: In progress\nLast activity: 2025-06-16 — Finished plan 01-01\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('stats', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const stats = JSON.parse(result.output);
        node_assert_1.default.strictEqual(stats.last_activity, '2025-06-16 — Finished plan 01-01');
    });
    (0, node_test_1.test)('includes roadmap-only phases in totals and preserves hyphenated names', () => {
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '14-auth-hardening');
        const p2 = path_1.default.join(tmpDir, '.planning', 'phases', '15-proof-generation');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.mkdirSync(p2, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '14-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '14-01-SUMMARY.md'), '# Summary');
        fs_1.default.writeFileSync(path_1.default.join(p2, '15-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p2, '15-01-SUMMARY.md'), '# Summary');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [x] **Phase 14: Auth Hardening**
- [x] **Phase 15: Proof Generation**
- [ ] **Phase 16: Multi-Claim Verification & UX**

## Milestone v1.0 Growth

### Phase 14: Auth Hardening
**Goal:** Improve auth checks

### Phase 15: Proof Generation
**Goal:** Improve proof generation

### Phase 16: Multi-Claim Verification & UX
**Goal:** Support multi-claim verification
`);
        const result = (0, helpers_cjs_1.runGsdTools)('stats', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const stats = JSON.parse(result.output);
        node_assert_1.default.strictEqual(stats.phases_total, 3);
        node_assert_1.default.strictEqual(stats.phases_completed, 2);
        node_assert_1.default.strictEqual(stats.percent, 67);
        node_assert_1.default.strictEqual(stats.plan_percent, 100);
        node_assert_1.default.strictEqual(stats.phases.find((p) => p.number === '16')?.name, 'Multi-Claim Verification & UX');
        node_assert_1.default.strictEqual(stats.phases.find((p) => p.number === '16')?.status, 'Not Started');
    });
    (0, node_test_1.test)('reports git commit count and first commit date from repository history', () => {
        (0, node_child_process_1.execSync)('git init', { cwd: tmpDir, stdio: 'pipe' });
        (0, node_child_process_1.execSync)('git config user.email "test@example.com"', { cwd: tmpDir, stdio: 'pipe' });
        (0, node_child_process_1.execSync)('git config user.name "Test User"', { cwd: tmpDir, stdio: 'pipe' });
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n');
        (0, node_child_process_1.execSync)('git add -A', { cwd: tmpDir, stdio: 'pipe' });
        (0, node_child_process_1.execSync)('git commit -m "initial commit"', {
            cwd: tmpDir,
            stdio: 'pipe',
            env: {
                ...process.env,
                GIT_AUTHOR_DATE: '2026-01-01T00:00:00Z',
                GIT_COMMITTER_DATE: '2026-01-01T00:00:00Z',
            },
        });
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, 'README.md'), '# Updated\n');
        (0, node_child_process_1.execSync)('git add README.md', { cwd: tmpDir, stdio: 'pipe' });
        (0, node_child_process_1.execSync)('git commit -m "second commit"', {
            cwd: tmpDir,
            stdio: 'pipe',
            env: {
                ...process.env,
                GIT_AUTHOR_DATE: '2026-02-01T00:00:00Z',
                GIT_COMMITTER_DATE: '2026-02-01T00:00:00Z',
            },
        });
        const result = (0, helpers_cjs_1.runGsdTools)('stats', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const stats = JSON.parse(result.output);
        node_assert_1.default.strictEqual(stats.git_commits, 2);
        node_assert_1.default.strictEqual(stats.git_first_commit_date, '2026-01-01');
    });
    (0, node_test_1.test)('table format renders readable output', () => {
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-auth');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        const result = (0, helpers_cjs_1.runGsdTools)('stats table', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.ok(parsed.rendered, 'table format should include rendered field');
        node_assert_1.default.ok(parsed.rendered.includes('Statistics'), 'should include Statistics header');
        node_assert_1.default.ok(parsed.rendered.includes('| Phase |'), 'should include table header');
        node_assert_1.default.ok(parsed.rendered.includes('| 1 |'), 'should include phase row');
        node_assert_1.default.ok(parsed.rendered.includes('1/1 phases'), 'should report phase progress');
    });
});
//# sourceMappingURL=commands.test.cjs.map