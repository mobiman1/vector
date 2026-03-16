"use strict";
/**
 * Vector Tools Tests - Validate Health Command
 *
 * Comprehensive tests for validate-health covering all 8 health checks
 * and the repair path.
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
// ─── Helpers for setting up minimal valid projects ────────────────────────────
function writeMinimalRoadmap(tmpDir, phases = ['1']) {
    const lines = phases.map((n) => `### Phase ${n}: Phase ${n} Description`).join('\n');
    fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), `# Roadmap\n\n${lines}\n`);
}
function writeMinimalProjectMd(tmpDir, sections = ['## What This Is', '## Core Value', '## Requirements']) {
    const content = sections.map((s) => `${s}\n\nContent here.\n`).join('\n');
    fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'PROJECT.md'), `# Project\n\n${content}`);
}
function writeMinimalStateMd(tmpDir, content) {
    const defaultContent = content || `# Session State\n\n## Current Position\n\nPhase: 1\n`;
    fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), defaultContent);
}
function writeValidConfigJson(tmpDir) {
    fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), JSON.stringify({ model_profile: 'balanced', commit_docs: true }, null, 2));
}
// ─────────────────────────────────────────────────────────────────────────────
// validate health command — all 8 checks
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('validate health command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    // ─── Check 1: .planning/ exists ───────────────────────────────────────────
    (0, node_test_1.test)("returns 'broken' when .planning directory is missing", () => {
        // createTempProject creates .planning/phases — remove it entirely
        fs_1.default.rmSync(path_1.default.join(tmpDir, '.planning'), { recursive: true, force: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.status, 'broken', 'should be broken');
        node_assert_1.default.ok(output.errors.some((e) => e.code === 'E001'), `Expected E001 in errors: ${JSON.stringify(output.errors)}`);
    });
    // ─── Check 2: PROJECT.md exists and has required sections ─────────────────
    (0, node_test_1.test)('warns when PROJECT.md is missing', () => {
        // No PROJECT.md in .planning
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir);
        writeValidConfigJson(tmpDir);
        // Create valid phase dir so no W007
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.errors.some((e) => e.code === 'E002'), `Expected E002 in errors: ${JSON.stringify(output.errors)}`);
    });
    (0, node_test_1.test)('warns when PROJECT.md missing required sections', () => {
        // PROJECT.md missing "## Core Value" section
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n\n## What This Is\n\nFoo\n\n## Requirements\n\nBar\n');
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir);
        writeValidConfigJson(tmpDir);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        const w001s = output.warnings.filter((w) => w.code === 'W001');
        node_assert_1.default.ok(w001s.length > 0, `Expected W001 warnings: ${JSON.stringify(output.warnings)}`);
        node_assert_1.default.ok(w001s.some((w) => w.message.includes('## Core Value')), `Expected W001 mentioning "## Core Value": ${JSON.stringify(w001s)}`);
    });
    (0, node_test_1.test)('passes when PROJECT.md has all required sections', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir);
        writeValidConfigJson(tmpDir);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(!output.errors.some((e) => e.code === 'E002'), `Should not have E002: ${JSON.stringify(output.errors)}`);
        node_assert_1.default.ok(!output.warnings.some((w) => w.code === 'W001'), `Should not have W001: ${JSON.stringify(output.warnings)}`);
    });
    // ─── Check 3: ROADMAP.md exists ───────────────────────────────────────────
    (0, node_test_1.test)('errors when ROADMAP.md is missing', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalStateMd(tmpDir);
        writeValidConfigJson(tmpDir);
        // No ROADMAP.md
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.errors.some((e) => e.code === 'E003'), `Expected E003 in errors: ${JSON.stringify(output.errors)}`);
    });
    // ─── Check 4: STATE.md exists and references valid phases ─────────────────
    (0, node_test_1.test)('errors when STATE.md is missing with repairable true', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeValidConfigJson(tmpDir);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        // No STATE.md
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        const e004 = output.errors.find((e) => e.code === 'E004');
        node_assert_1.default.ok(e004, `Expected E004 in errors: ${JSON.stringify(output.errors)}`);
        node_assert_1.default.strictEqual(e004.repairable, true, 'E004 should be repairable');
    });
    (0, node_test_1.test)('warns when STATE.md references nonexistent phase', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeValidConfigJson(tmpDir);
        // STATE.md mentions Phase 99 but only 01-a dir exists
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'STATE.md'), '# Session State\n\nPhase 99 is the current phase.\n');
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.warnings.some((w) => w.code === 'W002'), `Expected W002 in warnings: ${JSON.stringify(output.warnings)}`);
    });
    // ─── Check 5: config.json valid JSON + valid schema ───────────────────────
    (0, node_test_1.test)('warns when config.json is missing with repairable true', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        // No config.json
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        const w003 = output.warnings.find((w) => w.code === 'W003');
        node_assert_1.default.ok(w003, `Expected W003 in warnings: ${JSON.stringify(output.warnings)}`);
        node_assert_1.default.strictEqual(w003.repairable, true, 'W003 should be repairable');
    });
    (0, node_test_1.test)('errors when config.json has invalid JSON', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), '{broken json');
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.errors.some((e) => e.code === 'E005'), `Expected E005 in errors: ${JSON.stringify(output.errors)}`);
    });
    (0, node_test_1.test)('warns when config.json has invalid model_profile', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), JSON.stringify({ model_profile: 'invalid' }));
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.warnings.some((w) => w.code === 'W004'), `Expected W004 in warnings: ${JSON.stringify(output.warnings)}`);
    });
    (0, node_test_1.test)('accepts inherit model_profile as valid', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir);
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), JSON.stringify({
            model_profile: 'inherit',
            workflow: {
                research: true,
                plan_check: true,
                verifier: true,
                nyquist_validation: true,
            },
        }));
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(!output.warnings.some((w) => w.code === 'W004'), `Should not warn for inherit model_profile: ${JSON.stringify(output.warnings)}`);
    });
    // ─── Check 6: Phase directory naming (NN-name format) ─────────────────────
    (0, node_test_1.test)('warns about incorrectly named phase directories', () => {
        writeMinimalProjectMd(tmpDir);
        // Roadmap with no phases to avoid W006
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\nNo phases yet.\n');
        writeMinimalStateMd(tmpDir, '# Session State\n\nNo phase references.\n');
        writeValidConfigJson(tmpDir);
        // Create a badly named dir
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', 'bad_name'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.warnings.some((w) => w.code === 'W005'), `Expected W005 in warnings: ${JSON.stringify(output.warnings)}`);
    });
    // ─── Check 7: Orphaned plans (PLAN without SUMMARY) ───────────────────────
    (0, node_test_1.test)('reports orphaned plans (PLAN without SUMMARY) as info', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir);
        writeValidConfigJson(tmpDir);
        // Create 01-test phase dir with a PLAN but no matching SUMMARY
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-test');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-PLAN.md'), '# Plan\n');
        // No 01-01-SUMMARY.md
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.info.some((i) => i.code === 'I001'), `Expected I001 in info: ${JSON.stringify(output.info)}`);
    });
    // ─── Check 8: Consistency (roadmap/disk sync) ─────────────────────────────
    (0, node_test_1.test)('warns about phase in ROADMAP but not on disk', () => {
        writeMinimalProjectMd(tmpDir);
        // ROADMAP mentions Phase 5 but no 05-xxx dir
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\n### Phase 5: Future Phase\n');
        writeMinimalStateMd(tmpDir, '# Session State\n\nNo phase refs.\n');
        writeValidConfigJson(tmpDir);
        // No phase dirs
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.warnings.some((w) => w.code === 'W006'), `Expected W006 in warnings: ${JSON.stringify(output.warnings)}`);
    });
    (0, node_test_1.test)('warns about phase on disk but not in ROADMAP', () => {
        writeMinimalProjectMd(tmpDir);
        // ROADMAP has no phases
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\nNo phases listed.\n');
        writeMinimalStateMd(tmpDir, '# Session State\n\nNo phase refs.\n');
        writeValidConfigJson(tmpDir);
        // Orphan phase dir not in ROADMAP
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '99-orphan'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.warnings.some((w) => w.code === 'W007'), `Expected W007 in warnings: ${JSON.stringify(output.warnings)}`);
    });
    // ─── Check 5b: Nyquist validation key presence (W008) ─────────────────────
    (0, node_test_1.test)('detects W008 when workflow.nyquist_validation absent from config', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir, '# Session State\n\nPhase 1 in progress.\n');
        // Config with workflow section but WITHOUT nyquist_validation key
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), JSON.stringify({ model_profile: 'balanced', workflow: { research: true } }, null, 2));
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.warnings.some((w) => w.code === 'W008'), `Expected W008 in warnings: ${JSON.stringify(output.warnings)}`);
    });
    (0, node_test_1.test)('does not emit W008 when nyquist_validation is explicitly set', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir, '# Session State\n\nPhase 1 in progress.\n');
        // Config with workflow.nyquist_validation explicitly set
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), JSON.stringify({ model_profile: 'balanced', workflow: { research: true, nyquist_validation: true } }, null, 2));
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(!output.warnings.some((w) => w.code === 'W008'), `Should not have W008: ${JSON.stringify(output.warnings)}`);
    });
    // ─── Check 7b: Nyquist VALIDATION.md consistency (W009) ──────────────────
    (0, node_test_1.test)('detects W009 when RESEARCH.md has Validation Architecture but no VALIDATION.md', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir, '# Session State\n\nPhase 1 in progress.\n');
        writeValidConfigJson(tmpDir);
        // Create phase dir with RESEARCH.md containing Validation Architecture
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-setup');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-RESEARCH.md'), '# Research\n\n## Validation Architecture\n\nSome validation content.\n');
        // No VALIDATION.md
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.warnings.some((w) => w.code === 'W009'), `Expected W009 in warnings: ${JSON.stringify(output.warnings)}`);
    });
    (0, node_test_1.test)('does not emit W009 when VALIDATION.md exists alongside RESEARCH.md', () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir, '# Session State\n\nPhase 1 in progress.\n');
        writeValidConfigJson(tmpDir);
        // Create phase dir with both RESEARCH.md and VALIDATION.md
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-setup');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-RESEARCH.md'), '# Research\n\n## Validation Architecture\n\nSome validation content.\n');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-VALIDATION.md'), '# Validation\n\nValidation content.\n');
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(!output.warnings.some((w) => w.code === 'W009'), `Should not have W009: ${JSON.stringify(output.warnings)}`);
    });
    // ─── Overall status ────────────────────────────────────────────────────────
    (0, node_test_1.test)("returns 'healthy' when all checks pass", () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir, '# Session State\n\nPhase 1 in progress.\n');
        writeValidConfigJson(tmpDir);
        // Create valid phase dir matching ROADMAP
        const phaseDir = path_1.default.join(tmpDir, '.planning', 'phases', '01-a');
        fs_1.default.mkdirSync(phaseDir, { recursive: true });
        // Add PLAN+SUMMARY so no I001
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-PLAN.md'), '# Plan\n');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), '# Summary\n');
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.status, 'healthy', `Expected healthy, got ${output.status}. Errors: ${JSON.stringify(output.errors)}, Warnings: ${JSON.stringify(output.warnings)}`);
        node_assert_1.default.deepStrictEqual(output.errors, [], 'should have no errors');
        node_assert_1.default.deepStrictEqual(output.warnings, [], 'should have no warnings');
    });
    (0, node_test_1.test)("returns 'degraded' when only warnings exist", () => {
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        writeMinimalStateMd(tmpDir);
        // No config.json → W003 (warning, not error)
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.status, 'degraded', `Expected degraded, got ${output.status}`);
        node_assert_1.default.strictEqual(output.errors.length, 0, 'should have no errors');
        node_assert_1.default.ok(output.warnings.length > 0, 'should have warnings');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// validate health --repair command
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('validate health --repair command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
        // Set up base project with ROADMAP and PROJECT.md so repairs are triggered
        // (E001, E003 are not repairable so we always need .planning/ and ROADMAP.md)
        writeMinimalProjectMd(tmpDir);
        writeMinimalRoadmap(tmpDir, ['1']);
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-a'), { recursive: true });
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('creates config.json with defaults when missing', () => {
        // STATE.md present so no STATE repair; no config.json
        writeMinimalStateMd(tmpDir, '# Session State\n\nPhase 1 in progress.\n');
        // Ensure no config.json
        const configPath = path_1.default.join(tmpDir, '.planning', 'config.json');
        if (fs_1.default.existsSync(configPath))
            fs_1.default.unlinkSync(configPath);
        const result = (0, helpers_cjs_1.runGsdTools)('validate health --repair', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(Array.isArray(output.repairs_performed), `Expected repairs_performed array: ${JSON.stringify(output)}`);
        const createAction = output.repairs_performed.find((r) => r.action === 'createConfig');
        node_assert_1.default.ok(createAction, `Expected createConfig action: ${JSON.stringify(output.repairs_performed)}`);
        node_assert_1.default.strictEqual(createAction.success, true, 'createConfig should succeed');
        // Verify config.json now exists on disk with valid JSON and balanced profile
        node_assert_1.default.ok(fs_1.default.existsSync(configPath), 'config.json should now exist on disk');
        const diskConfig = JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
        node_assert_1.default.strictEqual(diskConfig.model_profile, 'balanced', 'default model_profile should be balanced');
        // Verify nested workflow structure matches config.cjs canonical format
        node_assert_1.default.ok(diskConfig.workflow, 'config should have nested workflow object');
        node_assert_1.default.strictEqual(diskConfig.workflow.research, true, 'workflow.research should default to true');
        node_assert_1.default.strictEqual(diskConfig.workflow.plan_check, true, 'workflow.plan_check should default to true');
        node_assert_1.default.strictEqual(diskConfig.workflow.verifier, true, 'workflow.verifier should default to true');
        node_assert_1.default.strictEqual(diskConfig.workflow.nyquist_validation, true, 'workflow.nyquist_validation should default to true');
        // Verify branch templates are present
        node_assert_1.default.strictEqual(diskConfig.phase_branch_template, 'vector/phase-{phase}-{slug}');
        node_assert_1.default.strictEqual(diskConfig.milestone_branch_template, 'vector/{milestone}-{slug}');
    });
    (0, node_test_1.test)('resets config.json when JSON is invalid', () => {
        writeMinimalStateMd(tmpDir, '# Session State\n\nPhase 1 in progress.\n');
        const configPath = path_1.default.join(tmpDir, '.planning', 'config.json');
        fs_1.default.writeFileSync(configPath, '{broken json');
        const result = (0, helpers_cjs_1.runGsdTools)('validate health --repair', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(Array.isArray(output.repairs_performed), `Expected repairs_performed: ${JSON.stringify(output)}`);
        const resetAction = output.repairs_performed.find((r) => r.action === 'resetConfig');
        node_assert_1.default.ok(resetAction, `Expected resetConfig action: ${JSON.stringify(output.repairs_performed)}`);
        // Verify config.json is now valid JSON with correct nested structure
        const diskConfig = JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
        node_assert_1.default.ok(typeof diskConfig === 'object', 'config.json should be valid JSON after repair');
        node_assert_1.default.ok(diskConfig.workflow, 'reset config should have nested workflow object');
        node_assert_1.default.strictEqual(diskConfig.workflow.research, true, 'workflow.research should be true after reset');
    });
    (0, node_test_1.test)('regenerates STATE.md when missing', () => {
        writeValidConfigJson(tmpDir);
        // No STATE.md
        const statePath = path_1.default.join(tmpDir, '.planning', 'STATE.md');
        if (fs_1.default.existsSync(statePath))
            fs_1.default.unlinkSync(statePath);
        const result = (0, helpers_cjs_1.runGsdTools)('validate health --repair', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(Array.isArray(output.repairs_performed), `Expected repairs_performed: ${JSON.stringify(output)}`);
        const regenerateAction = output.repairs_performed.find((r) => r.action === 'regenerateState');
        node_assert_1.default.ok(regenerateAction, `Expected regenerateState action: ${JSON.stringify(output.repairs_performed)}`);
        node_assert_1.default.strictEqual(regenerateAction.success, true, 'regenerateState should succeed');
        // Verify STATE.md now exists and contains "# Session State"
        node_assert_1.default.ok(fs_1.default.existsSync(statePath), 'STATE.md should now exist on disk');
        const stateContent = fs_1.default.readFileSync(statePath, 'utf-8');
        node_assert_1.default.ok(stateContent.includes('# Session State'), 'regenerated STATE.md should contain "# Session State"');
    });
    (0, node_test_1.test)('backs up existing STATE.md before regenerating', () => {
        writeValidConfigJson(tmpDir);
        const statePath = path_1.default.join(tmpDir, '.planning', 'STATE.md');
        const originalContent = '# Session State\n\nOriginal content here.\n';
        fs_1.default.writeFileSync(statePath, originalContent);
        // Make STATE.md reference a nonexistent phase so repair is triggered
        fs_1.default.writeFileSync(statePath, '# Session State\n\nPhase 99 is current.\n');
        const result = (0, helpers_cjs_1.runGsdTools)('validate health --repair', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(Array.isArray(output.repairs_performed), `Expected repairs_performed: ${JSON.stringify(output)}`);
        // Verify a .bak- file exists alongside STATE.md
        const planningDir = path_1.default.join(tmpDir, '.planning');
        const planningFiles = fs_1.default.readdirSync(planningDir);
        const backupFile = planningFiles.find((f) => f.startsWith('STATE.md.bak-'));
        node_assert_1.default.ok(backupFile, `Expected a STATE.md.bak- file. Found files: ${planningFiles.join(', ')}`);
        // Verify backup contains the original content
        const backupContent = fs_1.default.readFileSync(path_1.default.join(planningDir, backupFile), 'utf-8');
        node_assert_1.default.ok(backupContent.includes('Phase 99'), 'backup should contain the original STATE.md content');
    });
    (0, node_test_1.test)('adds nyquist_validation key to config.json via addNyquistKey repair', () => {
        writeMinimalStateMd(tmpDir, '# Session State\n\nPhase 1 in progress.\n');
        // Config with workflow section but missing nyquist_validation
        const configPath = path_1.default.join(tmpDir, '.planning', 'config.json');
        fs_1.default.writeFileSync(configPath, JSON.stringify({ model_profile: 'balanced', workflow: { research: true } }, null, 2));
        const result = (0, helpers_cjs_1.runGsdTools)('validate health --repair', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(Array.isArray(output.repairs_performed), `Expected repairs_performed array: ${JSON.stringify(output)}`);
        const addKeyAction = output.repairs_performed.find((r) => r.action === 'addNyquistKey');
        node_assert_1.default.ok(addKeyAction, `Expected addNyquistKey action: ${JSON.stringify(output.repairs_performed)}`);
        node_assert_1.default.strictEqual(addKeyAction.success, true, 'addNyquistKey should succeed');
        // Read config.json and verify workflow.nyquist_validation is true
        const diskConfig = JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
        node_assert_1.default.strictEqual(diskConfig.workflow.nyquist_validation, true, 'nyquist_validation should be true');
    });
    (0, node_test_1.test)('reports repairable_count correctly', () => {
        // No config.json (W003, repairable=true) and no STATE.md (E004, repairable=true)
        const configPath = path_1.default.join(tmpDir, '.planning', 'config.json');
        if (fs_1.default.existsSync(configPath))
            fs_1.default.unlinkSync(configPath);
        const statePath = path_1.default.join(tmpDir, '.planning', 'STATE.md');
        if (fs_1.default.existsSync(statePath))
            fs_1.default.unlinkSync(statePath);
        // Run WITHOUT --repair to just check repairable_count
        const result = (0, helpers_cjs_1.runGsdTools)('validate health', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.repairable_count >= 2, `Expected repairable_count >= 2, got ${output.repairable_count}. Full output: ${JSON.stringify(output)}`);
    });
});
//# sourceMappingURL=verify-health.test.cjs.map