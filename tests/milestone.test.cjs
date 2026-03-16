"use strict";
/**
 * Vector Tools Tests - Milestone
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
(0, node_test_1.describe)('milestone complete command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('archives roadmap, requirements, creates MILESTONES.md', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0 MVP\n\n### Phase 1: Foundation\n**Goal:** Setup\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), `# Requirements\n\n- [ ] User auth\n- [ ] Dashboard\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), `---\none-liner: Set up project infrastructure\n---\n# Summary\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.0 --name MVP Foundation', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.version, 'v1.0');
        node_assert_1.default.strictEqual(output.phases, 1);
        node_assert_1.default.ok(output.archived.roadmap, 'roadmap should be archived');
        node_assert_1.default.ok(output.archived.requirements, 'requirements should be archived');
        // Verify archive files exist
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'milestones', 'v1.0-ROADMAP.md')), 'archived roadmap should exist');
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'milestones', 'v1.0-REQUIREMENTS.md')), 'archived requirements should exist');
        // Verify MILESTONES.md created
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'MILESTONES.md')), 'MILESTONES.md should be created');
        const milestones = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'MILESTONES.md'), 'utf-8');
        node_assert_1.default.ok(milestones.includes('v1.0 MVP Foundation'), 'milestone entry should contain name');
        node_assert_1.default.ok(milestones.includes('Set up project infrastructure'), 'accomplishments should be listed');
    });
    (0, node_test_1.test)('prepends to existing MILESTONES.md (reverse chronological)', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'MILESTONES.md'), `# Milestones\n\n## v0.9 Alpha (Shipped: 2025-01-01)\n\n---\n\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.0 --name Beta', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const milestones = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'MILESTONES.md'), 'utf-8');
        node_assert_1.default.ok(milestones.includes('v0.9 Alpha'), 'existing entry should be preserved');
        node_assert_1.default.ok(milestones.includes('v1.0 Beta'), 'new entry should be present');
        // New entry should appear BEFORE old entry (reverse chronological)
        const newIdx = milestones.indexOf('v1.0 Beta');
        const oldIdx = milestones.indexOf('v0.9 Alpha');
        node_assert_1.default.ok(newIdx < oldIdx, 'new entry should appear before old entry (reverse chronological)');
    });
    (0, node_test_1.test)('three sequential completions maintain reverse-chronological order', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'MILESTONES.md'), `# Milestones\n\n## v1.0 First (Shipped: 2025-01-01)\n\n---\n\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.1\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        let result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.1 --name Second', tmpDir);
        node_assert_1.default.ok(result.success, `v1.1 failed: ${result.error}`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.2\n`);
        result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.2 --name Third', tmpDir);
        node_assert_1.default.ok(result.success, `v1.2 failed: ${result.error}`);
        const milestones = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'MILESTONES.md'), 'utf-8');
        const idx10 = milestones.indexOf('v1.0 First');
        const idx11 = milestones.indexOf('v1.1 Second');
        const idx12 = milestones.indexOf('v1.2 Third');
        node_assert_1.default.ok(idx10 !== -1, 'v1.0 should be present');
        node_assert_1.default.ok(idx11 !== -1, 'v1.1 should be present');
        node_assert_1.default.ok(idx12 !== -1, 'v1.2 should be present');
        node_assert_1.default.ok(idx12 < idx11, 'v1.2 should appear before v1.1');
        node_assert_1.default.ok(idx11 < idx10, 'v1.1 should appear before v1.0');
    });
    (0, node_test_1.test)('archives phase directories with --archive-phases flag', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), `---\none-liner: Set up project infrastructure\n---\n# Summary\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.0 --name MVP --archive-phases', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.archived.phases, true, 'phases should be archived');
        // Phase directory moved to milestones/v1.0-phases/
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'milestones', 'v1.0-phases', '01-foundation')), 'archived phase directory should exist in milestones/v1.0-phases/');
        // Original phase directory no longer exists
        node_assert_1.default.ok(!fs_1.default.existsSync(p1), 'original phase directory should no longer exist');
    });
    (0, node_test_1.test)('archived REQUIREMENTS.md contains archive header', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), `# Requirements\n\n- [ ] **TEST-01**: core.cjs has tests\n- [ ] **TEST-02**: more tests\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.0 --name MVP', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const archivedReq = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'milestones', 'v1.0-REQUIREMENTS.md'), 'utf-8');
        node_assert_1.default.ok(archivedReq.includes('Requirements Archive: v1.0'), 'should contain archive version');
        node_assert_1.default.ok(archivedReq.includes('SHIPPED'), 'should contain SHIPPED status');
        node_assert_1.default.ok(archivedReq.includes('Archived:'), 'should contain Archived: date line');
        // Original content preserved after header
        node_assert_1.default.ok(archivedReq.includes('# Requirements'), 'original content should be preserved');
        node_assert_1.default.ok(archivedReq.includes('**TEST-01**'), 'original requirement items should be preserved');
    });
    (0, node_test_1.test)('STATE.md gets updated during milestone complete', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.0 --name Test', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.state_updated, true, 'state_updated should be true');
        const state = fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), 'utf-8');
        node_assert_1.default.ok(state.includes('v1.0 milestone complete'), 'status should be updated to milestone complete');
        node_assert_1.default.ok(state.includes('v1.0 milestone completed and archived'), 'last activity description should reference milestone completion');
    });
    (0, node_test_1.test)('handles missing ROADMAP.md gracefully', () => {
        // Only STATE.md — no ROADMAP.md, no REQUIREMENTS.md
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.0 --name NoRoadmap', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.archived.roadmap, false, 'roadmap should not be archived');
        node_assert_1.default.strictEqual(output.archived.requirements, false, 'requirements should not be archived');
        node_assert_1.default.strictEqual(output.milestones_updated, true, 'MILESTONES.md should still be created');
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'MILESTONES.md')), 'MILESTONES.md should be created even without ROADMAP.md');
    });
    (0, node_test_1.test)('scopes stats to current milestone phases only', () => {
        // Set up ROADMAP.md that only references Phase 3 and Phase 4
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.1\n\n### Phase 3: New Feature\n**Goal:** Build it\n\n### Phase 4: Polish\n**Goal:** Ship it\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        // Create phases from PREVIOUS milestone (should be excluded)
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-old-setup');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan\n');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '---\none-liner: Old setup work\n---\n# Summary\n');
        const p2 = path_1.default.join(tmpDir, '.planning', 'phases', '02-old-core');
        fs_1.default.mkdirSync(p2, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p2, '02-01-PLAN.md'), '# Plan\n');
        fs_1.default.writeFileSync(path_1.default.join(p2, '02-01-SUMMARY.md'), '---\none-liner: Old core work\n---\n# Summary\n');
        // Create phases for CURRENT milestone (should be included)
        const p3 = path_1.default.join(tmpDir, '.planning', 'phases', '03-new-feature');
        fs_1.default.mkdirSync(p3, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p3, '03-01-PLAN.md'), '# Plan\n');
        fs_1.default.writeFileSync(path_1.default.join(p3, '03-01-SUMMARY.md'), '---\none-liner: Built new feature\n---\n# Summary\n');
        const p4 = path_1.default.join(tmpDir, '.planning', 'phases', '04-polish');
        fs_1.default.mkdirSync(p4, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p4, '04-01-PLAN.md'), '# Plan\n');
        fs_1.default.writeFileSync(path_1.default.join(p4, '04-02-PLAN.md'), '# Plan 2\n');
        fs_1.default.writeFileSync(path_1.default.join(p4, '04-01-SUMMARY.md'), '---\none-liner: Polished UI\n---\n# Summary\n');
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.1 --name "Second Release"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        // Should only count phases 3 and 4, not 1 and 2
        node_assert_1.default.strictEqual(output.phases, 2, 'should count only milestone phases (3, 4)');
        node_assert_1.default.strictEqual(output.plans, 3, 'should count only plans from phases 3 and 4');
        // Accomplishments should only be from phases 3 and 4
        node_assert_1.default.ok(output.accomplishments.includes('Built new feature'), 'should include current milestone accomplishment');
        node_assert_1.default.ok(output.accomplishments.includes('Polished UI'), 'should include current milestone accomplishment');
        node_assert_1.default.ok(!output.accomplishments.includes('Old setup work'), 'should NOT include previous milestone accomplishment');
        node_assert_1.default.ok(!output.accomplishments.includes('Old core work'), 'should NOT include previous milestone accomplishment');
    });
    (0, node_test_1.test)('archive-phases only archives current milestone phases', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.1\n\n### Phase 2: Current Work\n**Goal:** Do it\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        // Phase from previous milestone
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-old');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan\n');
        // Phase from current milestone
        const p2 = path_1.default.join(tmpDir, '.planning', 'phases', '02-current');
        fs_1.default.mkdirSync(p2, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p2, '02-01-PLAN.md'), '# Plan\n');
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.1 --name Test --archive-phases', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        // Phase 2 should be archived
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'milestones', 'v1.1-phases', '02-current')), 'current milestone phase should be archived');
        // Phase 1 should still be in place (not archived)
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-old')), 'previous milestone phase should NOT be archived');
    });
    (0, node_test_1.test)('phase 1 in roadmap does NOT match directory 10-something (no prefix collision)', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0\n\n### Phase 1: Foundation\n**Goal:** Setup\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan\n');
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-SUMMARY.md'), '---\none-liner: Foundation work\n---\n');
        const p10 = path_1.default.join(tmpDir, '.planning', 'phases', '10-scaling');
        fs_1.default.mkdirSync(p10, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p10, '10-01-PLAN.md'), '# Plan\n');
        fs_1.default.writeFileSync(path_1.default.join(p10, '10-01-SUMMARY.md'), '---\none-liner: Scaling work\n---\n');
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.0 --name MVP', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phases, 1, 'should count only phase 1, not phase 10');
        node_assert_1.default.strictEqual(output.plans, 1, 'should count only plans from phase 1');
        node_assert_1.default.ok(output.accomplishments.includes('Foundation work'), 'should include phase 1 accomplishment');
        node_assert_1.default.ok(!output.accomplishments.includes('Scaling work'), 'should NOT include phase 10 accomplishment');
    });
    (0, node_test_1.test)('non-numeric directory is excluded when milestone scoping is active', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0\n\n### Phase 1: Core\n**Goal:** Build core\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p1 = path_1.default.join(tmpDir, '.planning', 'phases', '01-core');
        fs_1.default.mkdirSync(p1, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p1, '01-01-PLAN.md'), '# Plan\n');
        // Non-phase directory — should be excluded
        const misc = path_1.default.join(tmpDir, '.planning', 'phases', 'notes');
        fs_1.default.mkdirSync(misc, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(misc, 'PLAN.md'), '# Not a phase\n');
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.0 --name Test', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phases, 1, 'non-numeric dir should not be counted as a phase');
        node_assert_1.default.strictEqual(output.plans, 1, 'plans from non-numeric dir should not be counted');
    });
    (0, node_test_1.test)('large phase numbers (456, 457) scope correctly', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.49\n\n### Phase 456: DACP\n**Goal:** Ship DACP\n\n### Phase 457: Integration\n**Goal:** Integrate\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        const p456 = path_1.default.join(tmpDir, '.planning', 'phases', '456-dacp');
        fs_1.default.mkdirSync(p456, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p456, '456-01-PLAN.md'), '# Plan\n');
        const p457 = path_1.default.join(tmpDir, '.planning', 'phases', '457-integration');
        fs_1.default.mkdirSync(p457, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p457, '457-01-PLAN.md'), '# Plan\n');
        // Phase 45 from prior milestone — should not match
        const p45 = path_1.default.join(tmpDir, '.planning', 'phases', '45-old');
        fs_1.default.mkdirSync(p45, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(p45, 'PLAN.md'), '# Plan\n');
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.49 --name DACP', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phases, 2, 'should count only phases 456 and 457');
    });
    (0, node_test_1.test)('handles empty phases directory', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap v1.0\n`);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), `# State\n\n**Status:** In progress\n**Last Activity:** 2025-01-01\n**Last Activity Description:** Working\n`);
        // phases directory exists but is empty (from createTempProject)
        const result = (0, helpers_cjs_1.runGsdTools)('milestone complete v1.0 --name EmptyPhases', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.phases, 0, 'phase count should be 0');
        node_assert_1.default.strictEqual(output.plans, 0, 'plan count should be 0');
        node_assert_1.default.strictEqual(output.tasks, 0, 'task count should be 0');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// requirements mark-complete command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('requirements mark-complete command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    // ─── helpers ──────────────────────────────────────────────────────────────
    function writeRequirements(tmpDir, content) {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), content, 'utf-8');
    }
    function readRequirements(tmpDir) {
        return fs_1.default.readFileSync(path_1.default.join(tmpDir, '.planning', 'REQUIREMENTS.md'), 'utf-8');
    }
    const STANDARD_REQUIREMENTS = `# Requirements

## Test Coverage
- [ ] **TEST-01**: core.cjs has tests for loadConfig
- [ ] **TEST-02**: core.cjs has tests for resolveModelInternal
- [x] **TEST-03**: core.cjs has tests for escapeRegex (already complete)

## Bug Regressions
- [ ] **REG-01**: Test confirms loadConfig returns model_overrides

## Infrastructure
- [ ] **INFRA-01**: GitHub Actions workflow runs tests

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| TEST-01 | Phase 1 | Pending |
| TEST-02 | Phase 1 | Pending |
| TEST-03 | Phase 1 | Complete |
| REG-01 | Phase 1 | Pending |
| INFRA-01 | Phase 6 | Pending |
`;
    // ─── tests ────────────────────────────────────────────────────────────────
    (0, node_test_1.test)('marks single requirement complete (checkbox + table)', () => {
        writeRequirements(tmpDir, STANDARD_REQUIREMENTS);
        const result = (0, helpers_cjs_1.runGsdTools)('requirements mark-complete TEST-01', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, true);
        node_assert_1.default.ok(output.marked_complete.includes('TEST-01'), 'TEST-01 should be marked complete');
        const content = readRequirements(tmpDir);
        node_assert_1.default.ok(content.includes('- [x] **TEST-01**'), 'checkbox should be checked');
        node_assert_1.default.ok(content.includes('| TEST-01 | Phase 1 | Complete |'), 'table row should be Complete');
        // Other checkboxes unchanged
        node_assert_1.default.ok(content.includes('- [ ] **TEST-02**'), 'TEST-02 should remain unchecked');
    });
    (0, node_test_1.test)('handles mixed prefixes in single call (TEST-XX, REG-XX, INFRA-XX)', () => {
        writeRequirements(tmpDir, STANDARD_REQUIREMENTS);
        const result = (0, helpers_cjs_1.runGsdTools)('requirements mark-complete TEST-01,REG-01,INFRA-01', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.marked_complete.length, 3, 'should mark 3 requirements complete');
        node_assert_1.default.ok(output.marked_complete.includes('TEST-01'));
        node_assert_1.default.ok(output.marked_complete.includes('REG-01'));
        node_assert_1.default.ok(output.marked_complete.includes('INFRA-01'));
        const content = readRequirements(tmpDir);
        node_assert_1.default.ok(content.includes('- [x] **TEST-01**'), 'TEST-01 checkbox should be checked');
        node_assert_1.default.ok(content.includes('- [x] **REG-01**'), 'REG-01 checkbox should be checked');
        node_assert_1.default.ok(content.includes('- [x] **INFRA-01**'), 'INFRA-01 checkbox should be checked');
        node_assert_1.default.ok(content.includes('| TEST-01 | Phase 1 | Complete |'), 'TEST-01 table should be Complete');
        node_assert_1.default.ok(content.includes('| REG-01 | Phase 1 | Complete |'), 'REG-01 table should be Complete');
        node_assert_1.default.ok(content.includes('| INFRA-01 | Phase 6 | Complete |'), 'INFRA-01 table should be Complete');
    });
    (0, node_test_1.test)('accepts space-separated IDs', () => {
        writeRequirements(tmpDir, STANDARD_REQUIREMENTS);
        const result = (0, helpers_cjs_1.runGsdTools)('requirements mark-complete TEST-01 TEST-02', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.marked_complete.length, 2, 'should mark 2 requirements complete');
        const content = readRequirements(tmpDir);
        node_assert_1.default.ok(content.includes('- [x] **TEST-01**'), 'TEST-01 should be checked');
        node_assert_1.default.ok(content.includes('- [x] **TEST-02**'), 'TEST-02 should be checked');
    });
    (0, node_test_1.test)('accepts bracket-wrapped IDs [REQ-01, REQ-02]', () => {
        writeRequirements(tmpDir, STANDARD_REQUIREMENTS);
        const result = (0, helpers_cjs_1.runGsdTools)('requirements mark-complete [TEST-01,TEST-02]', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.marked_complete.length, 2, 'should mark 2 requirements complete');
        const content = readRequirements(tmpDir);
        node_assert_1.default.ok(content.includes('- [x] **TEST-01**'), 'TEST-01 should be checked');
        node_assert_1.default.ok(content.includes('- [x] **TEST-02**'), 'TEST-02 should be checked');
    });
    (0, node_test_1.test)('returns not_found for invalid IDs while updating valid ones', () => {
        writeRequirements(tmpDir, STANDARD_REQUIREMENTS);
        const result = (0, helpers_cjs_1.runGsdTools)('requirements mark-complete TEST-01,FAKE-99', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, true, 'should still update valid IDs');
        node_assert_1.default.ok(output.marked_complete.includes('TEST-01'), 'TEST-01 should be marked complete');
        node_assert_1.default.ok(output.not_found.includes('FAKE-99'), 'FAKE-99 should be in not_found');
        node_assert_1.default.strictEqual(output.total, 2, 'total should reflect all IDs attempted');
    });
    (0, node_test_1.test)('idempotent — re-marking already-complete requirement does not corrupt', () => {
        writeRequirements(tmpDir, STANDARD_REQUIREMENTS);
        // TEST-03 already has [x] and Complete in the fixture
        const result = (0, helpers_cjs_1.runGsdTools)('requirements mark-complete TEST-03', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        // Regex only matches [ ] (space), not [x], so TEST-03 goes to not_found
        node_assert_1.default.ok(output.not_found.includes('TEST-03'), 'already-complete ID should be in not_found');
        const content = readRequirements(tmpDir);
        // File should not be corrupted — no [xx] or doubled markers
        node_assert_1.default.ok(content.includes('- [x] **TEST-03**'), 'existing [x] should remain intact');
        node_assert_1.default.ok(!content.includes('[xx]'), 'should not have doubled x markers');
        node_assert_1.default.ok(!content.includes('- [x] [x]'), 'should not have duplicate checkbox');
    });
    (0, node_test_1.test)('missing REQUIREMENTS.md returns expected error structure', () => {
        // createTempProject does not create REQUIREMENTS.md — so it's already missing
        const result = (0, helpers_cjs_1.runGsdTools)('requirements mark-complete TEST-01', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, false, 'updated should be false');
        node_assert_1.default.strictEqual(output.reason, 'REQUIREMENTS.md not found', 'should report file not found');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// validate consistency command
// ─────────────────────────────────────────────────────────────────────────────
//# sourceMappingURL=milestone.test.cjs.map