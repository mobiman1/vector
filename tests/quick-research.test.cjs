"use strict";
/**
 * Vector Quick Research Flag Tests
 *
 * Validates the --research flag for /vector:quick:
 * - Command frontmatter advertises --research
 * - Workflow includes research step (Step 4.75)
 * - Research artifacts work within quick task directories
 * - Workflow spawns vector-phase-researcher for research
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
const COMMANDS_DIR = path_1.default.join(__dirname, '..', 'commands', 'vector');
const WORKFLOWS_DIR = path_1.default.join(__dirname, '..', 'core', 'workflows');
// ─────────────────────────────────────────────────────────────────────────────
// Command frontmatter: --research flag advertised
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('quick command: --research in frontmatter', () => {
    const commandPath = path_1.default.join(COMMANDS_DIR, 'quick.md');
    let content;
    (0, node_test_1.test)('quick.md exists', () => {
        node_assert_1.default.ok(fs_1.default.existsSync(commandPath), 'commands/vector/quick.md should exist');
    });
    (0, node_test_1.test)('argument-hint includes --research', () => {
        content = fs_1.default.readFileSync(commandPath, 'utf-8');
        node_assert_1.default.ok(content.includes('--research'), 'quick.md argument-hint should mention --research');
    });
    (0, node_test_1.test)('argument-hint includes all three flags', () => {
        content = fs_1.default.readFileSync(commandPath, 'utf-8');
        const hintLine = content.split('\n').find((l) => l.includes('argument-hint'));
        node_assert_1.default.ok(hintLine, 'should have argument-hint line');
        node_assert_1.default.ok(hintLine.includes('--full'), 'argument-hint should include --full');
        node_assert_1.default.ok(hintLine.includes('--discuss'), 'argument-hint should include --discuss');
        node_assert_1.default.ok(hintLine.includes('--research'), 'argument-hint should include --research');
    });
    (0, node_test_1.test)('objective section describes --research flag', () => {
        content = fs_1.default.readFileSync(commandPath, 'utf-8');
        const objectiveMatch = content.match(/<objective>([\s\S]*?)<\/objective>/);
        node_assert_1.default.ok(objectiveMatch, 'should have <objective> section');
        node_assert_1.default.ok(objectiveMatch[1].includes('--research'), 'objective should describe --research flag');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// Workflow: research step present and correct
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('quick workflow: research step', () => {
    const workflowPath = path_1.default.join(WORKFLOWS_DIR, 'quick.md');
    let content;
    (0, node_test_1.test)('workflow file exists', () => {
        node_assert_1.default.ok(fs_1.default.existsSync(workflowPath), 'workflows/quick.md should exist');
        content = fs_1.default.readFileSync(workflowPath, 'utf-8');
    });
    (0, node_test_1.test)('purpose mentions --research flag', () => {
        content = fs_1.default.readFileSync(workflowPath, 'utf-8');
        const purposeMatch = content.match(/<purpose>([\s\S]*?)<\/purpose>/);
        node_assert_1.default.ok(purposeMatch, 'should have <purpose> section');
        node_assert_1.default.ok(purposeMatch[1].includes('--research'), 'purpose should mention --research flag');
    });
    (0, node_test_1.test)('step 1 parses --research flag', () => {
        content = fs_1.default.readFileSync(workflowPath, 'utf-8');
        node_assert_1.default.ok(content.includes('$RESEARCH_MODE'), 'workflow should reference $RESEARCH_MODE variable');
    });
    (0, node_test_1.test)('step 4.75 research phase exists', () => {
        content = fs_1.default.readFileSync(workflowPath, 'utf-8');
        node_assert_1.default.ok(content.includes('Step 4.75'), 'workflow should contain Step 4.75 (research phase)');
    });
    (0, node_test_1.test)('research step spawns vector-phase-researcher', () => {
        content = fs_1.default.readFileSync(workflowPath, 'utf-8');
        const researchSection = content.substring(content.indexOf('Step 4.75'), content.indexOf('Step 5:'));
        node_assert_1.default.ok(researchSection.includes('subagent_type="vector-phase-researcher"'), 'research step should spawn vector-phase-researcher agent');
    });
    (0, node_test_1.test)('research step writes RESEARCH.md', () => {
        content = fs_1.default.readFileSync(workflowPath, 'utf-8');
        const researchSection = content.substring(content.indexOf('Step 4.75'), content.indexOf('Step 5:'));
        node_assert_1.default.ok(researchSection.includes('RESEARCH.md'), 'research step should reference RESEARCH.md output file');
    });
    (0, node_test_1.test)('planner context includes RESEARCH.md when research mode', () => {
        content = fs_1.default.readFileSync(workflowPath, 'utf-8');
        const plannerSection = content.substring(content.indexOf('Step 5: Spawn planner'), content.indexOf('Step 5.5'));
        node_assert_1.default.ok(plannerSection.includes('RESEARCH_MODE') && plannerSection.includes('RESEARCH.md'), 'planner should read RESEARCH.md when $RESEARCH_MODE is true');
    });
    (0, node_test_1.test)('file commit list includes RESEARCH.md', () => {
        content = fs_1.default.readFileSync(workflowPath, 'utf-8');
        const commitSection = content.substring(content.indexOf('Step 8:'), content.indexOf('</process>'));
        node_assert_1.default.ok(commitSection.includes('RESEARCH_MODE') && commitSection.includes('RESEARCH.md'), 'commit step should include RESEARCH.md when research mode is active');
    });
    (0, node_test_1.test)('success criteria includes research items', () => {
        content = fs_1.default.readFileSync(workflowPath, 'utf-8');
        const criteriaMatch = content.match(/<success_criteria>([\s\S]*?)<\/success_criteria>/);
        node_assert_1.default.ok(criteriaMatch, 'should have <success_criteria> section');
        node_assert_1.default.ok(criteriaMatch[1].includes('--research'), 'success criteria should mention --research flag');
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// Quick task directory: RESEARCH.md file management
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('quick task: research file in task directory', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('init quick returns valid task_dir for research file placement', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('init quick "Add caching layer"', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.ok(output.task_dir, 'task_dir should be non-null');
        node_assert_1.default.ok(output.task_dir.startsWith('.planning/quick/'), 'task_dir should be under .planning/quick/');
        const expectedResearchPath = path_1.default.join(output.task_dir, `${output.next_num}-RESEARCH.md`);
        node_assert_1.default.ok(expectedResearchPath.endsWith('-RESEARCH.md'), 'research path should end with -RESEARCH.md');
    });
    (0, node_test_1.test)('verify-path-exists detects RESEARCH.md in quick task directory', () => {
        const quickTaskDir = path_1.default.join(tmpDir, '.planning', 'quick', '1-test-task');
        fs_1.default.mkdirSync(quickTaskDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(quickTaskDir, '1-RESEARCH.md'), '# Research\n\nFindings for test task.\n');
        const result = (0, helpers_cjs_1.runGsdTools)('verify-path-exists .planning/quick/1-test-task/1-RESEARCH.md', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.exists, true, 'RESEARCH.md should be detected');
        node_assert_1.default.strictEqual(output.type, 'file', 'should be detected as file');
    });
    (0, node_test_1.test)('verify-path-exists returns false for missing RESEARCH.md', () => {
        const quickTaskDir = path_1.default.join(tmpDir, '.planning', 'quick', '1-test-task');
        fs_1.default.mkdirSync(quickTaskDir, { recursive: true });
        const result = (0, helpers_cjs_1.runGsdTools)('verify-path-exists .planning/quick/1-test-task/1-RESEARCH.md', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.exists, false, 'missing RESEARCH.md should return false');
    });
    (0, node_test_1.test)('quick task directory supports all research workflow artifacts', () => {
        const quickTaskDir = path_1.default.join(tmpDir, '.planning', 'quick', '1-add-caching');
        fs_1.default.mkdirSync(quickTaskDir, { recursive: true });
        const artifacts = [
            '1-CONTEXT.md',
            '1-RESEARCH.md',
            '1-PLAN.md',
            '1-SUMMARY.md',
            '1-VERIFICATION.md',
        ];
        for (const artifact of artifacts) {
            fs_1.default.writeFileSync(path_1.default.join(quickTaskDir, artifact), `# ${artifact}\n`);
        }
        for (const artifact of artifacts) {
            const result = (0, helpers_cjs_1.runGsdTools)(`verify-path-exists .planning/quick/1-add-caching/${artifact}`, tmpDir);
            node_assert_1.default.ok(result.success, `Command failed for ${artifact}: ${result.error}`);
            const output = JSON.parse(result.output);
            node_assert_1.default.strictEqual(output.exists, true, `${artifact} should exist in quick task directory`);
        }
    });
});
// ─────────────────────────────────────────────────────────────────────────────
// Flag composability: banner variants in workflow
// ─────────────────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('quick workflow: banner variants for flag combinations', () => {
    let content;
    (0, node_test_1.test)('has banner for research-only mode', () => {
        content = fs_1.default.readFileSync(path_1.default.join(WORKFLOWS_DIR, 'quick.md'), 'utf-8');
        node_assert_1.default.ok(content.includes('QUICK TASK (RESEARCH)'), 'should have banner for --research only');
    });
    (0, node_test_1.test)('has banner for discuss + research mode', () => {
        content = fs_1.default.readFileSync(path_1.default.join(WORKFLOWS_DIR, 'quick.md'), 'utf-8');
        node_assert_1.default.ok(content.includes('DISCUSS + RESEARCH)'), 'should have banner for --discuss --research');
    });
    (0, node_test_1.test)('has banner for research + full mode', () => {
        content = fs_1.default.readFileSync(path_1.default.join(WORKFLOWS_DIR, 'quick.md'), 'utf-8');
        node_assert_1.default.ok(content.includes('RESEARCH + FULL)'), 'should have banner for --research --full');
    });
    (0, node_test_1.test)('has banner for all three flags', () => {
        content = fs_1.default.readFileSync(path_1.default.join(WORKFLOWS_DIR, 'quick.md'), 'utf-8');
        node_assert_1.default.ok(content.includes('DISCUSS + RESEARCH + FULL)'), 'should have banner for --discuss --research --full');
    });
});
//# sourceMappingURL=quick-research.test.cjs.map