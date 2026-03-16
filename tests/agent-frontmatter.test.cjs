"use strict";
/**
 * Vector Agent Frontmatter Tests
 *
 * Validates that all agent .md files have correct frontmatter fields:
 * - Anti-heredoc instruction present in file-writing agents
 * - skills: field absent from all agents (breaks Gemini CLI)
 * - Commented hooks: pattern in file-writing agents
 * - Spawn type consistency across workflows
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const AGENTS_DIR = path_1.default.join(__dirname, '..', 'agents');
const WORKFLOWS_DIR = path_1.default.join(__dirname, '..', 'core', 'workflows');
const COMMANDS_DIR = path_1.default.join(__dirname, '..', 'commands', 'vector');
const ALL_AGENTS = fs_1.default.readdirSync(AGENTS_DIR)
    .filter((f) => f.startsWith('vector-') && f.endsWith('.md'))
    .map((f) => f.replace('.md', ''));
const FILE_WRITING_AGENTS = ALL_AGENTS.filter(name => {
    const content = fs_1.default.readFileSync(path_1.default.join(AGENTS_DIR, name + '.md'), 'utf-8');
    const toolsMatch = content.match(/^tools:\s*(.+)$/m);
    return toolsMatch && toolsMatch[1].includes('Write');
});
const READ_ONLY_AGENTS = ALL_AGENTS.filter(name => !FILE_WRITING_AGENTS.includes(name));
// ─── Anti-Heredoc Instruction ────────────────────────────────────────────────
(0, node_test_1.describe)('HDOC: anti-heredoc instruction', () => {
    for (const agent of FILE_WRITING_AGENTS) {
        (0, node_test_1.test)(`${agent} has anti-heredoc instruction`, () => {
            const content = fs_1.default.readFileSync(path_1.default.join(AGENTS_DIR, agent + '.md'), 'utf-8');
            node_assert_1.default.ok(content.includes("never use `Bash(cat << 'EOF')` or heredoc"), `${agent} missing anti-heredoc instruction`);
        });
    }
    (0, node_test_1.test)('no active heredoc patterns in any agent file', () => {
        for (const agent of ALL_AGENTS) {
            const content = fs_1.default.readFileSync(path_1.default.join(AGENTS_DIR, agent + '.md'), 'utf-8');
            // Match actual heredoc commands (not references in anti-heredoc instruction)
            const lines = content.split('\n');
            for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                // Skip lines that are part of the anti-heredoc instruction or markdown code fences
                if (line.includes('never use') || line.includes('NEVER') || line.trim().startsWith('```'))
                    continue;
                // Check for actual heredoc usage instructions
                if (/^cat\s+<<\s*'?EOF'?\s*>/.test(line.trim())) {
                    node_assert_1.default.fail(`${agent}:${i + 1} has active heredoc pattern: ${line.trim()}`);
                }
            }
        }
    });
});
// ─── Skills Frontmatter ──────────────────────────────────────────────────────
(0, node_test_1.describe)('SKILL: skills frontmatter absent', () => {
    for (const agent of ALL_AGENTS) {
        (0, node_test_1.test)(`${agent} does not have skills: in frontmatter`, () => {
            const content = fs_1.default.readFileSync(path_1.default.join(AGENTS_DIR, agent + '.md'), 'utf-8');
            const frontmatter = content.split('---')[1] || '';
            node_assert_1.default.ok(!frontmatter.includes('skills:'), `${agent} has skills: in frontmatter — skills: breaks Gemini CLI and must be removed`);
        });
    }
});
// ─── Hooks Frontmatter ───────────────────────────────────────────────────────
(0, node_test_1.describe)('HOOK: hooks frontmatter pattern', () => {
    for (const agent of FILE_WRITING_AGENTS) {
        (0, node_test_1.test)(`${agent} has commented hooks pattern`, () => {
            const content = fs_1.default.readFileSync(path_1.default.join(AGENTS_DIR, agent + '.md'), 'utf-8');
            const frontmatter = content.split('---')[1] || '';
            node_assert_1.default.ok(frontmatter.includes('# hooks:'), `${agent} missing commented hooks: pattern in frontmatter`);
        });
    }
    for (const agent of READ_ONLY_AGENTS) {
        (0, node_test_1.test)(`${agent} (read-only) does not need hooks`, () => {
            const content = fs_1.default.readFileSync(path_1.default.join(AGENTS_DIR, agent + '.md'), 'utf-8');
            const frontmatter = content.split('---')[1] || '';
            // Read-only agents may or may not have hooks — just verify they parse
            node_assert_1.default.ok(frontmatter.includes('name:'), `${agent} has valid frontmatter`);
        });
    }
});
// ─── Spawn Type Consistency ──────────────────────────────────────────────────
(0, node_test_1.describe)('SPAWN: spawn type consistency', () => {
    (0, node_test_1.test)('no "First, read agent .md" workaround pattern remains', () => {
        const dirs = [WORKFLOWS_DIR, COMMANDS_DIR];
        for (const dir of dirs) {
            if (!fs_1.default.existsSync(dir))
                continue;
            const files = fs_1.default.readdirSync(dir).filter((f) => f.endsWith('.md'));
            for (const file of files) {
                const content = fs_1.default.readFileSync(path_1.default.join(dir, file), 'utf-8');
                const hasWorkaround = content.includes('First, read ~/.claude/agents/vector-');
                node_assert_1.default.ok(!hasWorkaround, `${file} still has "First, read agent .md" workaround — use named subagent_type instead`);
            }
        }
    });
    (0, node_test_1.test)('named agent spawns use correct agent names', () => {
        const validAgentTypes = new Set([
            ...ALL_AGENTS,
            'general-purpose', // Allowed for orchestrator spawns
        ]);
        const dirs = [WORKFLOWS_DIR, COMMANDS_DIR];
        for (const dir of dirs) {
            if (!fs_1.default.existsSync(dir))
                continue;
            const files = fs_1.default.readdirSync(dir).filter((f) => f.endsWith('.md'));
            for (const file of files) {
                const content = fs_1.default.readFileSync(path_1.default.join(dir, file), 'utf-8');
                const matches = content.matchAll(/subagent_type="([^"]+)"/g);
                for (const match of matches) {
                    const agentType = match[1];
                    node_assert_1.default.ok(validAgentTypes.has(agentType), `${file} references unknown agent type: ${agentType}`);
                }
            }
        }
    });
    (0, node_test_1.test)('diagnose-issues uses vector-debugger (not general-purpose)', () => {
        const content = fs_1.default.readFileSync(path_1.default.join(WORKFLOWS_DIR, 'diagnose-issues.md'), 'utf-8');
        node_assert_1.default.ok(content.includes('subagent_type="vector-debugger"'), 'diagnose-issues should spawn vector-debugger, not general-purpose');
    });
});
// ─── Required Frontmatter Fields ─────────────────────────────────────────────
(0, node_test_1.describe)('AGENT: required frontmatter fields', () => {
    for (const agent of ALL_AGENTS) {
        (0, node_test_1.test)(`${agent} has name, description, tools, color`, () => {
            const content = fs_1.default.readFileSync(path_1.default.join(AGENTS_DIR, agent + '.md'), 'utf-8');
            const frontmatter = content.split('---')[1] || '';
            node_assert_1.default.ok(frontmatter.includes('name:'), `${agent} missing name:`);
            node_assert_1.default.ok(frontmatter.includes('description:'), `${agent} missing description:`);
            node_assert_1.default.ok(frontmatter.includes('tools:'), `${agent} missing tools:`);
            node_assert_1.default.ok(frontmatter.includes('color:'), `${agent} missing color:`);
        });
    }
});
//# sourceMappingURL=agent-frontmatter.test.cjs.map