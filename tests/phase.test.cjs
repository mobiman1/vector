"use strict";
/**
 * Vector Tools Tests - Phase
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
(0, node_test_1.describe)('phases list command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('empty phases directory returns empty array', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('phases list', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(output.directories, [], 'directories should be empty');
        node_assert_1.default.strictEqual(output.count, 0, 'count should be 0');
    });
    (0, node_test_1.test)('lists phase directories sorted numerically', () => {
        // Create out-of-order directories
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '10-final'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phases list', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.count, 3, 'should have 3 directories');
        node_assert_1.default.deepStrictEqual(output.directories, ['01-foundation', '02-api', '10-final'], 'should be sorted numerically');
    });
    (0, node_test_1.test)('handles decimal phases in sort order', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '02.1-hotfix'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '02.2-patch'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-ui'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phases list', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(output.directories, ['02-api', '02.1-hotfix', '02.2-patch', '03-ui'], 'decimal phases should sort correctly between whole numbers');
    });
    (0, node_test_1.test)('--type plans lists only PLAN.md files', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-PLAN.md'), '# Plan 1');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-02-PLAN.md'), '# Plan 2');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), '# Summary');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, 'RESEARCH.md'), '# Research');
        const result = (0, helpers_cjs_1.runGsdTools)('phases list --type plans', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(output.files.sort(), ['01-01-PLAN.md', '01-02-PLAN.md'], 'should list only PLAN files');
    });
    (0, node_test_1.test)('--type summaries lists only SUMMARY.md files', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), '# Summary 1');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-02-SUMMARY.md'), '# Summary 2');
        const result = (0, helpers_cjs_1.runGsdTools)('phases list --type summaries', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(output.files.sort(), ['01-01-SUMMARY.md', '01-02-SUMMARY.md'], 'should list only SUMMARY files');
    });
    (0, node_test_1.test)('--phase filters to specific phase directory', () => {
        const phase01 = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        const phase02 = path_1.default.join(tmpDir, '.planning', 'phases', '02-api');
        fs_1.default.mkdirSync(phase01, { recursive: true });
        fs_1.default.mkdirSync(phase02, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase01, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(phase02, '02-01-PLAN.md'), '# Plan');
        const result = (0, helpers_cjs_1.runGsdTools)('phases list --type plans --phase 01', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(output.files, ['01-01-PLAN.md'], 'should only list phase 01 plans');
        node_assert_1.default.strictEqual(output.phase_dir, 'foundation', 'should report phase name without number prefix');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// roadmap get-phase command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('phase next-decimal command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('returns X.1 when no decimal phases exist', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '07-next'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase next-decimal 06', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.next, '06.1', 'should return 06.1');
        node_assert_1.default.deepStrictEqual(output.existing, [], 'no existing decimals');
    });
    (0, node_test_1.test)('increments from existing decimal phases', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06.1-hotfix'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06.2-patch'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase next-decimal 06', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.next, '06.3', 'should return 06.3');
        node_assert_1.default.deepStrictEqual(output.existing, ['06.1', '06.2'], 'lists existing decimals');
    });
    (0, node_test_1.test)('handles gaps in decimal sequence', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06.1-first'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06.3-third'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase next-decimal 06', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        // Should take next after highest, not fill gap
        node_assert_1.default.strictEqual(output.next, '06.4', 'should return 06.4, not fill gap at 06.2');
    });
    (0, node_test_1.test)('handles single-digit phase input', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06-feature'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase next-decimal 6', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.next, '06.1', 'should normalize to 06.1');
        node_assert_1.default.strictEqual(output.base_phase, '06', 'base phase should be padded');
    });
    (0, node_test_1.test)('returns error if base phase does not exist', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-start'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase next-decimal 06', tmpDir);
        node_assert_1.default.ok(result.success, `Command should succeed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.found, false, 'base phase not found');
        node_assert_1.default.strictEqual(output.next, '06.1', 'should still suggest 06.1');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// phase-plan-index command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('phase-plan-index command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('empty phase directory returns empty plans array', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase-plan-index 03', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase, '03', 'phase number correct');
        node_assert_1.default.deepStrictEqual(output.plans, [], 'plans should be empty');
        node_assert_1.default.deepStrictEqual(output.waves, {}, 'waves should be empty');
        node_assert_1.default.deepStrictEqual(output.incomplete, [], 'incomplete should be empty');
        node_assert_1.default.strictEqual(output.has_checkpoints, false, 'no checkpoints');
    });
    (0, node_test_1.test)('extracts single plan with frontmatter', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-01-PLAN.md'), `---
wave: 1
autonomous: true
objective: Set up database schema
files-modified: [prisma/schema.prisma, src/lib/db.ts]
---

## Task 1: Create schema
## Task 2: Generate client
`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase-plan-index 03', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.plans.length, 1, 'should have 1 plan');
        node_assert_1.default.strictEqual(output.plans[0].id, '03-01', 'plan id correct');
        node_assert_1.default.strictEqual(output.plans[0].wave, 1, 'wave extracted');
        node_assert_1.default.strictEqual(output.plans[0].autonomous, true, 'autonomous extracted');
        node_assert_1.default.strictEqual(output.plans[0].objective, 'Set up database schema', 'objective extracted');
        node_assert_1.default.deepStrictEqual(output.plans[0].files_modified, ['prisma/schema.prisma', 'src/lib/db.ts'], 'files extracted');
        node_assert_1.default.strictEqual(output.plans[0].task_count, 2, 'task count correct');
        node_assert_1.default.strictEqual(output.plans[0].has_summary, false, 'no summary yet');
    });
    (0, node_test_1.test)('groups multiple plans by wave', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-01-PLAN.md'), `---
wave: 1
autonomous: true
objective: Database setup
---

## Task 1: Schema
`);
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-02-PLAN.md'), `---
wave: 1
autonomous: true
objective: Auth setup
---

## Task 1: JWT
`);
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-03-PLAN.md'), `---
wave: 2
autonomous: false
objective: API routes
---

## Task 1: Routes
`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase-plan-index 03', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.plans.length, 3, 'should have 3 plans');
        node_assert_1.default.deepStrictEqual(output.waves['1'], ['03-01', '03-02'], 'wave 1 has 2 plans');
        node_assert_1.default.deepStrictEqual(output.waves['2'], ['03-03'], 'wave 2 has 1 plan');
    });
    (0, node_test_1.test)('detects incomplete plans (no matching summary)', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        // Plan with summary
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-01-PLAN.md'), `---\nwave: 1\n---\n## Task 1`);
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-01-SUMMARY.md'), `# Summary`);
        // Plan without summary
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-02-PLAN.md'), `---\nwave: 2\n---\n## Task 1`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase-plan-index 03', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.plans[0].has_summary, true, 'first plan has summary');
        node_assert_1.default.strictEqual(output.plans[1].has_summary, false, 'second plan has no summary');
        node_assert_1.default.deepStrictEqual(output.incomplete, ['03-02'], 'incomplete list correct');
    });
    (0, node_test_1.test)('detects checkpoints (autonomous: false)', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-01-PLAN.md'), `---
wave: 1
autonomous: false
objective: Manual review needed
---

## Task 1: Review
`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase-plan-index 03', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.has_checkpoints, true, 'should detect checkpoint');
        node_assert_1.default.strictEqual(output.plans[0].autonomous, false, 'plan marked non-autonomous');
    });
    (0, node_test_1.test)('phase not found returns error', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('phase-plan-index 99', tmpDir);
        node_assert_1.default.ok(result.success, `Command should succeed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.error, 'Phase not found', 'should report phase not found');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// phase-plan-index — canonical XML format (template-aligned)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('phase-plan-index canonical format', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('files_modified: underscore key is parsed correctly', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '04-ui');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '04-01-PLAN.md'), `---
wave: 1
autonomous: true
files_modified: [src/App.tsx, src/index.ts]
---

<objective>
Build main application shell

Purpose: Entry point
Output: App component
</objective>

<tasks>
<task type="auto">
  <name>Task 1: Create App component</name>
  <files>src/App.tsx</files>
  <action>Create component</action>
  <verify>npm run build</verify>
  <done>Component renders</done>
</task>
</tasks>
`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase-plan-index 04', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(output.plans[0].files_modified, ['src/App.tsx', 'src/index.ts'], 'files_modified with underscore should be parsed');
    });
    (0, node_test_1.test)('objective: extracted from <objective> XML tag, not frontmatter', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '04-ui');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '04-01-PLAN.md'), `---
wave: 1
autonomous: true
files_modified: []
---

<objective>
Build main application shell

Purpose: Entry point for the SPA
Output: App.tsx with routing
</objective>

<tasks>
<task type="auto">
  <name>Task 1: Scaffold</name>
  <files>src/App.tsx</files>
  <action>Create shell</action>
  <verify>build passes</verify>
  <done>App renders</done>
</task>
</tasks>
`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase-plan-index 04', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.plans[0].objective, 'Build main application shell', 'objective should come from <objective> XML tag first line');
    });
    (0, node_test_1.test)('task_count: counts <task> XML tags', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '04-ui');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '04-01-PLAN.md'), `---
wave: 1
autonomous: true
files_modified: []
---

<objective>
Create UI components
</objective>

<tasks>
<task type="auto">
  <name>Task 1: Header</name>
  <files>src/Header.tsx</files>
  <action>Create header</action>
  <verify>build</verify>
  <done>Header renders</done>
</task>

<task type="auto">
  <name>Task 2: Footer</name>
  <files>src/Footer.tsx</files>
  <action>Create footer</action>
  <verify>build</verify>
  <done>Footer renders</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>UI components</what-built>
  <how-to-verify>Visit localhost:3000</how-to-verify>
  <resume-signal>Type approved</resume-signal>
</task>
</tasks>
`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase-plan-index 04', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.plans[0].task_count, 3, 'should count all 3 <task> XML tags');
    });
    (0, node_test_1.test)('all three fields work together in canonical plan format', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '04-ui');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '04-01-PLAN.md'), `---
phase: 04-ui
plan: 01
type: execute
wave: 1
depends_on: []
files_modified: [src/components/Chat.tsx, src/app/api/chat/route.ts]
autonomous: true
requirements: [R1, R2]
---

<objective>
Implement complete Chat feature as vertical slice.

Purpose: Self-contained chat that can run parallel to other features.
Output: Chat component, API endpoints.
</objective>

<execution_context>
@~/.claude/core/workflows/execute-plan.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/ROADMAP.md
</context>

<tasks>
<task type="auto">
  <name>Task 1: Create Chat component</name>
  <files>src/components/Chat.tsx</files>
  <action>Build chat UI with message list and input</action>
  <verify>npm run build</verify>
  <done>Chat component renders messages</done>
</task>

<task type="auto">
  <name>Task 2: Create Chat API</name>
  <files>src/app/api/chat/route.ts</files>
  <action>GET /api/chat and POST /api/chat endpoints</action>
  <verify>curl tests pass</verify>
  <done>CRUD operations work</done>
</task>
</tasks>

<verification>
- [ ] npm run build succeeds
- [ ] API endpoints respond correctly
</verification>
`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase-plan-index 04', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        const plan = output.plans[0];
        node_assert_1.default.strictEqual(plan.objective, 'Implement complete Chat feature as vertical slice.', 'objective from XML tag');
        node_assert_1.default.deepStrictEqual(plan.files_modified, ['src/components/Chat.tsx', 'src/app/api/chat/route.ts'], 'files_modified with underscore');
        node_assert_1.default.strictEqual(plan.task_count, 2, 'task_count from <task> XML tags');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// state-snapshot command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('phase add command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('adds phase after highest existing', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0

### Phase 1: Foundation
**Goal:** Setup

### Phase 2: API
**Goal:** Build API

---
`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase add User Dashboard', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_number, 3, 'should be phase 3');
        node_assert_1.default.strictEqual(output.slug, 'user-dashboard');
        // Verify directory created
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-user-dashboard')), 'directory should be created');
        // Verify ROADMAP updated
        const roadmap = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
        node_assert_1.default.ok(roadmap.includes('### Phase 3: User Dashboard'), 'roadmap should include new phase');
        node_assert_1.default.ok(roadmap.includes('**Depends on:** Phase 2'), 'should depend on previous');
    });
    (0, node_test_1.test)('handles empty roadmap', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase add Initial Setup', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_number, 1, 'should be phase 1');
    });
    (0, node_test_1.test)('phase add includes **Requirements**: TBD in new ROADMAP entry', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0\n\n### Phase 1: Foundation\n**Goal:** Setup\n\n---\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase add User Dashboard', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const roadmap = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
        node_assert_1.default.ok(roadmap.includes('**Requirements**: TBD'), 'new phase entry should include Requirements TBD');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// phase insert command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('phase insert command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('inserts decimal phase after target', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Foundation
**Goal:** Setup

### Phase 2: API
**Goal:** Build API
`);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase insert 1 Fix Critical Bug', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_number, '01.1', 'should be 01.1');
        node_assert_1.default.strictEqual(output.after_phase, '1');
        // Verify directory
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'phases', '01.1-fix-critical-bug')), 'decimal phase directory should be created');
        // Verify ROADMAP
        const roadmap = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
        node_assert_1.default.ok(roadmap.includes('Phase 01.1: Fix Critical Bug (INSERTED)'), 'roadmap should include inserted phase');
    });
    (0, node_test_1.test)('increments decimal when siblings exist', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Foundation
**Goal:** Setup

### Phase 2: API
**Goal:** Build API
`);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01.1-hotfix'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase insert 1 Another Fix', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_number, '01.2', 'should be 01.2');
    });
    (0, node_test_1.test)('rejects missing phase', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n### Phase 1: Test\n**Goal:** Test\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('phase insert 99 Fix Something', tmpDir);
        node_assert_1.default.ok(!result.success, 'should fail for missing phase');
        node_assert_1.default.ok(result.error.includes('not found'), 'error mentions not found');
    });
    (0, node_test_1.test)('handles padding mismatch between input and roadmap', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

## Phase 09.05: Existing Decimal Phase
**Goal:** Test padding

## Phase 09.1: Next Phase
**Goal:** Test
`);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '09.05-existing'), { recursive: true });
        // Pass unpadded "9.05" but roadmap has "09.05"
        const result = (0, helpers_cjs_1.runGsdTools)('phase insert 9.05 Padding Test', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.after_phase, '9.05');
        const roadmap = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
        node_assert_1.default.ok(roadmap.includes('(INSERTED)'), 'roadmap should include inserted phase');
    });
    (0, node_test_1.test)('phase insert includes **Requirements**: TBD in new ROADMAP entry', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n\n### Phase 1: Foundation\n**Goal:** Setup\n\n### Phase 2: API\n**Goal:** Build API\n`);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase insert 1 Fix Critical Bug', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const roadmap = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
        node_assert_1.default.ok(roadmap.includes('**Requirements**: TBD'), 'inserted phase entry should include Requirements TBD');
    });
    (0, node_test_1.test)('handles #### heading depth from multi-milestone roadmaps', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### v1.1 Milestone

#### Phase 5: Feature Work
**Goal:** Build features

#### Phase 6: Polish
**Goal:** Polish
`);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '05-feature-work'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase insert 5 Hotfix', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_number, '05.1');
        const roadmap = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
        node_assert_1.default.ok(roadmap.includes('Phase 05.1: Hotfix (INSERTED)'), 'roadmap should include inserted phase');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// phase remove command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('phase remove command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('removes phase directory and renumbers subsequent', () => {
        // Setup 3 phases
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Foundation
**Goal:** Setup
**Depends on:** Nothing

### Phase 2: Auth
**Goal:** Authentication
**Depends on:** Phase 1

### Phase 3: Features
**Goal:** Core features
**Depends on:** Phase 2
`);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation'), { recursive: true });
        const p2 = path_1.default.join(tmpDir, '.planning', 'phases', '02-auth');
        fs_1.default.mkdirSync(p2, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p2, '02-01-PLAN.md'), '# Plan');
        const p3 = path_1.default.join(tmpDir, '.planning', 'phases', '03-features');
        fs_1.default.mkdirSync(p3, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p3, '03-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p3, '03-02-PLAN.md'), '# Plan 2');
        // Remove phase 2
        const result = (0, helpers_cjs_1.runGsdTools)('phase remove 2', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.removed, '2');
        node_assert_1.default.strictEqual(output.directory_deleted, '02-auth');
        // Phase 3 should be renumbered to 02
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'phases', '02-features')), 'phase 3 should be renumbered to 02-features');
        node_assert_1.default.ok(!fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-features')), 'old 03-features should not exist');
        // Files inside should be renamed
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'phases', '02-features', '02-01-PLAN.md')), 'plan file should be renumbered to 02-01');
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'phases', '02-features', '02-02-PLAN.md')), 'plan 2 should be renumbered to 02-02');
        // ROADMAP should be updated
        const roadmap = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
        node_assert_1.default.ok(!roadmap.includes('Phase 2: Auth'), 'removed phase should not be in roadmap');
        node_assert_1.default.ok(roadmap.includes('Phase 2: Features'), 'phase 3 should be renumbered to 2');
    });
    (0, node_test_1.test)('rejects removal of phase with summaries unless --force', () => {
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n### Phase 1: Test\n**Goal:** Test\n`);
        // Should fail without --force
        const result = (0, helpers_cjs_1.runGsdTools)('phase remove 1', tmpDir);
        node_assert_1.default.ok(!result.success, 'should fail without --force');
        node_assert_1.default.ok(result.error.includes('executed plan'), 'error mentions executed plans');
        // Should succeed with --force
        const forceResult = (0, helpers_cjs_1.runGsdTools)('phase remove 1 --force', tmpDir);
        node_assert_1.default.ok(forceResult.success, `Force remove failed: ${forceResult.error}`);
    });
    (0, node_test_1.test)('removes decimal phase and renumbers siblings', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n### Phase 6: Main\n**Goal:** Main\n### Phase 6.1: Fix A\n**Goal:** Fix A\n### Phase 6.2: Fix B\n**Goal:** Fix B\n### Phase 6.3: Fix C\n**Goal:** Fix C\n`);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06-main'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06.1-fix-a'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06.2-fix-b'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06.3-fix-c'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase remove 6.2', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        // 06.3 should become 06.2
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'phases', '06.2-fix-c')), '06.3 should be renumbered to 06.2');
        node_assert_1.default.ok(!fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'phases', '06.3-fix-c')), 'old 06.3 should not exist');
    });
    (0, node_test_1.test)('updates STATE.md phase count', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n### Phase 1: A\n**Goal:** A\n### Phase 2: B\n**Goal:** B\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 1\n**Total Phases:** 2\n`);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '02-b'), { recursive: true });
        (0, helpers_cjs_1.runGsdTools)('phase remove 2', tmpDir);
        const state = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(state.includes('**Total Phases:** 1'), 'total phases should be decremented');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// phase complete command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('phase complete command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('marks phase complete and transitions to next', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [ ] Phase 1: Foundation
- [ ] Phase 2: API

### Phase 1: Foundation
**Goal:** Setup
**Plans:** 1 plans

### Phase 2: API
**Goal:** Build API
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Foundation\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working on phase 1\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.completed_phase, '1');
        node_assert_1.default.strictEqual(output.plans_executed, '1/1');
        node_assert_1.default.strictEqual(output.next_phase, '02');
        node_assert_1.default.strictEqual(output.is_last_phase, false);
        // Verify STATE.md updated
        const state = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(state.includes('**Current Phase:** 02'), 'should advance to phase 02');
        node_assert_1.default.ok(state.includes('**Status:** Ready to plan'), 'status should be ready to plan');
        node_assert_1.default.ok(state.includes('**Current Plan:** Not started'), 'plan should be reset');
        // Verify ROADMAP checkbox
        const roadmap = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
        node_assert_1.default.ok(roadmap.includes('[x]'), 'phase should be checked off');
        node_assert_1.default.ok(roadmap.includes('completed'), 'completion date should be added');
    });
    (0, node_test_1.test)('detects last phase in milestone', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n### Phase 1: Only Phase\n**Goal:** Everything\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 01\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-only-phase');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.is_last_phase, true, 'should detect last phase');
        node_assert_1.default.strictEqual(output.next_phase, null, 'no next phase');
        const state = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(state.includes('Milestone complete'), 'status should be milestone complete');
    });
    (0, node_test_1.test)('updates REQUIREMENTS.md traceability when phase completes', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [ ] Phase 1: Auth

### Phase 1: Auth
**Goal:** User authentication
**Requirements:** AUTH-01, AUTH-02
**Plans:** 1 plans

### Phase 2: API
**Goal:** Build API
**Requirements:** API-01
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), `# Requirements

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email
- [ ] **AUTH-02**: User can log in
- [ ] **AUTH-03**: User can reset password

### API

- [ ] **API-01**: REST endpoints

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 2 | Pending |
| API-01 | Phase 2 | Pending |
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Auth\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-auth');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const req = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), 'utf-8');
        // Checkboxes updated for phase 1 requirements
        node_assert_1.default.ok(req.includes('- [x] **AUTH-01**'), 'AUTH-01 checkbox should be checked');
        node_assert_1.default.ok(req.includes('- [x] **AUTH-02**'), 'AUTH-02 checkbox should be checked');
        // Other requirements unchanged
        node_assert_1.default.ok(req.includes('- [ ] **AUTH-03**'), 'AUTH-03 should remain unchecked');
        node_assert_1.default.ok(req.includes('- [ ] **API-01**'), 'API-01 should remain unchecked');
        // Traceability table updated
        node_assert_1.default.ok(req.includes('| AUTH-01 | Phase 1 | Complete |'), 'AUTH-01 status should be Complete');
        node_assert_1.default.ok(req.includes('| AUTH-02 | Phase 1 | Complete |'), 'AUTH-02 status should be Complete');
        node_assert_1.default.ok(req.includes('| AUTH-03 | Phase 2 | Pending |'), 'AUTH-03 should remain Pending');
        node_assert_1.default.ok(req.includes('| API-01 | Phase 2 | Pending |'), 'API-01 should remain Pending');
    });
    (0, node_test_1.test)('handles requirements with bracket format [REQ-01, REQ-02]', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [ ] Phase 1: Auth

### Phase 1: Auth
**Goal:** User authentication
**Requirements:** [AUTH-01, AUTH-02]
**Plans:** 1 plans

### Phase 2: API
**Goal:** Build API
**Requirements:** [API-01]
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), `# Requirements

## v1 Requirements

### Authentication

- [ ] **AUTH-01**: User can sign up with email
- [ ] **AUTH-02**: User can log in
- [ ] **AUTH-03**: User can reset password

### API

- [ ] **API-01**: REST endpoints

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
| AUTH-02 | Phase 1 | Pending |
| AUTH-03 | Phase 2 | Pending |
| API-01 | Phase 2 | Pending |
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Auth\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-auth');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '02-api'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const req = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), 'utf-8');
        // Checkboxes updated for phase 1 requirements (brackets stripped)
        node_assert_1.default.ok(req.includes('- [x] **AUTH-01**'), 'AUTH-01 checkbox should be checked');
        node_assert_1.default.ok(req.includes('- [x] **AUTH-02**'), 'AUTH-02 checkbox should be checked');
        // Other requirements unchanged
        node_assert_1.default.ok(req.includes('- [ ] **AUTH-03**'), 'AUTH-03 should remain unchecked');
        node_assert_1.default.ok(req.includes('- [ ] **API-01**'), 'API-01 should remain unchecked');
        // Traceability table updated
        node_assert_1.default.ok(req.includes('| AUTH-01 | Phase 1 | Complete |'), 'AUTH-01 status should be Complete');
        node_assert_1.default.ok(req.includes('| AUTH-02 | Phase 1 | Complete |'), 'AUTH-02 status should be Complete');
        node_assert_1.default.ok(req.includes('| AUTH-03 | Phase 2 | Pending |'), 'AUTH-03 should remain Pending');
        node_assert_1.default.ok(req.includes('| API-01 | Phase 2 | Pending |'), 'API-01 should remain Pending');
    });
    (0, node_test_1.test)('handles phase with no requirements mapping', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [ ] Phase 1: Setup

### Phase 1: Setup
**Goal:** Project setup (no requirements)
**Plans:** 1 plans
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), `# Requirements

## v1 Requirements

- [ ] **REQ-01**: Some requirement

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REQ-01 | Phase 2 | Pending |
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 01\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-setup');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        // REQUIREMENTS.md should be unchanged
        const req = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), 'utf-8');
        node_assert_1.default.ok(req.includes('- [ ] **REQ-01**'), 'REQ-01 should remain unchecked');
        node_assert_1.default.ok(req.includes('| REQ-01 | Phase 2 | Pending |'), 'REQ-01 should remain Pending');
    });
    (0, node_test_1.test)('handles missing REQUIREMENTS.md gracefully', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [ ] Phase 1: Foundation
**Requirements:** REQ-01

### Phase 1: Foundation
**Goal:** Setup
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 01\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command should succeed even without REQUIREMENTS.md: ${result.error}`);
    });
    (0, node_test_1.test)('returns requirements_updated field in result', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [ ] Phase 1: Auth

### Phase 1: Auth
**Goal:** User authentication
**Requirements:** AUTH-01
**Plans:** 1 plans
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), `# Requirements

## v1 Requirements

- [ ] **AUTH-01**: User can sign up

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Pending |
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Auth\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-auth');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.strictEqual(parsed.requirements_updated, true, 'requirements_updated should be true');
    });
    (0, node_test_1.test)('handles In Progress status in traceability table', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [ ] Phase 1: Auth

### Phase 1: Auth
**Goal:** User authentication
**Requirements:** AUTH-01, AUTH-02
**Plans:** 1 plans
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), `# Requirements

## v1 Requirements

- [ ] **AUTH-01**: User can sign up
- [ ] **AUTH-02**: User can log in

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | In Progress |
| AUTH-02 | Phase 1 | Pending |
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Auth\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-auth');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const req = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), 'utf-8');
        node_assert_1.default.ok(req.includes('| AUTH-01 | Phase 1 | Complete |'), 'In Progress should become Complete');
        node_assert_1.default.ok(req.includes('| AUTH-02 | Phase 1 | Complete |'), 'Pending should become Complete');
    });
    (0, node_test_1.test)('scoped regex does not cross phase boundaries', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [ ] Phase 1: Setup
- [ ] Phase 2: Auth

### Phase 1: Setup
**Goal:** Project setup
**Plans:** 1 plans

### Phase 2: Auth
**Goal:** User authentication
**Requirements:** AUTH-01
**Plans:** 0 plans
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), `# Requirements

## v1 Requirements

- [ ] **AUTH-01**: User can sign up

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 2 | Pending |
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Current Phase:** 01\n**Current Phase Name:** Setup\n**Status:** In progress\n**Current Plan:** 01-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-setup');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '02-auth'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        // Phase 1 has no Requirements field, so Phase 2's AUTH-01 should NOT be updated
        const req = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), 'utf-8');
        node_assert_1.default.ok(req.includes('- [ ] **AUTH-01**'), 'AUTH-01 should remain unchecked (belongs to Phase 2)');
        node_assert_1.default.ok(req.includes('| AUTH-01 | Phase 2 | Pending |'), 'AUTH-01 should remain Pending (belongs to Phase 2)');
    });
    (0, node_test_1.test)('handles multi-level decimal phase without regex crash', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [x] Phase 3: Lorem
- [x] Phase 3.2: Ipsum
- [ ] Phase 3.2.1: Dolor Sit
- [ ] Phase 4: Amet

### Phase 3: Lorem
**Goal:** Setup
**Plans:** 1/1 plans complete
**Requirements:** LOR-01

### Phase 3.2: Ipsum
**Goal:** Build
**Plans:** 1/1 plans complete
**Requirements:** IPS-01

### Phase 03.2.1: Dolor Sit Polish (INSERTED)
**Goal:** Polish
**Plans:** 1/1 plans complete

### Phase 4: Amet
**Goal:** Deliver
**Requirements:** AMT-01: Filter items by category with AND logic (items matching ALL selected categories)
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), `# Requirements

- [ ] **LOR-01**: Lorem database schema
- [ ] **IPS-01**: Ipsum rendering engine
- [ ] **AMT-01**: Filter items by category
`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State

**Current Phase:** 03.2.1
**Current Phase Name:** Dolor Sit Polish
**Status:** Execution complete
**Current Plan:** 03.2.1-01
**Last Activity:** 2025-01-01
**Last Activity Description:** Working
`);
        const p32 = path_1.default.join(tmpDir, '.planning', 'phases', '03.2-ipsum');
        const p321 = path_1.default.join(tmpDir, '.planning', 'phases', '03.2.1-dolor-sit');
        const p4 = path_1.default.join(tmpDir, '.planning', 'phases', '04-amet');
        fs_1.default.mkdirSync(p32, { recursive: true });
        fs_1.default.mkdirSync(p321, { recursive: true });
        fs_1.default.mkdirSync(p4, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p321, '03.2.1-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p321, '03.2.1-01-SUMMARY.md'), '# Summary');
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 03.2.1', tmpDir);
        node_assert_1.default.ok(result.success, `Command should not crash on regex metacharacters: ${result.error}`);
        const req = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), 'utf-8');
        node_assert_1.default.ok(req.includes('- [ ] **AMT-01**'), 'AMT-01 should remain unchanged');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// comparePhaseNum and normalizePhaseName (imported directly)
// ─────────────────────────────────────────────────────────────────────────────
const { comparePhaseNum, normalizePhaseName } = require('../core/bin/lib/core.cjs');
(0, node_test_1.describe)('comparePhaseNum', () => {
    (0, node_test_1.test)('sorts integer phases numerically', () => {
        node_assert_1.default.ok(comparePhaseNum('2', '10') < 0);
        node_assert_1.default.ok(comparePhaseNum('10', '2') > 0);
        node_assert_1.default.strictEqual(comparePhaseNum('5', '5'), 0);
    });
    (0, node_test_1.test)('sorts decimal phases correctly', () => {
        node_assert_1.default.ok(comparePhaseNum('12', '12.1') < 0);
        node_assert_1.default.ok(comparePhaseNum('12.1', '12.2') < 0);
        node_assert_1.default.ok(comparePhaseNum('12.2', '13') < 0);
    });
    (0, node_test_1.test)('sorts letter-suffix phases correctly', () => {
        node_assert_1.default.ok(comparePhaseNum('12', '12A') < 0);
        node_assert_1.default.ok(comparePhaseNum('12A', '12B') < 0);
        node_assert_1.default.ok(comparePhaseNum('12B', '13') < 0);
    });
    (0, node_test_1.test)('sorts hybrid phases correctly', () => {
        node_assert_1.default.ok(comparePhaseNum('12A', '12A.1') < 0);
        node_assert_1.default.ok(comparePhaseNum('12A.1', '12A.2') < 0);
        node_assert_1.default.ok(comparePhaseNum('12A.2', '12B') < 0);
    });
    (0, node_test_1.test)('handles full sort order', () => {
        const phases = ['13', '12B', '12A.2', '12', '12.1', '12A', '12A.1', '12.2'];
        phases.sort(comparePhaseNum);
        node_assert_1.default.deepStrictEqual(phases, ['12', '12.1', '12.2', '12A', '12A.1', '12A.2', '12B', '13']);
    });
    (0, node_test_1.test)('handles directory names with slugs', () => {
        const dirs = ['13-deploy', '12B-hotfix', '12A.1-bugfix', '12-foundation', '12.1-inserted', '12A-split'];
        dirs.sort(comparePhaseNum);
        node_assert_1.default.deepStrictEqual(dirs, [
            '12-foundation', '12.1-inserted', '12A-split', '12A.1-bugfix', '12B-hotfix', '13-deploy'
        ]);
    });
    (0, node_test_1.test)('case insensitive letter matching', () => {
        node_assert_1.default.ok(comparePhaseNum('12a', '12B') < 0);
        node_assert_1.default.ok(comparePhaseNum('12A', '12b') < 0);
        node_assert_1.default.strictEqual(comparePhaseNum('12a', '12A'), 0);
    });
    (0, node_test_1.test)('sorts multi-level decimal phases correctly', () => {
        node_assert_1.default.ok(comparePhaseNum('3.2', '3.2.1') < 0);
        node_assert_1.default.ok(comparePhaseNum('3.2.1', '3.2.2') < 0);
        node_assert_1.default.ok(comparePhaseNum('3.2.1', '3.3') < 0);
        node_assert_1.default.ok(comparePhaseNum('3.2.1', '4') < 0);
        node_assert_1.default.strictEqual(comparePhaseNum('3.2.1', '3.2.1'), 0);
    });
    (0, node_test_1.test)('falls back to localeCompare for non-phase strings', () => {
        const result = comparePhaseNum('abc', 'def');
        node_assert_1.default.strictEqual(typeof result, 'number');
    });
});
(0, node_test_1.describe)('normalizePhaseName', () => {
    (0, node_test_1.test)('pads single-digit integers', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('3'), '03');
        node_assert_1.default.strictEqual(normalizePhaseName('12'), '12');
    });
    (0, node_test_1.test)('handles decimal phases', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('3.1'), '03.1');
        node_assert_1.default.strictEqual(normalizePhaseName('12.2'), '12.2');
    });
    (0, node_test_1.test)('handles letter-suffix phases', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('3A'), '03A');
        node_assert_1.default.strictEqual(normalizePhaseName('12B'), '12B');
    });
    (0, node_test_1.test)('handles hybrid phases', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('3A.1'), '03A.1');
        node_assert_1.default.strictEqual(normalizePhaseName('12A.2'), '12A.2');
    });
    (0, node_test_1.test)('uppercases letters', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('3a'), '03A');
        node_assert_1.default.strictEqual(normalizePhaseName('12b.1'), '12B.1');
    });
    (0, node_test_1.test)('handles multi-level decimal phases', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('3.2.1'), '03.2.1');
        node_assert_1.default.strictEqual(normalizePhaseName('12.3.4'), '12.3.4');
    });
    (0, node_test_1.test)('returns non-matching input unchanged', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('abc'), 'abc');
    });
});
(0, node_test_1.describe)('letter-suffix phase sorting', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('lists letter-suffix phases in correct order', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '12-foundation'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '12.1-inserted'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '12A-split'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '12A.1-bugfix'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '12B-hotfix'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '13-deploy'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phases list', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.deepStrictEqual(output.directories, ['12-foundation', '12.1-inserted', '12A-split', '12A.1-bugfix', '12B-hotfix', '13-deploy'], 'letter-suffix phases should sort correctly');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// milestone-scoped next-phase in phase complete
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('phase complete milestone-scoped next-phase', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('finds next phase within milestone, ignoring prior milestone dirs', () => {
        // ROADMAP lists phases 5-6 (current milestone v2.0)
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), [
            '## Roadmap v2.0: Release',
            '',
            '- [ ] Phase 5: Auth',
            '- [ ] Phase 6: Dashboard',
            '',
            '### Phase 5: Auth',
            '**Goal:** Add authentication',
            '**Plans:** 1 plans',
            '',
            '### Phase 6: Dashboard',
            '**Goal:** Build dashboard',
        ].join('\n'));
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# State\n\n**Current Phase:** 05\n**Current Phase Name:** Auth\n**Status:** In progress\n**Current Plan:** 05-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n');
        // Disk has dirs 01-06 (01-04 completed from prior milestone)
        for (let i = 1; i <= 4; i++) {
            const padded = String(i).padStart(2, '0');
            const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', `${padded}-old-phase`);
            fs_1.default.mkdirSync(phaseDir, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.join(phaseDir, `${padded}-01-PLAN.md`), '# Plan');
            fs_1.default.writeFileSync(path_1.default.join(phaseDir, `${padded}-01-SUMMARY.md`), '# Summary');
        }
        // Phase 5 — completing this one
        const p5 = path_1.default.join(tmpDir, '.planning', 'phases', '05-auth');
        fs_1.default.mkdirSync(p5, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p5, '05-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p5, '05-01-SUMMARY.md'), '# Summary');
        // Phase 6 — next phase in milestone
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '06-dashboard'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 5', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.is_last_phase, false, 'should NOT be last phase — phase 6 is in milestone');
        node_assert_1.default.strictEqual(output.next_phase, '06', 'next phase should be 06');
    });
    (0, node_test_1.test)('detects last phase when only milestone phases are considered', () => {
        // ROADMAP lists only phase 5 (current milestone)
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), [
            '## Roadmap v2.0: Release',
            '',
            '### Phase 5: Auth',
            '**Goal:** Add authentication',
            '**Plans:** 1 plans',
        ].join('\n'));
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# State\n\n**Current Phase:** 05\n**Current Phase Name:** Auth\n**Status:** In progress\n**Current Plan:** 05-01\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n');
        // Disk has dirs 01-06 but only 5 is in ROADMAP
        for (let i = 1; i <= 6; i++) {
            const padded = String(i).padStart(2, '0');
            const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', `${padded}-phase-${i}`);
            fs_1.default.mkdirSync(phaseDir, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.join(phaseDir, `${padded}-01-PLAN.md`), '# Plan');
            fs_1.default.writeFileSync(path_1.default.join(phaseDir, `${padded}-01-SUMMARY.md`), '# Summary');
        }
        const result = (0, helpers_cjs_1.runGsdTools)('phase complete 5', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        // Without the fix, dirs 06 on disk would make is_last_phase=false
        // With the fix, only phase 5 is in milestone, so it IS the last phase
        node_assert_1.default.strictEqual(output.is_last_phase, true, 'should be last phase — only phase 5 is in milestone');
        node_assert_1.default.strictEqual(output.next_phase, null, 'no next phase in milestone');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// milestone complete command
// ─────────────────────────────────────────────────────────────────────────────
//# sourceMappingURL=phase.test.cjs.map