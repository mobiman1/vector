"use strict";
/**
 * OpenCode Agent Frontmatter Conversion Tests
 *
 * Validates that convertClaudeToOpencodeFrontmatter correctly converts
 * agent frontmatter for OpenCode compatibility when isAgent: true.
 *
 * Bug: Without isAgent flag, the function strips name: (agents need it),
 * keeps color:/skills:/tools: record (should strip), and doesn't add
 * model: inherit / mode: subagent (required by OpenCode agents).
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
process.env.VECTOR_TEST_MODE = '1';
const { convertClaudeToOpencodeFrontmatter } = require('../bin/install.cjs');
// Sample Claude agent frontmatter (matches actual Vector agent format)
const SAMPLE_AGENT = `---
name: vector-executor
description: Executes Vector plans with atomic commits
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
skills:
  - vector-executor-workflow
# hooks:
#   PostToolUse:
#     - matcher: "Write|Edit"
#       hooks:
#         - type: command
#           command: "npx eslint --fix $FILE 2>/dev/null || true"
---

<role>
You are a Vector plan executor.
</role>`;
// Sample Claude command frontmatter (for comparison — commands work differently)
const SAMPLE_COMMAND = `---
name: vector-execute-phase
description: Execute all plans in a phase
allowed-tools:
  - Read
  - Write
  - Bash
---

Execute the phase plan.`;
(0, node_test_1.describe)('OpenCode agent conversion (isAgent: true)', () => {
    (0, node_test_1.test)('keeps name: field for agents', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_AGENT, { isAgent: true });
        const frontmatter = result.split('---')[1];
        node_assert_1.default.ok(frontmatter.includes('name: vector-executor'), 'name: should be preserved for agents');
    });
    (0, node_test_1.test)('adds model: inherit', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_AGENT, { isAgent: true });
        const frontmatter = result.split('---')[1];
        node_assert_1.default.ok(frontmatter.includes('model: inherit'), 'model: inherit should be added');
    });
    (0, node_test_1.test)('adds mode: subagent', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_AGENT, { isAgent: true });
        const frontmatter = result.split('---')[1];
        node_assert_1.default.ok(frontmatter.includes('mode: subagent'), 'mode: subagent should be added');
    });
    (0, node_test_1.test)('strips tools: field', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_AGENT, { isAgent: true });
        const frontmatter = result.split('---')[1];
        node_assert_1.default.ok(!frontmatter.includes('tools:'), 'tools: should be stripped for agents');
        node_assert_1.default.ok(!frontmatter.includes('read: true'), 'tools object should not be generated');
    });
    (0, node_test_1.test)('strips skills: array', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_AGENT, { isAgent: true });
        const frontmatter = result.split('---')[1];
        node_assert_1.default.ok(!frontmatter.includes('skills:'), 'skills: should be stripped');
        node_assert_1.default.ok(!frontmatter.includes('vector-executor-workflow'), 'skill entries should be stripped');
    });
    (0, node_test_1.test)('strips color: field', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_AGENT, { isAgent: true });
        const frontmatter = result.split('---')[1];
        node_assert_1.default.ok(!frontmatter.includes('color:'), 'color: should be stripped for agents');
    });
    (0, node_test_1.test)('strips commented hooks block', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_AGENT, { isAgent: true });
        const frontmatter = result.split('---')[1];
        node_assert_1.default.ok(!frontmatter.includes('# hooks:'), 'commented hooks should be stripped');
        node_assert_1.default.ok(!frontmatter.includes('PostToolUse'), 'hook content should be stripped');
    });
    (0, node_test_1.test)('keeps description: field', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_AGENT, { isAgent: true });
        const frontmatter = result.split('---')[1];
        node_assert_1.default.ok(frontmatter.includes('description: Executes Vector plans'), 'description should be kept');
    });
    (0, node_test_1.test)('preserves body content', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_AGENT, { isAgent: true });
        node_assert_1.default.ok(result.includes('<role>'), 'body should be preserved');
        node_assert_1.default.ok(result.includes('You are a Vector plan executor.'), 'body content should be intact');
    });
    (0, node_test_1.test)('applies body text replacements', () => {
        const agentWithClaudePaths = `---
name: test-agent
description: Test
tools: Read
---

Read ~/.claude/agent-memory/ for context.
Use $HOME/.claude/skills/ for reference.`;
        const result = convertClaudeToOpencodeFrontmatter(agentWithClaudePaths, { isAgent: true });
        node_assert_1.default.ok(result.includes('~/.config/opencode/agent-memory/'), '~/.claude should be replaced');
        node_assert_1.default.ok(result.includes('$HOME/.config/opencode/skills/'), '$HOME/.claude should be replaced');
    });
});
(0, node_test_1.describe)('OpenCode command conversion (isAgent: false, default)', () => {
    (0, node_test_1.test)('strips name: field for commands', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_COMMAND);
        const frontmatter = result.split('---')[1];
        node_assert_1.default.ok(!frontmatter.includes('name:'), 'name: should be stripped for commands');
    });
    (0, node_test_1.test)('does not add model: or mode: for commands', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_COMMAND);
        const frontmatter = result.split('---')[1];
        node_assert_1.default.ok(!frontmatter.includes('model:'), 'model: should not be added for commands');
        node_assert_1.default.ok(!frontmatter.includes('mode:'), 'mode: should not be added for commands');
    });
    (0, node_test_1.test)('keeps description: for commands', () => {
        const result = convertClaudeToOpencodeFrontmatter(SAMPLE_COMMAND);
        const frontmatter = result.split('---')[1];
        node_assert_1.default.ok(frontmatter.includes('description:'), 'description should be kept');
    });
});
//# sourceMappingURL=opencode-agent-conversion.test.cjs.map