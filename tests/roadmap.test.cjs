"use strict";
/**
 * Vector Tools Tests - Roadmap
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
(0, node_test_1.describe)('roadmap get-phase command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('extracts phase section from ROADMAP.md', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0

## Phases

### Phase 1: Foundation
**Goal:** Set up project infrastructure
**Plans:** 2 plans

Some description here.

### Phase 2: API
**Goal:** Build REST API
**Plans:** 3 plans
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.found, true, 'phase should be found');
        node_assert_1.default.strictEqual(output.phase_number, '1', 'phase number correct');
        node_assert_1.default.strictEqual(output.phase_name, 'Foundation', 'phase name extracted');
        node_assert_1.default.strictEqual(output.goal, 'Set up project infrastructure', 'goal extracted');
    });
    (0, node_test_1.test)('returns not found for missing phase', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0

### Phase 1: Foundation
**Goal:** Set up project
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 5', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.found, false, 'phase should not be found');
    });
    (0, node_test_1.test)('handles decimal phase numbers', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 2: Main
**Goal:** Main work

### Phase 2.1: Hotfix
**Goal:** Emergency fix
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 2.1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.found, true, 'decimal phase should be found');
        node_assert_1.default.strictEqual(output.phase_name, 'Hotfix', 'phase name correct');
        node_assert_1.default.strictEqual(output.goal, 'Emergency fix', 'goal extracted');
    });
    (0, node_test_1.test)('extracts full section content', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Setup
**Goal:** Initialize everything

This phase covers:
- Database setup
- Auth configuration
- CI/CD pipeline

### Phase 2: Build
**Goal:** Build features
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.section.includes('Database setup'), 'section includes description');
        node_assert_1.default.ok(output.section.includes('CI/CD pipeline'), 'section includes all bullets');
        node_assert_1.default.ok(!output.section.includes('Phase 2'), 'section does not include next phase');
    });
    (0, node_test_1.test)('handles missing ROADMAP.md gracefully', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.found, false, 'should return not found');
        node_assert_1.default.strictEqual(output.error, 'ROADMAP.md not found', 'should explain why');
    });
    (0, node_test_1.test)('accepts ## phase headers (two hashes)', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0

## Phase 1: Foundation
**Goal:** Set up project infrastructure
**Plans:** 2 plans

## Phase 2: API
**Goal:** Build REST API
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.found, true, 'phase with ## header should be found');
        node_assert_1.default.strictEqual(output.phase_name, 'Foundation', 'phase name extracted');
        node_assert_1.default.strictEqual(output.goal, 'Set up project infrastructure', 'goal extracted');
    });
    (0, node_test_1.test)('extracts goal when colon is outside bold (**Goal**: format)', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.24

### Phase 5: Skill Scaffolding
**Goal**: The autonomous skill files exist following project conventions
**Plans:** 2 plans

### Phase 6: Smart Discuss
**Goal**: Grey area resolution works with proposals
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 5', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.found, true, 'phase should be found');
        node_assert_1.default.strictEqual(output.goal, 'The autonomous skill files exist following project conventions', 'goal extracted with colon outside bold');
    });
    (0, node_test_1.test)('extracts goal for both colon-inside and colon-outside bold formats', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Alpha
**Goal:** Colon inside bold format

### Phase 2: Beta
**Goal**: Colon outside bold format
`);
        const result1 = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 1', tmpDir);
        const output1 = JSON.parse(result1.output);
        node_assert_1.default.strictEqual(output1.goal, 'Colon inside bold format', 'colon-inside-bold goal extracted');
        const result2 = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 2', tmpDir);
        const output2 = JSON.parse(result2.output);
        node_assert_1.default.strictEqual(output2.goal, 'Colon outside bold format', 'colon-outside-bold goal extracted');
    });
    (0, node_test_1.test)('detects malformed ROADMAP with summary list but no detail sections', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0

## Phases

- [ ] **Phase 1: Foundation** - Set up project
- [ ] **Phase 2: API** - Build REST API
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.found, false, 'phase should not be found');
        node_assert_1.default.strictEqual(output.error, 'malformed_roadmap', 'should identify malformed roadmap');
        node_assert_1.default.ok(output.message.includes('missing'), 'should explain the issue');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// phase next-decimal command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('roadmap analyze command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('missing ROADMAP.md returns error', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap analyze', tmpDir);
        node_assert_1.default.ok(result.success, `Command should succeed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.error, 'ROADMAP.md not found');
    });
    (0, node_test_1.test)('parses phases with goals and disk status', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0

### Phase 1: Foundation
**Goal:** Set up infrastructure

### Phase 2: Authentication
**Goal:** Add user auth

### Phase 3: Features
**Goal:** Build core features
`);
        // Create phase dirs with varying completion
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary');
        const p2 = path_1.default.join(tmpDir, '.planning', 'phases', '02-authentication');
        fs_1.default.mkdirSync(p2, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p2, '02-01-PLAN.md'), '# Plan');
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap analyze', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phase_count, 3, 'should find 3 phases');
        node_assert_1.default.strictEqual(output.phases[0].disk_status, 'complete', 'phase 1 complete');
        node_assert_1.default.strictEqual(output.phases[1].disk_status, 'planned', 'phase 2 planned');
        node_assert_1.default.strictEqual(output.phases[2].disk_status, 'no_directory', 'phase 3 no directory');
        node_assert_1.default.strictEqual(output.completed_phases, 1, '1 phase complete');
        node_assert_1.default.strictEqual(output.total_plans, 2, '2 total plans');
        node_assert_1.default.strictEqual(output.total_summaries, 1, '1 total summary');
        node_assert_1.default.strictEqual(output.progress_percent, 50, '50% complete');
        node_assert_1.default.strictEqual(output.current_phase, '2', 'current phase is 2');
    });
    (0, node_test_1.test)('extracts goals and dependencies', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Setup
**Goal:** Initialize project
**Depends on:** Nothing

### Phase 2: Build
**Goal:** Build features
**Depends on:** Phase 1
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap analyze', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phases[0].goal, 'Initialize project');
        node_assert_1.default.strictEqual(output.phases[0].depends_on, 'Nothing');
        node_assert_1.default.strictEqual(output.phases[1].goal, 'Build features');
        node_assert_1.default.strictEqual(output.phases[1].depends_on, 'Phase 1');
    });
    (0, node_test_1.test)('extracts goals and depends_on with colon outside bold (**Goal**: format)', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.24

### Phase 5: Skill Scaffolding
**Goal**: The autonomous skill files exist following project conventions
**Depends on**: Phase 4 (v1.23 complete)

### Phase 6: Smart Discuss
**Goal**: Grey area resolution works with proposals
**Depends on**: Phase 5
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap analyze', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phases[0].goal, 'The autonomous skill files exist following project conventions', 'goal extracted with colon outside bold');
        node_assert_1.default.strictEqual(output.phases[0].depends_on, 'Phase 4 (v1.23 complete)', 'depends_on extracted with colon outside bold');
        node_assert_1.default.strictEqual(output.phases[1].goal, 'Grey area resolution works with proposals', 'second phase goal extracted');
        node_assert_1.default.strictEqual(output.phases[1].depends_on, 'Phase 5', 'second phase depends_on extracted');
    });
    (0, node_test_1.test)('handles mixed colon-inside and colon-outside bold formats in analyze', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Alpha
**Goal:** Colon inside bold
**Depends on:** Nothing

### Phase 2: Beta
**Goal**: Colon outside bold
**Depends on**: Phase 1
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap analyze', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phases[0].goal, 'Colon inside bold', 'colon-inside goal works');
        node_assert_1.default.strictEqual(output.phases[0].depends_on, 'Nothing', 'colon-inside depends_on works');
        node_assert_1.default.strictEqual(output.phases[1].goal, 'Colon outside bold', 'colon-outside goal works');
        node_assert_1.default.strictEqual(output.phases[1].depends_on, 'Phase 1', 'colon-outside depends_on works');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// roadmap analyze disk status variants
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('roadmap analyze disk status variants', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('returns researched status for phase dir with only RESEARCH.md', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Exploration
**Goal:** Research the domain
`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-exploration');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-RESEARCH.md'), '# Research notes');
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap analyze', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phases[0].disk_status, 'researched', 'disk_status should be researched');
        node_assert_1.default.strictEqual(output.phases[0].has_research, true, 'has_research should be true');
    });
    (0, node_test_1.test)('returns discussed status for phase dir with only CONTEXT.md', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Discussion
**Goal:** Gather context
`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-discussion');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-CONTEXT.md'), '# Context notes');
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap analyze', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phases[0].disk_status, 'discussed', 'disk_status should be discussed');
        node_assert_1.default.strictEqual(output.phases[0].has_context, true, 'has_context should be true');
    });
    (0, node_test_1.test)('returns empty status for phase dir with no recognized files', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Empty
**Goal:** Nothing yet
`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-empty');
        fs_1.default.mkdirSync(p1, { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap analyze', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phases[0].disk_status, 'empty', 'disk_status should be empty');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// roadmap analyze milestone extraction
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('roadmap analyze milestone extraction', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('extracts milestone headings and version numbers', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

## v1.0 Test Infrastructure

### Phase 1: Foundation
**Goal:** Set up base

## v1.1 Coverage Hardening

### Phase 2: Coverage
**Goal:** Add coverage
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap analyze', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(Array.isArray(output.milestones), 'milestones should be an array');
        node_assert_1.default.strictEqual(output.milestones.length, 2, 'should find 2 milestones');
        node_assert_1.default.strictEqual(output.milestones[0].version, 'v1.0', 'first milestone version');
        node_assert_1.default.ok(output.milestones[0].heading.includes('v1.0'), 'first milestone heading contains v1.0');
        node_assert_1.default.strictEqual(output.milestones[1].version, 'v1.1', 'second milestone version');
        node_assert_1.default.ok(output.milestones[1].heading.includes('v1.1'), 'second milestone heading contains v1.1');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// roadmap analyze missing phase details
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('roadmap analyze missing phase details', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('detects checklist-only phases missing detail sections', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [ ] **Phase 1: Foundation** - Set up project
- [ ] **Phase 2: API** - Build REST API

### Phase 2: API
**Goal:** Build REST API
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap analyze', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(Array.isArray(output.missing_phase_details), 'missing_phase_details should be an array');
        node_assert_1.default.ok(output.missing_phase_details.includes('1'), 'phase 1 should be in missing details');
        node_assert_1.default.ok(!output.missing_phase_details.includes('2'), 'phase 2 should not be in missing details');
    });
    (0, node_test_1.test)('returns null when all checklist phases have detail sections', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [ ] **Phase 1: Foundation** - Set up project
- [ ] **Phase 2: API** - Build REST API

### Phase 1: Foundation
**Goal:** Set up project

### Phase 2: API
**Goal:** Build REST API
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap analyze', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.missing_phase_details, null, 'missing_phase_details should be null');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// roadmap get-phase success criteria
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('roadmap get-phase success criteria', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('extracts success_criteria array from phase section', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Test
**Goal:** Test goal
**Success Criteria** (what must be TRUE):
  1. First criterion
  2. Second criterion
  3. Third criterion

### Phase 2: Other
**Goal:** Other goal
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.found, true, 'phase should be found');
        node_assert_1.default.ok(Array.isArray(output.success_criteria), 'success_criteria should be an array');
        node_assert_1.default.strictEqual(output.success_criteria.length, 3, 'should have 3 criteria');
        node_assert_1.default.ok(output.success_criteria[0].includes('First criterion'), 'first criterion matches');
        node_assert_1.default.ok(output.success_criteria[1].includes('Second criterion'), 'second criterion matches');
        node_assert_1.default.ok(output.success_criteria[2].includes('Third criterion'), 'third criterion matches');
    });
    (0, node_test_1.test)('returns empty array when no success criteria present', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Simple
**Goal:** No criteria here
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap get-phase 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.found, true, 'phase should be found');
        node_assert_1.default.ok(Array.isArray(output.success_criteria), 'success_criteria should be an array');
        node_assert_1.default.strictEqual(output.success_criteria.length, 0, 'should have empty criteria');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// roadmap update-plan-progress command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('roadmap update-plan-progress command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('missing phase number returns error', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap update-plan-progress', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'should fail without phase number');
        node_assert_1.default.ok(result.error.includes('phase number required'), 'error should mention phase number required');
    });
    (0, node_test_1.test)('nonexistent phase returns error', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Test
**Goal:** Test goal
`);
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap update-plan-progress 99', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'should fail for nonexistent phase');
        node_assert_1.default.ok(result.error.includes('not found'), 'error should mention not found');
    });
    (0, node_test_1.test)('no plans found returns updated false', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Test
**Goal:** Test goal
`);
        // Create phase dir with only a context file (no plans)
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-CONTEXT.md'), '# Context');
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap update-plan-progress 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, false, 'should not update');
        node_assert_1.default.ok(output.reason.includes('No plans'), 'reason should mention no plans');
        node_assert_1.default.strictEqual(output.plan_count, 0, 'plan_count should be 0');
    });
    (0, node_test_1.test)('updates progress for partial completion', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

### Phase 1: Test
**Goal:** Test goal
**Plans:** TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Test | v1.0 | 0/2 | Planned | - |
`);
        // Create phase dir with 2 plans, 1 summary
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan 1');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-02-PLAN.md'), '# Plan 2');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary 1');
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap update-plan-progress 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, true, 'should update');
        node_assert_1.default.strictEqual(output.plan_count, 2, 'plan_count should be 2');
        node_assert_1.default.strictEqual(output.summary_count, 1, 'summary_count should be 1');
        node_assert_1.default.strictEqual(output.status, 'In Progress', 'status should be In Progress');
        node_assert_1.default.strictEqual(output.complete, false, 'should not be complete');
        // Verify file was actually modified
        const roadmapContent = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
        node_assert_1.default.ok(roadmapContent.includes('1/2'), 'roadmap should contain updated plan count');
    });
    (0, node_test_1.test)('updates progress and checks checkbox on completion', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap

- [ ] **Phase 1: Test** - description

### Phase 1: Test
**Goal:** Test goal
**Plans:** TBD

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Test | v1.0 | 0/1 | Planned | - |
`);
        // Create phase dir with 1 plan, 1 summary (complete)
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan 1');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary 1');
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap update-plan-progress 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, true, 'should update');
        node_assert_1.default.strictEqual(output.complete, true, 'should be complete');
        node_assert_1.default.strictEqual(output.status, 'Complete', 'status should be Complete');
        // Verify file was actually modified
        const roadmapContent = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), 'utf-8');
        node_assert_1.default.ok(roadmapContent.includes('[x]'), 'checkbox should be checked');
        node_assert_1.default.ok(roadmapContent.includes('completed'), 'should contain completion date text');
        node_assert_1.default.ok(roadmapContent.includes('1/1'), 'roadmap should contain updated plan count');
    });
    (0, node_test_1.test)('missing ROADMAP.md returns updated false', () => {
        // Create phase dir with plans and summaries but NO ROADMAP.md
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan 1');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '# Summary 1');
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap update-plan-progress 1', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, false, 'should not update');
        node_assert_1.default.ok(output.reason.includes('ROADMAP.md not found'), 'reason should mention missing ROADMAP.md');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// phase add command
// ─────────────────────────────────────────────────────────────────────────────
//# sourceMappingURL=roadmap.test.cjs.map