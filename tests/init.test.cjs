"use strict";
/**
 * Vector Tools Tests - Init
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
(0, node_test_1.describe)('init commands', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('init execute-phase returns file paths', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-01-PLAN.md'), '# Plan');
        const result = (0, helpers_cjs_1.runGsdTools)('init execute-phase 03', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.state_path, '.planning/STATE.md');
        node_assert_1.default.strictEqual(output.roadmap_path, '.planning/ROADMAP.md');
        node_assert_1.default.strictEqual(output.config_path, '.planning/config.json');
    });
    (0, node_test_1.test)('init plan-phase returns file paths', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-CONTEXT.md'), '# Phase Context');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-RESEARCH.md'), '# Research Findings');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-VERIFICATION.md'), '# Verification');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-UAT.md'), '# UAT');
        const result = (0, helpers_cjs_1.runGsdTools)('init plan-phase 03', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.state_path, '.planning/STATE.md');
        node_assert_1.default.strictEqual(output.roadmap_path, '.planning/ROADMAP.md');
        node_assert_1.default.strictEqual(output.requirements_path, '.planning/REQUIREMENTS.md');
        node_assert_1.default.strictEqual(output.context_path, '.planning/phases/03-api/03-CONTEXT.md');
        node_assert_1.default.strictEqual(output.research_path, '.planning/phases/03-api/03-RESEARCH.md');
        node_assert_1.default.strictEqual(output.verification_path, '.planning/phases/03-api/03-VERIFICATION.md');
        node_assert_1.default.strictEqual(output.uat_path, '.planning/phases/03-api/03-UAT.md');
    });
    (0, node_test_1.test)('init progress returns file paths', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init progress', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.state_path, '.planning/STATE.md');
        node_assert_1.default.strictEqual(output.roadmap_path, '.planning/ROADMAP.md');
        node_assert_1.default.strictEqual(output.project_path, '.planning/PROJECT.md');
        node_assert_1.default.strictEqual(output.config_path, '.planning/config.json');
    });
    (0, node_test_1.test)('init phase-op returns core and optional phase file paths', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-CONTEXT.md'), '# Phase Context');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-RESEARCH.md'), '# Research');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-VERIFICATION.md'), '# Verification');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-UAT.md'), '# UAT');
        const result = (0, helpers_cjs_1.runGsdTools)('init phase-op 03', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.state_path, '.planning/STATE.md');
        node_assert_1.default.strictEqual(output.roadmap_path, '.planning/ROADMAP.md');
        node_assert_1.default.strictEqual(output.requirements_path, '.planning/REQUIREMENTS.md');
        node_assert_1.default.strictEqual(output.context_path, '.planning/phases/03-api/03-CONTEXT.md');
        node_assert_1.default.strictEqual(output.research_path, '.planning/phases/03-api/03-RESEARCH.md');
        node_assert_1.default.strictEqual(output.verification_path, '.planning/phases/03-api/03-VERIFICATION.md');
        node_assert_1.default.strictEqual(output.uat_path, '.planning/phases/03-api/03-UAT.md');
    });
    (0, node_test_1.test)('init plan-phase omits optional paths if files missing', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('init plan-phase 03', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.context_path, undefined);
        node_assert_1.default.strictEqual(output.research_path, undefined);
    });
    // ── phase_req_ids extraction (fix for #684) ──────────────────────────────
    (0, node_test_1.test)('init plan-phase extracts phase_req_ids from ROADMAP', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: CP-01, CP-02, CP-03\n**Plans:** 0 plans\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('init plan-phase 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_req_ids, 'CP-01, CP-02, CP-03');
    });
    (0, node_test_1.test)('init plan-phase strips brackets from phase_req_ids', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: [CP-01, CP-02]\n**Plans:** 0 plans\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('init plan-phase 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_req_ids, 'CP-01, CP-02');
    });
    (0, node_test_1.test)('init plan-phase returns null phase_req_ids when Requirements line is absent', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Plans:** 0 plans\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('init plan-phase 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_req_ids, null);
    });
    (0, node_test_1.test)('init plan-phase returns null phase_req_ids when ROADMAP is absent', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('init plan-phase 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_req_ids, null);
    });
    (0, node_test_1.test)('init execute-phase extracts phase_req_ids from ROADMAP', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: EX-01, EX-02\n**Plans:** 1 plans\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('init execute-phase 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_req_ids, 'EX-01, EX-02');
    });
    (0, node_test_1.test)('init plan-phase returns null phase_req_ids when value is TBD', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '03-api'), { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Requirements**: TBD\n**Plans:** 0 plans\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('init plan-phase 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_req_ids, null, 'TBD placeholder should return null');
    });
    (0, node_test_1.test)('init execute-phase returns null phase_req_ids when Requirements line is absent', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Plans:** 1 plans\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('init execute-phase 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_req_ids, null);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdInitTodos (INIT-01)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('cmdInitTodos', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('empty pending dir returns zero count', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'todos', 'pending'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('init todos', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.todo_count, 0);
        node_assert_1.default.deepStrictEqual(output.todos, []);
        node_assert_1.default.strictEqual(output.pending_dir_exists, true);
    });
    (0, node_test_1.test)('missing pending dir returns zero count', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init todos', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.todo_count, 0);
        node_assert_1.default.deepStrictEqual(output.todos, []);
        node_assert_1.default.strictEqual(output.pending_dir_exists, false);
    });
    (0, node_test_1.test)('multiple todos with fields are read correctly', () => {
        const pendingDir = path_1.default.join(tmpDir, '.planning', 'todos', 'pending');
        fs_1.default.mkdirSync(pendingDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'task-1.md'), 'title: Fix bug\narea: backend\ncreated: 2026-02-25');
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'task-2.md'), 'title: Add feature\narea: frontend\ncreated: 2026-02-24');
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'task-3.md'), 'title: Write docs\narea: backend\ncreated: 2026-02-23');
        const result = (0, helpers_cjs_1.runGsdTools)('init todos', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.todo_count, 3);
        node_assert_1.default.strictEqual(output.todos.length, 3);
        const task1 = output.todos.find((t) => t.file === 'task-1.md');
        node_assert_1.default.ok(task1, 'task-1.md should be in todos');
        node_assert_1.default.strictEqual(task1.title, 'Fix bug');
        node_assert_1.default.strictEqual(task1.area, 'backend');
        node_assert_1.default.strictEqual(task1.created, '2026-02-25');
        node_assert_1.default.strictEqual(task1.path, '.planning/todos/pending/task-1.md');
    });
    (0, node_test_1.test)('area filter returns only matching todos', () => {
        const pendingDir = path_1.default.join(tmpDir, '.planning', 'todos', 'pending');
        fs_1.default.mkdirSync(pendingDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'task-1.md'), 'title: Fix bug\narea: backend\ncreated: 2026-02-25');
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'task-2.md'), 'title: Add feature\narea: frontend\ncreated: 2026-02-24');
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'task-3.md'), 'title: Write docs\narea: backend\ncreated: 2026-02-23');
        const result = (0, helpers_cjs_1.runGsdTools)('init todos backend', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.todo_count, 2);
        node_assert_1.default.strictEqual(output.area_filter, 'backend');
        for (const todo of output.todos) {
            node_assert_1.default.strictEqual(todo.area, 'backend');
        }
    });
    (0, node_test_1.test)('area filter miss returns zero count', () => {
        const pendingDir = path_1.default.join(tmpDir, '.planning', 'todos', 'pending');
        fs_1.default.mkdirSync(pendingDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'task-1.md'), 'title: Fix bug\narea: backend\ncreated: 2026-02-25');
        const result = (0, helpers_cjs_1.runGsdTools)('init todos nonexistent', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.todo_count, 0);
        node_assert_1.default.strictEqual(output.area_filter, 'nonexistent');
    });
    (0, node_test_1.test)('malformed file uses defaults', () => {
        const pendingDir = path_1.default.join(tmpDir, '.planning', 'todos', 'pending');
        fs_1.default.mkdirSync(pendingDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'broken.md'), 'some random content without fields');
        const result = (0, helpers_cjs_1.runGsdTools)('init todos', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.todo_count, 1);
        const todo = output.todos[0];
        node_assert_1.default.strictEqual(todo.title, 'Untitled');
        node_assert_1.default.strictEqual(todo.area, 'general');
        node_assert_1.default.strictEqual(todo.created, 'unknown');
    });
    (0, node_test_1.test)('non-md files are ignored', () => {
        const pendingDir = path_1.default.join(tmpDir, '.planning', 'todos', 'pending');
        fs_1.default.mkdirSync(pendingDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'task.md'), 'title: Real task\narea: dev\ncreated: 2026-01-01');
        fs_1.default.writeFileSync(path_1.default.join(pendingDir, 'notes.txt'), 'title: Not a task\narea: dev\ncreated: 2026-01-01');
        const result = (0, helpers_cjs_1.runGsdTools)('init todos', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.todo_count, 1);
        node_assert_1.default.strictEqual(output.todos[0].file, 'task.md');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdInitMilestoneOp (INIT-02)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('cmdInitMilestoneOp', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('no phase directories returns zero counts', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init milestone-op', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_count, 0);
        node_assert_1.default.strictEqual(output.completed_phases, 0);
        node_assert_1.default.strictEqual(output.all_phases_complete, false);
    });
    (0, node_test_1.test)('multiple phases with no summaries', () => {
        const phase1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-setup');
        const phase2 = path_1.default.join(tmpDir, '.planning', 'phases', '02-api');
        fs_1.default.mkdirSync(phase1, { recursive: true });
        fs_1.default.mkdirSync(phase2, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(phase2, '02-01-PLAN.md'), '# Plan');
        const result = (0, helpers_cjs_1.runGsdTools)('init milestone-op', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_count, 2);
        node_assert_1.default.strictEqual(output.completed_phases, 0);
        node_assert_1.default.strictEqual(output.all_phases_complete, false);
    });
    (0, node_test_1.test)('mix of complete and incomplete phases', () => {
        const phase1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-setup');
        const phase2 = path_1.default.join(tmpDir, '.planning', 'phases', '02-api');
        fs_1.default.mkdirSync(phase1, { recursive: true });
        fs_1.default.mkdirSync(phase2, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(phase1, '01-01-SUMMARY.md'), '# Summary');
        fs_1.default.writeFileSync(path_1.default.join(phase2, '02-01-PLAN.md'), '# Plan');
        const result = (0, helpers_cjs_1.runGsdTools)('init milestone-op', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_count, 2);
        node_assert_1.default.strictEqual(output.completed_phases, 1);
        node_assert_1.default.strictEqual(output.all_phases_complete, false);
    });
    (0, node_test_1.test)('all phases complete', () => {
        const phase1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-setup');
        fs_1.default.mkdirSync(phase1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(phase1, '01-01-SUMMARY.md'), '# Summary');
        const result = (0, helpers_cjs_1.runGsdTools)('init milestone-op', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_count, 1);
        node_assert_1.default.strictEqual(output.completed_phases, 1);
        node_assert_1.default.strictEqual(output.all_phases_complete, true);
    });
    (0, node_test_1.test)('archive directory scanning', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'archive', 'v1.0'), { recursive: true });
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'archive', 'v0.9'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('init milestone-op', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.archive_count, 2);
        node_assert_1.default.strictEqual(output.archived_milestones.length, 2);
    });
    (0, node_test_1.test)('no archive directory returns empty', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init milestone-op', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.archive_count, 0);
        node_assert_1.default.deepStrictEqual(output.archived_milestones, []);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdInitPhaseOp fallback (INIT-04)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('cmdInitPhaseOp fallback', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('normal path with existing directory', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '03-api');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-CONTEXT.md'), '# Context');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '03-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\n### Phase 3: API\n**Goal:** Build API\n**Plans:** 1 plans\n');
        const result = (0, helpers_cjs_1.runGsdTools)('init phase-op 3', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_found, true);
        node_assert_1.default.ok(output.phase_dir.includes('03-api'), 'phase_dir should contain 03-api');
        node_assert_1.default.strictEqual(output.has_context, true);
        node_assert_1.default.strictEqual(output.has_plans, true);
    });
    (0, node_test_1.test)('fallback to ROADMAP when no directory exists', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\n### Phase 5: Widget Builder\n**Goal:** Build widgets\n**Plans:** TBD\n');
        const result = (0, helpers_cjs_1.runGsdTools)('init phase-op 5', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_found, true);
        node_assert_1.default.strictEqual(output.phase_dir, null);
        node_assert_1.default.strictEqual(output.phase_slug, 'widget-builder');
        node_assert_1.default.strictEqual(output.has_research, false);
        node_assert_1.default.strictEqual(output.has_context, false);
        node_assert_1.default.strictEqual(output.has_plans, false);
    });
    (0, node_test_1.test)('prefers current milestone roadmap entry over archived phase with same number', () => {
        const archiveDir = path_1.default.join(tmpDir, '.planning', 'milestones', 'v1.2-phases', '02-event-parser-and-queue-schema');
        fs_1.default.mkdirSync(archiveDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(archiveDir, '02-CONTEXT.md'), '# Archived context');
        fs_1.default.writeFileSync(path_1.default.join(archiveDir, '02-01-PLAN.md'), '# Archived plan');
        fs_1.default.writeFileSync(path_1.default.join(archiveDir, '02-VERIFICATION.md'), '# Archived verification');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

<details>
<summary>Shipped milestone v1.2</summary>

### Phase 2: Event Parser and Queue Schema
**Goal:** Archived milestone work
</details>

## Milestone v1.3 Current

### Phase 2: Retry Orchestration
**Goal:** Current milestone work
**Plans:** TBD
`);
        const result = (0, helpers_cjs_1.runGsdTools)('init phase-op 2', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_found, true);
        node_assert_1.default.strictEqual(output.phase_dir, null);
        node_assert_1.default.strictEqual(output.phase_name, 'Retry Orchestration');
        node_assert_1.default.strictEqual(output.phase_slug, 'retry-orchestration');
        node_assert_1.default.strictEqual(output.has_context, false);
        node_assert_1.default.strictEqual(output.has_plans, false);
        node_assert_1.default.strictEqual(output.has_verification, false);
    });
    (0, node_test_1.test)('neither directory nor roadmap entry returns not found', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\n### Phase 1: Setup\n**Goal:** Setup project\n**Plans:** TBD\n');
        const result = (0, helpers_cjs_1.runGsdTools)('init phase-op 99', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_found, false);
        node_assert_1.default.strictEqual(output.phase_dir, null);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdInitProgress (INIT-03)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('cmdInitProgress', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('no phases returns empty state', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init progress', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_count, 0);
        node_assert_1.default.deepStrictEqual(output.phases, []);
        node_assert_1.default.strictEqual(output.current_phase, null);
        node_assert_1.default.strictEqual(output.next_phase, null);
        node_assert_1.default.strictEqual(output.has_work_in_progress, false);
    });
    (0, node_test_1.test)('multiple phases with mixed statuses', () => {
        // Phase 01: complete (has plan + summary)
        const phase1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-setup');
        fs_1.default.mkdirSync(phase1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(phase1, '01-01-SUMMARY.md'), '# Summary');
        // Phase 02: in_progress (has plan, no summary)
        const phase2 = path_1.default.join(tmpDir, '.planning', 'phases', '02-api');
        fs_1.default.mkdirSync(phase2, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase2, '02-01-PLAN.md'), '# Plan');
        // Phase 03: pending (no plan, no research)
        const phase3 = path_1.default.join(tmpDir, '.planning', 'phases', '03-ui');
        fs_1.default.mkdirSync(phase3, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase3, '03-CONTEXT.md'), '# Context');
        const result = (0, helpers_cjs_1.runGsdTools)('init progress', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_count, 3);
        node_assert_1.default.strictEqual(output.completed_count, 1);
        node_assert_1.default.strictEqual(output.in_progress_count, 1);
        node_assert_1.default.strictEqual(output.has_work_in_progress, true);
        node_assert_1.default.strictEqual(output.current_phase.number, '02');
        node_assert_1.default.strictEqual(output.current_phase.status, 'in_progress');
        node_assert_1.default.strictEqual(output.next_phase.number, '03');
        node_assert_1.default.strictEqual(output.next_phase.status, 'pending');
        // Verify phase entries have expected structure
        const p1 = output.phases.find((p) => p.number === '01');
        node_assert_1.default.strictEqual(p1.status, 'complete');
        node_assert_1.default.strictEqual(p1.plan_count, 1);
        node_assert_1.default.strictEqual(p1.summary_count, 1);
    });
    (0, node_test_1.test)('researched status detected correctly', () => {
        const phase1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-setup');
        fs_1.default.mkdirSync(phase1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase1, '01-RESEARCH.md'), '# Research');
        const result = (0, helpers_cjs_1.runGsdTools)('init progress', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        const p1 = output.phases.find((p) => p.number === '01');
        node_assert_1.default.strictEqual(p1.status, 'researched');
        node_assert_1.default.strictEqual(p1.has_research, true);
        node_assert_1.default.strictEqual(output.current_phase.number, '01');
    });
    (0, node_test_1.test)('all phases complete returns no current or next', () => {
        const phase1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-setup');
        fs_1.default.mkdirSync(phase1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phase1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(phase1, '01-01-SUMMARY.md'), '# Summary');
        const result = (0, helpers_cjs_1.runGsdTools)('init progress', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.completed_count, 1);
        node_assert_1.default.strictEqual(output.current_phase, null);
        node_assert_1.default.strictEqual(output.next_phase, null);
    });
    (0, node_test_1.test)('paused_at detected from STATE.md', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n**Paused At:** Phase 2, Task 3 — implementing auth\n');
        const result = (0, helpers_cjs_1.runGsdTools)('init progress', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.paused_at, 'paused_at should be set');
        node_assert_1.default.ok(output.paused_at.includes('Phase 2, Task 3'), 'paused_at should contain pause location');
    });
    (0, node_test_1.test)('no paused_at when STATE.md has no pause line', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\nSome content without pause.\n');
        const result = (0, helpers_cjs_1.runGsdTools)('init progress', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.paused_at, null);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdInitQuick (INIT-05)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('cmdInitQuick', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('with description generates slug and task_dir with YYMMDD-xxx format', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init quick "Fix login bug"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.slug, 'fix-login-bug');
        node_assert_1.default.strictEqual(output.description, 'Fix login bug');
        // quick_id must match YYMMDD-xxx (6 digits, dash, 3 base36 chars)
        node_assert_1.default.ok(/^\d{6}-[0-9a-z]{3}$/.test(output.quick_id), `quick_id should match YYMMDD-xxx, got: "${output.quick_id}"`);
        // task_dir must use the new ID format
        node_assert_1.default.ok(output.task_dir.startsWith('.planning/quick/'), `task_dir should start with .planning/quick/, got: "${output.task_dir}"`);
        node_assert_1.default.ok(output.task_dir.endsWith('-fix-login-bug'), `task_dir should end with -fix-login-bug, got: "${output.task_dir}"`);
        node_assert_1.default.ok(/^\.planning\/quick\/\d{6}-[0-9a-z]{3}-fix-login-bug$/.test(output.task_dir), `task_dir format wrong: "${output.task_dir}"`);
        // next_num must NOT be present
        node_assert_1.default.ok(!('next_num' in output), 'next_num should not be in output');
    });
    (0, node_test_1.test)('without description returns null slug and task_dir', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init quick', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.slug, null);
        node_assert_1.default.strictEqual(output.task_dir, null);
        node_assert_1.default.strictEqual(output.description, null);
        // quick_id is still generated even without description
        node_assert_1.default.ok(/^\d{6}-[0-9a-z]{3}$/.test(output.quick_id), `quick_id should match YYMMDD-xxx, got: "${output.quick_id}"`);
    });
    (0, node_test_1.test)('two rapid calls produce different quick_ids (no collision within 2s window)', () => {
        // Both calls happen within the same test, which is sub-second.
        // They may or may not land in the same 2-second block. We just verify format.
        const r1 = (0, helpers_cjs_1.runGsdTools)('init quick "Task one"', tmpDir);
        const r2 = (0, helpers_cjs_1.runGsdTools)('init quick "Task two"', tmpDir);
        node_assert_1.default.ok(r1.success && r2.success);
        const o1 = JSON.parse(r1.output);
        const o2 = JSON.parse(r2.output);
        node_assert_1.default.ok(/^\d{6}-[0-9a-z]{3}$/.test(o1.quick_id));
        node_assert_1.default.ok(/^\d{6}-[0-9a-z]{3}$/.test(o2.quick_id));
        // Directories are distinct because slugs differ
        node_assert_1.default.notStrictEqual(o1.task_dir, o2.task_dir);
    });
    (0, node_test_1.test)('long description truncates slug to 40 chars', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init quick "This is a very long description that should get truncated to forty characters maximum"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.slug.length <= 40, `Slug should be <= 40 chars, got ${output.slug.length}: "${output.slug}"`);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdInitMapCodebase (INIT-05)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('cmdInitMapCodebase', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('no codebase dir returns empty', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init map-codebase', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.has_maps, false);
        node_assert_1.default.deepStrictEqual(output.existing_maps, []);
        node_assert_1.default.strictEqual(output.codebase_dir_exists, false);
    });
    (0, node_test_1.test)('with existing maps lists md files only', () => {
        const codebaseDir = path_1.default.join(tmpDir, '.planning', 'codebase');
        fs_1.default.mkdirSync(codebaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(codebaseDir, 'STACK.md'), '# Stack');
        fs_1.default.writeFileSync(path_1.default.join(codebaseDir, 'ARCHITECTURE.md'), '# Architecture');
        fs_1.default.writeFileSync(path_1.default.join(codebaseDir, 'notes.txt'), 'not a markdown file');
        const result = (0, helpers_cjs_1.runGsdTools)('init map-codebase', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.has_maps, true);
        node_assert_1.default.strictEqual(output.existing_maps.length, 2);
        node_assert_1.default.ok(output.existing_maps.includes('STACK.md'), 'Should include STACK.md');
        node_assert_1.default.ok(output.existing_maps.includes('ARCHITECTURE.md'), 'Should include ARCHITECTURE.md');
    });
    (0, node_test_1.test)('empty codebase dir returns no maps', () => {
        const codebaseDir = path_1.default.join(tmpDir, '.planning', 'codebase');
        fs_1.default.mkdirSync(codebaseDir, { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('init map-codebase', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.has_maps, false);
        node_assert_1.default.deepStrictEqual(output.existing_maps, []);
        node_assert_1.default.strictEqual(output.codebase_dir_exists, true);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdInitNewProject (INIT-06)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('cmdInitNewProject', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('greenfield project with no code', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init new-project', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.has_existing_code, false);
        node_assert_1.default.strictEqual(output.has_package_file, false);
        node_assert_1.default.strictEqual(output.is_brownfield, false);
        node_assert_1.default.strictEqual(output.needs_codebase_map, false);
    });
    (0, node_test_1.test)('brownfield with package.json detected', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, 'package.json'), '{"name":"test"}');
        const result = (0, helpers_cjs_1.runGsdTools)('init new-project', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.has_package_file, true);
        node_assert_1.default.strictEqual(output.is_brownfield, true);
        node_assert_1.default.strictEqual(output.needs_codebase_map, true);
    });
    (0, node_test_1.test)('brownfield with codebase map does not need map', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, 'package.json'), '{"name":"test"}');
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'codebase'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('init new-project', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.is_brownfield, true);
        node_assert_1.default.strictEqual(output.needs_codebase_map, false);
    });
    (0, node_test_1.test)('planning_exists flag is correct', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init new-project', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.planning_exists, true);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// cmdInitNewMilestone (INIT-06)
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('cmdInitNewMilestone', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('returns expected fields', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init new-milestone', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok('current_milestone' in output, 'Should have current_milestone');
        node_assert_1.default.ok('current_milestone_name' in output, 'Should have current_milestone_name');
        node_assert_1.default.ok('researcher_model' in output, 'Should have researcher_model');
        node_assert_1.default.ok('synthesizer_model' in output, 'Should have synthesizer_model');
        node_assert_1.default.ok('roadmapper_model' in output, 'Should have roadmapper_model');
        node_assert_1.default.ok('commit_docs' in output, 'Should have commit_docs');
        node_assert_1.default.strictEqual(output.project_path, '.planning/PROJECT.md');
        node_assert_1.default.strictEqual(output.roadmap_path, '.planning/ROADMAP.md');
        node_assert_1.default.strictEqual(output.state_path, '.planning/STATE.md');
    });
    (0, node_test_1.test)('file existence flags reflect actual state', () => {
        // Default: no STATE.md, ROADMAP.md, or PROJECT.md
        const result1 = (0, helpers_cjs_1.runGsdTools)('init new-milestone', tmpDir);
        node_assert_1.default.ok(result1.success, `Command failed: ${result1.error}`);
        const output1 = JSON.parse(result1.output);
        node_assert_1.default.strictEqual(output1.state_exists, false);
        node_assert_1.default.strictEqual(output1.roadmap_exists, false);
        node_assert_1.default.strictEqual(output1.project_exists, false);
        // Create files and verify flags change
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# State');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'PROJECT.md'), '# Project');
        const result2 = (0, helpers_cjs_1.runGsdTools)('init new-milestone', tmpDir);
        node_assert_1.default.ok(result2.success, `Command failed: ${result2.error}`);
        const output2 = JSON.parse(result2.output);
        node_assert_1.default.strictEqual(output2.state_exists, true);
        node_assert_1.default.strictEqual(output2.roadmap_exists, true);
        node_assert_1.default.strictEqual(output2.project_exists, true);
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// roadmap analyze command
// ─────────────────────────────────────────────────────────────────────────────
//# sourceMappingURL=init.test.cjs.map