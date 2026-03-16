"use strict";
/**
 * Vector Tools Tests - Dispatcher
 *
 * Tests for vector-tools.cjs dispatch routing and error paths.
 * Covers: no-command, unknown command, unknown subcommands for every command group,
 * --cwd parsing, and previously untouched routing branches.
 *
 * Requirements: DISP-01, DISP-02
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
// ─── Dispatcher Error Paths ──────────────────────────────────────────────────
(0, node_test_1.describe)('dispatcher error paths', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    // No command
    (0, node_test_1.test)('no-command invocation prints usage and exits non-zero', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Usage:'), `Expected "Usage:" in stderr, got: ${result.error}`);
    });
    // Unknown command
    (0, node_test_1.test)('unknown command produces clear error and exits non-zero', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('nonexistent-cmd', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown command'), `Expected "Unknown command" in stderr, got: ${result.error}`);
    });
    // --cwd= form with valid directory
    (0, node_test_1.test)('--cwd= form overrides working directory', () => {
        // Create STATE.md in tmpDir so state load can find it
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n## Current Position\n\nPhase: 1 of 1 (Test)\n');
        const result = (0, helpers_cjs_1.runGsdTools)(`--cwd=${tmpDir} state load`, process.cwd());
        node_assert_1.default.strictEqual(result.success, true, `Should succeed with --cwd=, got: ${result.error}`);
    });
    // --cwd= with empty value
    (0, node_test_1.test)('--cwd= with empty value produces error', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('--cwd= state load', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Missing value for --cwd'), `Expected "Missing value for --cwd" in stderr, got: ${result.error}`);
    });
    // --cwd with nonexistent path
    (0, node_test_1.test)('--cwd with invalid path produces error', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('--cwd /nonexistent/path/xyz state load', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Invalid --cwd'), `Expected "Invalid --cwd" in stderr, got: ${result.error}`);
    });
    // Unknown subcommand: template
    (0, node_test_1.test)('template unknown subcommand errors', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('template bogus', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown template subcommand'), `Expected "Unknown template subcommand" in stderr, got: ${result.error}`);
    });
    // Unknown subcommand: frontmatter
    (0, node_test_1.test)('frontmatter unknown subcommand errors', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('frontmatter bogus file.md', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown frontmatter subcommand'), `Expected "Unknown frontmatter subcommand" in stderr, got: ${result.error}`);
    });
    // Unknown subcommand: verify
    (0, node_test_1.test)('verify unknown subcommand errors', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('verify bogus', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown verify subcommand'), `Expected "Unknown verify subcommand" in stderr, got: ${result.error}`);
    });
    // Unknown subcommand: phases
    (0, node_test_1.test)('phases unknown subcommand errors', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('phases bogus', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown phases subcommand'), `Expected "Unknown phases subcommand" in stderr, got: ${result.error}`);
    });
    // Unknown subcommand: roadmap
    (0, node_test_1.test)('roadmap unknown subcommand errors', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap bogus', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown roadmap subcommand'), `Expected "Unknown roadmap subcommand" in stderr, got: ${result.error}`);
    });
    // Unknown subcommand: requirements
    (0, node_test_1.test)('requirements unknown subcommand errors', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('requirements bogus', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown requirements subcommand'), `Expected "Unknown requirements subcommand" in stderr, got: ${result.error}`);
    });
    // Unknown subcommand: phase
    (0, node_test_1.test)('phase unknown subcommand errors', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('phase bogus', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown phase subcommand'), `Expected "Unknown phase subcommand" in stderr, got: ${result.error}`);
    });
    // Unknown subcommand: milestone
    (0, node_test_1.test)('milestone unknown subcommand errors', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('milestone bogus', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown milestone subcommand'), `Expected "Unknown milestone subcommand" in stderr, got: ${result.error}`);
    });
    // Unknown subcommand: validate
    (0, node_test_1.test)('validate unknown subcommand errors', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('validate bogus', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown validate subcommand'), `Expected "Unknown validate subcommand" in stderr, got: ${result.error}`);
    });
    // Unknown subcommand: todo
    (0, node_test_1.test)('todo unknown subcommand errors', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('todo bogus', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown todo subcommand'), `Expected "Unknown todo subcommand" in stderr, got: ${result.error}`);
    });
    // Unknown subcommand: init
    (0, node_test_1.test)('init unknown workflow errors', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init bogus', tmpDir);
        node_assert_1.default.strictEqual(result.success, false, 'Should exit non-zero');
        node_assert_1.default.ok(result.error.includes('Unknown init workflow'), `Expected "Unknown init workflow" in stderr, got: ${result.error}`);
    });
});
// ─── Dispatcher Routing Branches ─────────────────────────────────────────────
(0, node_test_1.describe)('dispatcher routing branches', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    // find-phase
    (0, node_test_1.test)('find-phase locates phase directory by number', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-test-phase');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('find-phase 01', tmpDir);
        node_assert_1.default.strictEqual(result.success, true, `find-phase failed: ${result.error}`);
        node_assert_1.default.ok(result.output.includes('01-test-phase'), `Expected output to contain "01-test-phase", got: ${result.output}`);
    });
    // init resume
    (0, node_test_1.test)('init resume returns valid JSON', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n## Current Position\n\nPhase: 1 of 1 (Test)\nPlan: 01-01 complete\nStatus: Ready\nLast activity: 2026-01-01\n\nProgress: [##########] 100%\n\n## Session Continuity\n\nLast session: 2026-01-01\nStopped at: Test\nResume file: None\n');
        const result = (0, helpers_cjs_1.runGsdTools)('init resume', tmpDir);
        node_assert_1.default.strictEqual(result.success, true, `init resume failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.ok(typeof parsed === 'object', 'Output should be valid JSON object');
    });
    // init verify-work
    (0, node_test_1.test)('init verify-work returns valid JSON', () => {
        // Create STATE.md
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n## Current Position\n\nPhase: 1 of 1 (Test)\nPlan: 01-01 complete\nStatus: Ready\nLast activity: 2026-01-01\n\nProgress: [##########] 100%\n\n## Session Continuity\n\nLast session: 2026-01-01\nStopped at: Test\nResume file: None\n');
        // Create ROADMAP.md with phase section
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\n## Milestone: v1.0 Test\n\n### Phase 1: Test Phase\n**Goal**: Test goal\n**Depends on**: None\n**Requirements**: TEST-01\n**Success Criteria**:\n  1. Tests pass\n**Plans**: 1 plan\nPlans:\n- [x] 01-01-PLAN.md\n\n## Progress\n\n| Phase | Plans | Status | Date |\n|-------|-------|--------|------|\n| 1 | 1/1 | Complete | 2026-01-01 |\n');
        // Create phase dir
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('init verify-work 01', tmpDir);
        node_assert_1.default.strictEqual(result.success, true, `init verify-work failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.ok(typeof parsed === 'object', 'Output should be valid JSON object');
    });
    // roadmap update-plan-progress
    (0, node_test_1.test)('roadmap update-plan-progress updates phase progress', () => {
        // Create ROADMAP.md with progress table
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\n## Milestone: v1.0 Test\n\n### Phase 1: Test Phase\n**Goal**: Test goal\n**Depends on**: None\n**Requirements**: TEST-01\n**Success Criteria**:\n  1. Tests pass\n**Plans**: 1 plan\nPlans:\n- [ ] 01-01-PLAN.md\n\n## Progress\n\n| Phase | Plans | Status | Date |\n|-------|-------|--------|------|\n| 1 | 0/1 | Not Started | - |\n');
        // Create phase dir with PLAN and SUMMARY
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-test-phase');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-PLAN.md'), '---\nphase: 01-test-phase\nplan: "01"\n---\n\n# Plan\n');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), '---\nphase: 01-test-phase\nplan: "01"\n---\n\n# Summary\n');
        const result = (0, helpers_cjs_1.runGsdTools)('roadmap update-plan-progress 1', tmpDir);
        node_assert_1.default.strictEqual(result.success, true, `roadmap update-plan-progress failed: ${result.error}`);
    });
    // state (no subcommand) — default load
    (0, node_test_1.test)('state with no subcommand calls cmdStateLoad', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Project State\n\n## Current Position\n\nPhase: 1 of 1 (Test)\nPlan: 01-01 complete\nStatus: Ready\nLast activity: 2026-01-01\n\nProgress: [##########] 100%\n\n## Session Continuity\n\nLast session: 2026-01-01\nStopped at: Test\nResume file: None\n');
        const result = (0, helpers_cjs_1.runGsdTools)('state', tmpDir);
        node_assert_1.default.strictEqual(result.success, true, `state load failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.ok(typeof parsed === 'object', 'Output should be valid JSON object');
    });
    // summary-extract
    (0, node_test_1.test)('summary-extract parses SUMMARY.md frontmatter', () => {
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        const summaryContent = `---
phase: 01-test
plan: "01"
subsystem: testing
tags: [node, test]
duration: 5min
completed: "2026-01-01"
key-decisions:
  - "Used node:test"
requirements-completed: [TEST-01]
---

# Phase 1 Plan 01: Test Summary

**Tests added for core module**
`;
        const summaryPath = path_1.default.join(phaseDir, '01-01-SUMMARY.md');
        fs_1.default.writeFileSync(summaryPath, summaryContent);
        // Use relative path from tmpDir
        const result = (0, helpers_cjs_1.runGsdTools)(`summary-extract .planning/phases/01-test/01-01-SUMMARY.md`, tmpDir);
        node_assert_1.default.strictEqual(result.success, true, `summary-extract failed: ${result.error}`);
        const parsed = JSON.parse(result.output);
        node_assert_1.default.ok(typeof parsed === 'object', 'Output should be valid JSON object');
        node_assert_1.default.strictEqual(parsed.path, '.planning/phases/01-test/01-01-SUMMARY.md', 'Path should match input');
        node_assert_1.default.deepStrictEqual(parsed.requirements_completed, ['TEST-01'], 'requirements_completed should contain TEST-01');
    });
});
//# sourceMappingURL=dispatcher.test.cjs.map