"use strict";
/**
 * Vector Tools Tests - Gemini agent conversion
 *
 * Verifies Gemini-specific agent frontmatter conversion removes
 * unsupported fields while preserving converted tools and body text.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.VECTOR_TEST_MODE = '1';
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const { convertClaudeToGeminiAgent } = require('../bin/install.cjs');
(0, node_test_1.describe)('convertClaudeToGeminiAgent', () => {
    (0, node_test_1.test)('drops unsupported skills frontmatter while keeping converted tools', () => {
        const input = `---
name: vector-codebase-mapper
description: Explores codebase and writes structured analysis documents.
tools: Read, Bash, Grep, Glob, Write
color: cyan
skills:
  - vector-mapper-workflow
---

<role>
Use \${PHASE} in shell examples.
</role>`;
        const result = convertClaudeToGeminiAgent(input);
        const frontmatter = result.split('---')[1] || '';
        node_assert_1.default.ok(frontmatter.includes('name: vector-codebase-mapper'), 'keeps name');
        node_assert_1.default.ok(frontmatter.includes('description: Explores codebase and writes structured analysis documents.'), 'keeps description');
        node_assert_1.default.ok(frontmatter.includes('tools:'), 'adds Gemini tools array');
        node_assert_1.default.ok(frontmatter.includes('  - read_file'), 'maps Read -> read_file');
        node_assert_1.default.ok(frontmatter.includes('  - run_shell_command'), 'maps Bash -> run_shell_command');
        node_assert_1.default.ok(frontmatter.includes('  - search_file_content'), 'maps Grep -> search_file_content');
        node_assert_1.default.ok(frontmatter.includes('  - glob'), 'maps Glob -> glob');
        node_assert_1.default.ok(frontmatter.includes('  - write_file'), 'maps Write -> write_file');
        node_assert_1.default.ok(!frontmatter.includes('color:'), 'drops unsupported color field');
        node_assert_1.default.ok(!frontmatter.includes('skills:'), 'drops unsupported skills field');
        node_assert_1.default.ok(!frontmatter.includes('vector-mapper-workflow'), 'drops skills list items');
        node_assert_1.default.ok(result.includes('$PHASE'), 'escapes ${PHASE} shell variable for Gemini');
        node_assert_1.default.ok(!result.includes('${PHASE}'), 'removes Gemini template-string pattern');
    });
});
//# sourceMappingURL=gemini-config.test.cjs.map