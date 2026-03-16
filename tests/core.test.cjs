"use strict";
/**
 * Vector Tools Tests - core.cjs
 *
 * Tests for the foundational module's exports including regressions
 * for known bugs (REG-01: loadConfig model_overrides, REG-02: getRoadmapPhaseInternal export).
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
const { loadConfig, resolveModelInternal, escapeRegex, generateSlugInternal, normalizePhaseName, comparePhaseNum, safeReadFile, pathExistsInternal, getMilestoneInfo, getMilestonePhaseFilter, getRoadmapPhaseInternal, searchPhaseInDir, findPhaseInternal, } = require('../core/bin/lib/core.cjs');
// ─── loadConfig ────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('loadConfig', () => {
    let tmpDir;
    let originalCwd;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-core-test-'));
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning'), { recursive: true });
        originalCwd = process.cwd();
    });
    (0, node_test_1.afterEach)(() => {
        process.chdir(originalCwd);
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    function writeConfig(obj) {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), JSON.stringify(obj, null, 2));
    }
    (0, node_test_1.test)('returns defaults when config.json is missing', () => {
        const config = loadConfig(tmpDir);
        node_assert_1.default.strictEqual(config.model_profile, 'balanced');
        node_assert_1.default.strictEqual(config.commit_docs, true);
        node_assert_1.default.strictEqual(config.research, true);
        node_assert_1.default.strictEqual(config.plan_checker, true);
        node_assert_1.default.strictEqual(config.brave_search, false);
        node_assert_1.default.strictEqual(config.parallelization, true);
        node_assert_1.default.strictEqual(config.nyquist_validation, true);
    });
    (0, node_test_1.test)('reads model_profile from config.json', () => {
        writeConfig({ model_profile: 'quality' });
        const config = loadConfig(tmpDir);
        node_assert_1.default.strictEqual(config.model_profile, 'quality');
    });
    (0, node_test_1.test)('reads nested config keys', () => {
        writeConfig({ planning: { commit_docs: false } });
        const config = loadConfig(tmpDir);
        node_assert_1.default.strictEqual(config.commit_docs, false);
    });
    (0, node_test_1.test)('reads branching_strategy from git section', () => {
        writeConfig({ git: { branching_strategy: 'per-phase' } });
        const config = loadConfig(tmpDir);
        node_assert_1.default.strictEqual(config.branching_strategy, 'per-phase');
    });
    // Bug: loadConfig previously omitted model_overrides from return value
    (0, node_test_1.test)('returns model_overrides when present (REG-01)', () => {
        writeConfig({ model_overrides: { 'vector-executor': 'opus' } });
        const config = loadConfig(tmpDir);
        node_assert_1.default.deepStrictEqual(config.model_overrides, { 'vector-executor': 'opus' });
    });
    (0, node_test_1.test)('returns model_overrides as null when not in config', () => {
        writeConfig({ model_profile: 'balanced' });
        const config = loadConfig(tmpDir);
        node_assert_1.default.strictEqual(config.model_overrides, null);
    });
    (0, node_test_1.test)('returns defaults when config.json contains invalid JSON', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), 'not valid json {{{{');
        const config = loadConfig(tmpDir);
        node_assert_1.default.strictEqual(config.model_profile, 'balanced');
        node_assert_1.default.strictEqual(config.commit_docs, true);
    });
    (0, node_test_1.test)('handles parallelization as boolean', () => {
        writeConfig({ parallelization: false });
        const config = loadConfig(tmpDir);
        node_assert_1.default.strictEqual(config.parallelization, false);
    });
    (0, node_test_1.test)('handles parallelization as object with enabled field', () => {
        writeConfig({ parallelization: { enabled: false } });
        const config = loadConfig(tmpDir);
        node_assert_1.default.strictEqual(config.parallelization, false);
    });
    (0, node_test_1.test)('prefers top-level keys over nested keys', () => {
        writeConfig({ commit_docs: false, planning: { commit_docs: true } });
        const config = loadConfig(tmpDir);
        node_assert_1.default.strictEqual(config.commit_docs, false);
    });
});
// ─── resolveModelInternal ──────────────────────────────────────────────────────
(0, node_test_1.describe)('resolveModelInternal', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-core-test-'));
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning'), { recursive: true });
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    function writeConfig(obj) {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'config.json'), JSON.stringify(obj, null, 2));
    }
    (0, node_test_1.describe)('model profile structural validation', () => {
        (0, node_test_1.test)('all known agents resolve to a valid string for each profile', () => {
            const knownAgents = ['vector-planner', 'vector-executor', 'vector-phase-researcher', 'vector-codebase-mapper'];
            const profiles = ['quality', 'balanced', 'budget', 'inherit'];
            const validValues = ['inherit', 'sonnet', 'haiku', 'opus'];
            for (const profile of profiles) {
                writeConfig({ model_profile: profile });
                for (const agent of knownAgents) {
                    const result = resolveModelInternal(tmpDir, agent);
                    node_assert_1.default.ok(validValues.includes(result), `profile=${profile} agent=${agent} returned unexpected value: ${result}`);
                }
            }
        });
        (0, node_test_1.test)('inherit profile forces all known agents to inherit model', () => {
            const knownAgents = ['vector-planner', 'vector-executor', 'vector-phase-researcher', 'vector-codebase-mapper'];
            writeConfig({ model_profile: 'inherit' });
            for (const agent of knownAgents) {
                node_assert_1.default.strictEqual(resolveModelInternal(tmpDir, agent), 'inherit');
            }
        });
    });
    (0, node_test_1.describe)('override precedence', () => {
        (0, node_test_1.test)('per-agent override takes precedence over profile', () => {
            writeConfig({
                model_profile: 'balanced',
                model_overrides: { 'vector-executor': 'haiku' },
            });
            node_assert_1.default.strictEqual(resolveModelInternal(tmpDir, 'vector-executor'), 'haiku');
        });
        (0, node_test_1.test)('opus override resolves to inherit', () => {
            writeConfig({
                model_overrides: { 'vector-executor': 'opus' },
            });
            node_assert_1.default.strictEqual(resolveModelInternal(tmpDir, 'vector-executor'), 'inherit');
        });
        (0, node_test_1.test)('agents not in override fall back to profile', () => {
            writeConfig({
                model_profile: 'quality',
                model_overrides: { 'vector-executor': 'haiku' },
            });
            // vector-planner not overridden, should use quality profile -> opus -> inherit
            node_assert_1.default.strictEqual(resolveModelInternal(tmpDir, 'vector-planner'), 'inherit');
        });
    });
    (0, node_test_1.describe)('edge cases', () => {
        (0, node_test_1.test)('returns sonnet for unknown agent type', () => {
            writeConfig({ model_profile: 'balanced' });
            node_assert_1.default.strictEqual(resolveModelInternal(tmpDir, 'vector-nonexistent'), 'sonnet');
        });
        (0, node_test_1.test)('returns sonnet for unknown agent type even with inherit profile', () => {
            writeConfig({ model_profile: 'inherit' });
            node_assert_1.default.strictEqual(resolveModelInternal(tmpDir, 'vector-nonexistent'), 'sonnet');
        });
        (0, node_test_1.test)('defaults to balanced profile when model_profile missing', () => {
            writeConfig({});
            // balanced profile, vector-planner -> opus -> inherit
            node_assert_1.default.strictEqual(resolveModelInternal(tmpDir, 'vector-planner'), 'inherit');
        });
    });
});
// ─── escapeRegex ───────────────────────────────────────────────────────────────
(0, node_test_1.describe)('escapeRegex', () => {
    (0, node_test_1.test)('escapes dots', () => {
        node_assert_1.default.strictEqual(escapeRegex('file.txt'), 'file\\.txt');
    });
    (0, node_test_1.test)('escapes all special regex characters', () => {
        const input = '1.0 (alpha) [test] {ok} $100 ^start end$ a+b a*b a?b pipe|or back\\slash';
        const result = escapeRegex(input);
        // Verify each special char is escaped
        node_assert_1.default.ok(result.includes('\\.'));
        node_assert_1.default.ok(result.includes('\\('));
        node_assert_1.default.ok(result.includes('\\)'));
        node_assert_1.default.ok(result.includes('\\['));
        node_assert_1.default.ok(result.includes('\\]'));
        node_assert_1.default.ok(result.includes('\\{'));
        node_assert_1.default.ok(result.includes('\\}'));
        node_assert_1.default.ok(result.includes('\\$'));
        node_assert_1.default.ok(result.includes('\\^'));
        node_assert_1.default.ok(result.includes('\\+'));
        node_assert_1.default.ok(result.includes('\\*'));
        node_assert_1.default.ok(result.includes('\\?'));
        node_assert_1.default.ok(result.includes('\\|'));
        node_assert_1.default.ok(result.includes('\\\\'));
    });
    (0, node_test_1.test)('handles empty string', () => {
        node_assert_1.default.strictEqual(escapeRegex(''), '');
    });
    (0, node_test_1.test)('returns plain string unchanged', () => {
        node_assert_1.default.strictEqual(escapeRegex('hello'), 'hello');
    });
});
// ─── generateSlugInternal ──────────────────────────────────────────────────────
(0, node_test_1.describe)('generateSlugInternal', () => {
    (0, node_test_1.test)('converts text to lowercase kebab-case', () => {
        node_assert_1.default.strictEqual(generateSlugInternal('Hello World'), 'hello-world');
    });
    (0, node_test_1.test)('removes special characters', () => {
        node_assert_1.default.strictEqual(generateSlugInternal('core.cjs Tests!'), 'core-cjs-tests');
    });
    (0, node_test_1.test)('trims leading and trailing hyphens', () => {
        node_assert_1.default.strictEqual(generateSlugInternal('---hello---'), 'hello');
    });
    (0, node_test_1.test)('returns null for null input', () => {
        node_assert_1.default.strictEqual(generateSlugInternal(null), null);
    });
    (0, node_test_1.test)('returns null for empty string', () => {
        node_assert_1.default.strictEqual(generateSlugInternal(''), null);
    });
});
// ─── normalizePhaseName ────────────────────────────────────────────────────────
(0, node_test_1.describe)('normalizePhaseName', () => {
    (0, node_test_1.test)('pads single digit', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('1'), '01');
    });
    (0, node_test_1.test)('preserves double digit', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('12'), '12');
    });
    (0, node_test_1.test)('handles letter suffix', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('1A'), '01A');
    });
    (0, node_test_1.test)('handles decimal phases', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('2.1'), '02.1');
    });
    (0, node_test_1.test)('handles multi-level decimals', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('1.2.3'), '01.2.3');
    });
    (0, node_test_1.test)('returns non-matching input unchanged', () => {
        node_assert_1.default.strictEqual(normalizePhaseName('abc'), 'abc');
    });
});
// ─── comparePhaseNum ───────────────────────────────────────────────────────────
(0, node_test_1.describe)('comparePhaseNum', () => {
    (0, node_test_1.test)('sorts integer phases numerically', () => {
        node_assert_1.default.ok(comparePhaseNum('1', '2') < 0);
        node_assert_1.default.ok(comparePhaseNum('10', '2') > 0);
    });
    (0, node_test_1.test)('sorts letter suffixes', () => {
        node_assert_1.default.ok(comparePhaseNum('12', '12A') < 0);
        node_assert_1.default.ok(comparePhaseNum('12A', '12B') < 0);
    });
    (0, node_test_1.test)('sorts decimal phases', () => {
        node_assert_1.default.ok(comparePhaseNum('2', '2.1') < 0);
        node_assert_1.default.ok(comparePhaseNum('2.1', '2.2') < 0);
    });
    (0, node_test_1.test)('handles multi-level decimals', () => {
        node_assert_1.default.ok(comparePhaseNum('1.1', '1.1.2') < 0);
        node_assert_1.default.ok(comparePhaseNum('1.1.2', '1.2') < 0);
    });
    (0, node_test_1.test)('returns 0 for equal phases', () => {
        node_assert_1.default.strictEqual(comparePhaseNum('1', '1'), 0);
        node_assert_1.default.strictEqual(comparePhaseNum('2.1', '2.1'), 0);
    });
});
// ─── safeReadFile ──────────────────────────────────────────────────────────────
(0, node_test_1.describe)('safeReadFile', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-core-test-'));
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('reads existing file', () => {
        const filePath = path_1.default.join(tmpDir, 'test.txt');
        fs_1.default.writeFileSync(filePath, 'hello world');
        node_assert_1.default.strictEqual(safeReadFile(filePath), 'hello world');
    });
    (0, node_test_1.test)('returns null for missing file', () => {
        node_assert_1.default.strictEqual(safeReadFile('/nonexistent/path/file.txt'), null);
    });
});
// ─── pathExistsInternal ────────────────────────────────────────────────────────
(0, node_test_1.describe)('pathExistsInternal', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-core-test-'));
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning'), { recursive: true });
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('returns true for existing path', () => {
        node_assert_1.default.strictEqual(pathExistsInternal(tmpDir, '.planning'), true);
    });
    (0, node_test_1.test)('returns false for non-existing path', () => {
        node_assert_1.default.strictEqual(pathExistsInternal(tmpDir, 'nonexistent'), false);
    });
    (0, node_test_1.test)('handles absolute paths', () => {
        node_assert_1.default.strictEqual(pathExistsInternal(tmpDir, tmpDir), true);
    });
});
// ─── getMilestoneInfo ──────────────────────────────────────────────────────────
(0, node_test_1.describe)('getMilestoneInfo', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-core-test-'));
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning'), { recursive: true });
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('extracts version and name from roadmap', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\n## Roadmap v1.2: My Cool Project\n\nSome content');
        const info = getMilestoneInfo(tmpDir);
        node_assert_1.default.strictEqual(info.version, 'v1.2');
        node_assert_1.default.strictEqual(info.name, 'My Cool Project');
    });
    (0, node_test_1.test)('returns defaults when roadmap missing', () => {
        const info = getMilestoneInfo(tmpDir);
        node_assert_1.default.strictEqual(info.version, 'v1.0');
        node_assert_1.default.strictEqual(info.name, 'milestone');
    });
    (0, node_test_1.test)('returns active milestone when shipped milestone is collapsed in details block', () => {
        const roadmap = [
            '# Milestones',
            '',
            '| Version | Status |',
            '|---------|--------|',
            '| v0.1    | Shipped |',
            '| v0.2    | Active |',
            '',
            '<details>',
            '<summary>v0.1 — Legacy Feature Parity (Shipped)</summary>',
            '',
            '## Roadmap v0.1: Legacy Feature Parity',
            '',
            '### Phase 1: Core Setup',
            'Some content about phase 1',
            '',
            '</details>',
            '',
            '## Roadmap v0.2: Dashboard Overhaul',
            '',
            '### Phase 8: New Dashboard Layout',
            'Some content about phase 8',
        ].join('\n');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), roadmap);
        const info = getMilestoneInfo(tmpDir);
        node_assert_1.default.strictEqual(info.version, 'v0.2');
        node_assert_1.default.strictEqual(info.name, 'Dashboard Overhaul');
    });
    (0, node_test_1.test)('returns active milestone when multiple shipped milestones exist in details blocks', () => {
        const roadmap = [
            '# Milestones',
            '',
            '| Version | Status |',
            '|---------|--------|',
            '| v0.1    | Shipped |',
            '| v0.2    | Shipped |',
            '| v0.3    | Active |',
            '',
            '<details>',
            '<summary>v0.1 — Initial Release (Shipped)</summary>',
            '',
            '## Roadmap v0.1: Initial Release',
            '',
            '</details>',
            '',
            '<details>',
            '<summary>v0.2 — Feature Expansion (Shipped)</summary>',
            '',
            '## Roadmap v0.2: Feature Expansion',
            '',
            '</details>',
            '',
            '## Roadmap v0.3: Performance Tuning',
            '',
            '### Phase 12: Optimize Queries',
        ].join('\n');
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), roadmap);
        const info = getMilestoneInfo(tmpDir);
        node_assert_1.default.strictEqual(info.version, 'v0.3');
        node_assert_1.default.strictEqual(info.name, 'Performance Tuning');
    });
    (0, node_test_1.test)('returns defaults when roadmap has no heading matches', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\nSome content without version headings');
        const info = getMilestoneInfo(tmpDir);
        node_assert_1.default.strictEqual(info.version, 'v1.0');
        node_assert_1.default.strictEqual(info.name, 'milestone');
    });
});
// ─── searchPhaseInDir ──────────────────────────────────────────────────────────
(0, node_test_1.describe)('searchPhaseInDir', () => {
    let tmpDir;
    let phasesDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-core-test-'));
        phasesDir = path_1.default.join(tmpDir, 'phases');
        fs_1.default.mkdirSync(phasesDir, { recursive: true });
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('finds phase directory by normalized prefix', () => {
        fs_1.default.mkdirSync(path_1.default.join(phasesDir, '01-foundation'));
        const result = searchPhaseInDir(phasesDir, '.planning/phases', '01');
        node_assert_1.default.strictEqual(result.found, true);
        node_assert_1.default.strictEqual(result.phase_number, '01');
        node_assert_1.default.strictEqual(result.phase_name, 'foundation');
    });
    (0, node_test_1.test)('returns plans and summaries', () => {
        const phaseDir = path_1.default.join(phasesDir, '01-foundation');
        fs_1.default.mkdirSync(phaseDir);
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-PLAN.md'), '# Plan');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), '# Summary');
        const result = searchPhaseInDir(phasesDir, '.planning/phases', '01');
        node_assert_1.default.ok(result.plans.includes('01-01-PLAN.md'));
        node_assert_1.default.ok(result.summaries.includes('01-01-SUMMARY.md'));
        node_assert_1.default.strictEqual(result.incomplete_plans.length, 0);
    });
    (0, node_test_1.test)('identifies incomplete plans', () => {
        const phaseDir = path_1.default.join(phasesDir, '01-foundation');
        fs_1.default.mkdirSync(phaseDir);
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-PLAN.md'), '# Plan 1');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-02-PLAN.md'), '# Plan 2');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-01-SUMMARY.md'), '# Summary 1');
        const result = searchPhaseInDir(phasesDir, '.planning/phases', '01');
        node_assert_1.default.strictEqual(result.incomplete_plans.length, 1);
        node_assert_1.default.ok(result.incomplete_plans.includes('01-02-PLAN.md'));
    });
    (0, node_test_1.test)('detects research and context files', () => {
        const phaseDir = path_1.default.join(phasesDir, '01-foundation');
        fs_1.default.mkdirSync(phaseDir);
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-RESEARCH.md'), '# Research');
        fs_1.default.writeFileSync(path_1.default.join(phaseDir, '01-CONTEXT.md'), '# Context');
        const result = searchPhaseInDir(phasesDir, '.planning/phases', '01');
        node_assert_1.default.strictEqual(result.has_research, true);
        node_assert_1.default.strictEqual(result.has_context, true);
    });
    (0, node_test_1.test)('returns null when phase not found', () => {
        fs_1.default.mkdirSync(path_1.default.join(phasesDir, '01-foundation'));
        const result = searchPhaseInDir(phasesDir, '.planning/phases', '99');
        node_assert_1.default.strictEqual(result, null);
    });
    (0, node_test_1.test)('generates phase_slug from directory name', () => {
        fs_1.default.mkdirSync(path_1.default.join(phasesDir, '01-core-cjs-tests'));
        const result = searchPhaseInDir(phasesDir, '.planning/phases', '01');
        node_assert_1.default.strictEqual(result.phase_slug, 'core-cjs-tests');
    });
});
// ─── findPhaseInternal ─────────────────────────────────────────────────────────
(0, node_test_1.describe)('findPhaseInternal', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-core-test-'));
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases'), { recursive: true });
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('finds phase in current phases directory', () => {
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', '01-foundation'));
        const result = findPhaseInternal(tmpDir, '1');
        node_assert_1.default.strictEqual(result.found, true);
        node_assert_1.default.strictEqual(result.phase_number, '01');
    });
    (0, node_test_1.test)('returns null for non-existent phase', () => {
        const result = findPhaseInternal(tmpDir, '99');
        node_assert_1.default.strictEqual(result, null);
    });
    (0, node_test_1.test)('returns null for null phase', () => {
        const result = findPhaseInternal(tmpDir, null);
        node_assert_1.default.strictEqual(result, null);
    });
    (0, node_test_1.test)('searches archived milestones when not in current', () => {
        // Create archived milestone structure (no current phase match)
        const archiveDir = path_1.default.join(tmpDir, '.planning', 'milestones', 'v1.0-phases', '01-foundation');
        fs_1.default.mkdirSync(archiveDir, { recursive: true });
        const result = findPhaseInternal(tmpDir, '1');
        node_assert_1.default.strictEqual(result.found, true);
        node_assert_1.default.strictEqual(result.archived, 'v1.0');
    });
});
// ─── getRoadmapPhaseInternal ───────────────────────────────────────────────────
(0, node_test_1.describe)('getRoadmapPhaseInternal', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-core-test-'));
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning'), { recursive: true });
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    // Bug: getRoadmapPhaseInternal was missing from module.exports
    (0, node_test_1.test)('is exported from core.cjs (REG-02)', () => {
        node_assert_1.default.strictEqual(typeof getRoadmapPhaseInternal, 'function');
        // Also verify it works with a real roadmap (note: goal regex expects **Goal:** with colon inside bold)
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '### Phase 1: Foundation\n**Goal:** Build the base\n');
        const result = getRoadmapPhaseInternal(tmpDir, '1');
        node_assert_1.default.strictEqual(result.found, true);
        node_assert_1.default.strictEqual(result.phase_name, 'Foundation');
        node_assert_1.default.strictEqual(result.goal, 'Build the base');
    });
    (0, node_test_1.test)('extracts phase name and goal from roadmap', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '### Phase 2: API Layer\n**Goal:** Create REST endpoints\n**Depends on**: Phase 1\n');
        const result = getRoadmapPhaseInternal(tmpDir, '2');
        node_assert_1.default.strictEqual(result.phase_name, 'API Layer');
        node_assert_1.default.strictEqual(result.goal, 'Create REST endpoints');
    });
    (0, node_test_1.test)('returns goal when Goal uses colon-outside-bold format', () => {
        // **Goal**: (colon outside bold) is now supported alongside **Goal:**
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '### Phase 1: Foundation\n**Goal**: Build the base\n');
        const result = getRoadmapPhaseInternal(tmpDir, '1');
        node_assert_1.default.strictEqual(result.found, true);
        node_assert_1.default.strictEqual(result.phase_name, 'Foundation');
        node_assert_1.default.strictEqual(result.goal, 'Build the base');
    });
    (0, node_test_1.test)('returns null when roadmap missing', () => {
        const result = getRoadmapPhaseInternal(tmpDir, '1');
        node_assert_1.default.strictEqual(result, null);
    });
    (0, node_test_1.test)('returns null when phase not in roadmap', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '### Phase 1: Foundation\n**Goal**: Build the base\n');
        const result = getRoadmapPhaseInternal(tmpDir, '99');
        node_assert_1.default.strictEqual(result, null);
    });
    (0, node_test_1.test)('returns null for null phase number', () => {
        const result = getRoadmapPhaseInternal(tmpDir, null);
        node_assert_1.default.strictEqual(result, null);
    });
    (0, node_test_1.test)('extracts full section text', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '### Phase 1: Foundation\n**Goal**: Build the base\n**Requirements**: TEST-01\nSome details here\n\n### Phase 2: API\n**Goal**: REST\n');
        const result = getRoadmapPhaseInternal(tmpDir, '1');
        node_assert_1.default.ok(result.section.includes('Phase 1: Foundation'));
        node_assert_1.default.ok(result.section.includes('Some details here'));
        // Should not include Phase 2 content
        node_assert_1.default.ok(!result.section.includes('Phase 2: API'));
    });
});
// ─── getMilestonePhaseFilter ────────────────────────────────────────────────────
(0, node_test_1.describe)('getMilestonePhaseFilter', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-core-test-'));
        fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases'), { recursive: true });
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('filters directories to only current milestone phases', () => {
        // ROADMAP lists only phases 5-7
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), [
            '## Roadmap v2.0: Next Release',
            '',
            '### Phase 5: Auth',
            '**Goal:** Add authentication',
            '',
            '### Phase 6: Dashboard',
            '**Goal:** Build dashboard',
            '',
            '### Phase 7: Polish',
            '**Goal:** Final polish',
        ].join('\n'));
        // Create phase dirs 1-7 on disk (leftover from previous milestones)
        for (let i = 1; i <= 7; i++) {
            const padded = String(i).padStart(2, '0');
            fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases', `${padded}-phase-${i}`));
        }
        const filter = getMilestonePhaseFilter(tmpDir);
        // Only phases 5, 6, 7 should match
        node_assert_1.default.strictEqual(filter('05-auth'), true);
        node_assert_1.default.strictEqual(filter('06-dashboard'), true);
        node_assert_1.default.strictEqual(filter('07-polish'), true);
        // Phases 1-4 should NOT match
        node_assert_1.default.strictEqual(filter('01-phase-1'), false);
        node_assert_1.default.strictEqual(filter('02-phase-2'), false);
        node_assert_1.default.strictEqual(filter('03-phase-3'), false);
        node_assert_1.default.strictEqual(filter('04-phase-4'), false);
    });
    (0, node_test_1.test)('returns pass-all filter when ROADMAP.md is missing', () => {
        const filter = getMilestonePhaseFilter(tmpDir);
        node_assert_1.default.strictEqual(filter('01-foundation'), true);
        node_assert_1.default.strictEqual(filter('99-anything'), true);
    });
    (0, node_test_1.test)('returns pass-all filter when ROADMAP has no phase headings', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\nSome content without phases.\n');
        const filter = getMilestonePhaseFilter(tmpDir);
        node_assert_1.default.strictEqual(filter('01-foundation'), true);
        node_assert_1.default.strictEqual(filter('05-api'), true);
    });
    (0, node_test_1.test)('handles letter-suffix phases (e.g. 3A)', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '### Phase 3A: Sub-feature\n**Goal:** Sub work\n');
        const filter = getMilestonePhaseFilter(tmpDir);
        node_assert_1.default.strictEqual(filter('03A-sub-feature'), true);
        node_assert_1.default.strictEqual(filter('03-main'), false);
        node_assert_1.default.strictEqual(filter('04-other'), false);
    });
    (0, node_test_1.test)('handles decimal phases (e.g. 5.1)', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '### Phase 5: Main\n**Goal:** Main work\n\n### Phase 5.1: Patch\n**Goal:** Patch work\n');
        const filter = getMilestonePhaseFilter(tmpDir);
        node_assert_1.default.strictEqual(filter('05-main'), true);
        node_assert_1.default.strictEqual(filter('05.1-patch'), true);
        node_assert_1.default.strictEqual(filter('04-other'), false);
    });
    (0, node_test_1.test)('returns false for non-phase directory names', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '### Phase 1: Init\n**Goal:** Start\n');
        const filter = getMilestonePhaseFilter(tmpDir);
        node_assert_1.default.strictEqual(filter('not-a-phase'), false);
        node_assert_1.default.strictEqual(filter('.gitkeep'), false);
    });
    (0, node_test_1.test)('phaseCount reflects ROADMAP phase count', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '### Phase 5: Auth\n### Phase 6: Dashboard\n### Phase 7: Polish\n');
        const filter = getMilestonePhaseFilter(tmpDir);
        node_assert_1.default.strictEqual(filter.phaseCount, 3);
    });
    (0, node_test_1.test)('phaseCount is 0 when ROADMAP is missing', () => {
        const filter = getMilestonePhaseFilter(tmpDir);
        node_assert_1.default.strictEqual(filter.phaseCount, 0);
    });
    (0, node_test_1.test)('phaseCount is 0 when ROADMAP has no phase headings', () => {
        fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'ROADMAP.md'), '# Roadmap\n\nSome content.\n');
        const filter = getMilestonePhaseFilter(tmpDir);
        node_assert_1.default.strictEqual(filter.phaseCount, 0);
    });
});
//# sourceMappingURL=core.test.cjs.map