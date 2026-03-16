"use strict";
/**
 * Vector Tools Tests - Antigravity Install Plumbing
 *
 * Tests for Antigravity runtime directory resolution, config paths,
 * content conversion functions, and integration with the multi-runtime installer.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
process.env.VECTOR_TEST_MODE = '1';
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_1 = __importDefault(require("fs"));
const { getDirName, getGlobalDir, getConfigDirFromHome, convertClaudeToAntigravityContent, convertClaudeCommandToAntigravitySkill, convertClaudeAgentToAntigravityAgent, copyCommandsAsAntigravitySkills, writeManifest, } = require('../bin/install.cjs');
// ─── getDirName ─────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('getDirName (Antigravity)', () => {
    (0, node_test_1.test)('returns .agent for antigravity', () => {
        node_assert_1.default.strictEqual(getDirName('antigravity'), '.agent');
    });
    (0, node_test_1.test)('does not break existing runtimes', () => {
        node_assert_1.default.strictEqual(getDirName('claude'), '.claude');
        node_assert_1.default.strictEqual(getDirName('opencode'), '.opencode');
        node_assert_1.default.strictEqual(getDirName('gemini'), '.gemini');
        node_assert_1.default.strictEqual(getDirName('codex'), '.codex');
        node_assert_1.default.strictEqual(getDirName('copilot'), '.github');
    });
});
// ─── getGlobalDir ───────────────────────────────────────────────────────────────
(0, node_test_1.describe)('getGlobalDir (Antigravity)', () => {
    let savedEnv;
    (0, node_test_1.beforeEach)(() => {
        savedEnv = process.env.ANTIGRAVITY_CONFIG_DIR;
        delete process.env.ANTIGRAVITY_CONFIG_DIR;
    });
    (0, node_test_1.afterEach)(() => {
        if (savedEnv !== undefined) {
            process.env.ANTIGRAVITY_CONFIG_DIR = savedEnv;
        }
        else {
            delete process.env.ANTIGRAVITY_CONFIG_DIR;
        }
    });
    (0, node_test_1.test)('returns ~/.gemini/antigravity by default', () => {
        const result = getGlobalDir('antigravity');
        node_assert_1.default.strictEqual(result, path_1.default.join(os_1.default.homedir(), '.gemini', 'antigravity'));
    });
    (0, node_test_1.test)('respects ANTIGRAVITY_CONFIG_DIR env var', () => {
        const customDir = path_1.default.join(os_1.default.homedir(), 'custom-ag');
        process.env.ANTIGRAVITY_CONFIG_DIR = customDir;
        const result = getGlobalDir('antigravity');
        node_assert_1.default.strictEqual(result, customDir);
    });
    (0, node_test_1.test)('explicit config-dir overrides env var', () => {
        process.env.ANTIGRAVITY_CONFIG_DIR = path_1.default.join(os_1.default.homedir(), 'from-env');
        const explicit = path_1.default.join(os_1.default.homedir(), 'explicit-ag');
        const result = getGlobalDir('antigravity', explicit);
        node_assert_1.default.strictEqual(result, explicit);
    });
    (0, node_test_1.test)('does not change Claude Code global dir', () => {
        node_assert_1.default.strictEqual(getGlobalDir('claude'), path_1.default.join(os_1.default.homedir(), '.claude'));
    });
});
// ─── getConfigDirFromHome ───────────────────────────────────────────────────────
(0, node_test_1.describe)('getConfigDirFromHome (Antigravity)', () => {
    (0, node_test_1.test)('returns .agent for local installs', () => {
        node_assert_1.default.strictEqual(getConfigDirFromHome('antigravity', false), "'.agent'");
    });
    (0, node_test_1.test)('returns .gemini, antigravity for global installs', () => {
        node_assert_1.default.strictEqual(getConfigDirFromHome('antigravity', true), "'.gemini', 'antigravity'");
    });
    (0, node_test_1.test)('does not change other runtimes', () => {
        node_assert_1.default.strictEqual(getConfigDirFromHome('claude', true), "'.claude'");
        node_assert_1.default.strictEqual(getConfigDirFromHome('gemini', true), "'.gemini'");
        node_assert_1.default.strictEqual(getConfigDirFromHome('copilot', true), "'.copilot'");
    });
});
// ─── convertClaudeToAntigravityContent ─────────────────────────────────────────
(0, node_test_1.describe)('convertClaudeToAntigravityContent', () => {
    (0, node_test_1.describe)('global install path replacements', () => {
        (0, node_test_1.test)('replaces ~/. claude/ with ~/.gemini/antigravity/', () => {
            const input = 'See ~/.claude/core/workflows/';
            const result = convertClaudeToAntigravityContent(input, true);
            node_assert_1.default.ok(result.includes('~/.gemini/antigravity/core/workflows/'), result);
            node_assert_1.default.ok(!result.includes('~/.claude/'), result);
        });
        (0, node_test_1.test)('replaces $HOME/.claude/ with $HOME/.gemini/antigravity/', () => {
            const input = 'path.join($HOME/.claude/core)';
            const result = convertClaudeToAntigravityContent(input, true);
            node_assert_1.default.ok(result.includes('$HOME/.gemini/antigravity/'), result);
            node_assert_1.default.ok(!result.includes('$HOME/.claude/'), result);
        });
    });
    (0, node_test_1.describe)('local install path replacements', () => {
        (0, node_test_1.test)('replaces ~/.claude/ with .agent/ for local installs', () => {
            const input = 'See ~/.claude/core/';
            const result = convertClaudeToAntigravityContent(input, false);
            node_assert_1.default.ok(result.includes('.agent/core/'), result);
            node_assert_1.default.ok(!result.includes('~/.claude/'), result);
        });
        (0, node_test_1.test)('replaces ./.claude/ with ./.agent/', () => {
            const input = 'path ./.claude/hooks/vector-check-update.js';
            const result = convertClaudeToAntigravityContent(input, false);
            node_assert_1.default.ok(result.includes('./.agent/hooks/'), result);
            node_assert_1.default.ok(!result.includes('./.claude/'), result);
        });
        (0, node_test_1.test)('replaces .claude/ with .agent/', () => {
            const input = 'node .claude/hooks/vector-statusline.js';
            const result = convertClaudeToAntigravityContent(input, false);
            node_assert_1.default.ok(result.includes('.agent/hooks/vector-statusline.js'), result);
            node_assert_1.default.ok(!result.includes('.claude/'), result);
        });
    });
    (0, node_test_1.describe)('command name conversion', () => {
        (0, node_test_1.test)('converts /vector:command to /vector-command', () => {
            const input = 'Run /vector:new-project to start';
            const result = convertClaudeToAntigravityContent(input, true);
            node_assert_1.default.ok(result.includes('/vector-new-project'), result);
            node_assert_1.default.ok(!result.includes('vector:'), result);
        });
        (0, node_test_1.test)('converts all vector: references', () => {
            const input = '/vector:plan-phase and /vector:execute-phase';
            const result = convertClaudeToAntigravityContent(input, false);
            node_assert_1.default.ok(result.includes('/vector-plan-phase'), result);
            node_assert_1.default.ok(result.includes('/vector-execute-phase'), result);
        });
    });
    (0, node_test_1.test)('does not modify unrelated content', () => {
        const input = 'This is a plain text description with no paths.';
        const result = convertClaudeToAntigravityContent(input, false);
        node_assert_1.default.strictEqual(result, input);
    });
});
// ─── convertClaudeCommandToAntigravitySkill ─────────────────────────────────────
(0, node_test_1.describe)('convertClaudeCommandToAntigravitySkill', () => {
    const claudeCommand = `---
name: vector:new-project
description: Initialize a new Vector project with requirements and roadmap
argument-hint: "[project-name]"
allowed-tools:
  - Read
  - Write
  - Bash
  - Agent
---

Initialize new project at ~/.claude/core/workflows/new-project.md
`;
    (0, node_test_1.test)('produces name and description only in frontmatter', () => {
        const result = convertClaudeCommandToAntigravitySkill(claudeCommand, 'vector-new-project', false);
        node_assert_1.default.ok(result.startsWith('---\n'), result);
        node_assert_1.default.ok(result.includes('name: vector-new-project'), result);
        node_assert_1.default.ok(result.includes('description: Initialize a new Vector project'), result);
        // No allowed-tools in output
        node_assert_1.default.ok(!result.includes('allowed-tools'), result);
        // No argument-hint in output
        node_assert_1.default.ok(!result.includes('argument-hint'), result);
    });
    (0, node_test_1.test)('applies path replacement in body', () => {
        const result = convertClaudeCommandToAntigravitySkill(claudeCommand, 'vector-new-project', false);
        node_assert_1.default.ok(result.includes('.agent/core/'), result);
        node_assert_1.default.ok(!result.includes('~/.claude/'), result);
    });
    (0, node_test_1.test)('uses provided skillName for name field', () => {
        const result = convertClaudeCommandToAntigravitySkill(claudeCommand, 'vector-custom-name', false);
        node_assert_1.default.ok(result.includes('name: vector-custom-name'), result);
    });
    (0, node_test_1.test)('converts vector: command references in body', () => {
        const content = `---
name: test
description: test skill
---
Run /vector:new-project to get started.
`;
        const result = convertClaudeCommandToAntigravitySkill(content, 'vector-test', false);
        node_assert_1.default.ok(result.includes('/vector-new-project'), result);
        node_assert_1.default.ok(!result.includes('vector:'), result);
    });
    (0, node_test_1.test)('returns unchanged content when no frontmatter', () => {
        const noFm = 'Just some text without frontmatter.';
        const result = convertClaudeCommandToAntigravitySkill(noFm, 'vector-test', false);
        // Path replacements still apply, but no frontmatter transformation
        node_assert_1.default.ok(!result.startsWith('---'), result);
    });
});
// ─── convertClaudeAgentToAntigravityAgent ──────────────────────────────────────
(0, node_test_1.describe)('convertClaudeAgentToAntigravityAgent', () => {
    const claudeAgent = `---
name: vector-executor
description: Executes Vector plans with atomic commits
tools: Read, Write, Edit, Bash, Glob, Grep, Task
color: blue
---

Execute plans from ~/.claude/core/workflows/execute-phase.md
`;
    (0, node_test_1.test)('preserves name and description', () => {
        const result = convertClaudeAgentToAntigravityAgent(claudeAgent, false);
        node_assert_1.default.ok(result.includes('name: vector-executor'), result);
        node_assert_1.default.ok(result.includes('description: Executes Vector plans'), result);
    });
    (0, node_test_1.test)('maps Claude tools to Gemini tool names', () => {
        const result = convertClaudeAgentToAntigravityAgent(claudeAgent, false);
        // Read → read_file, Bash → run_shell_command
        node_assert_1.default.ok(result.includes('read_file'), result);
        node_assert_1.default.ok(result.includes('run_shell_command'), result);
        // Original Claude names should not appear in tools line
        const fmEnd = result.indexOf('---', 3);
        const frontmatter = result.slice(0, fmEnd);
        node_assert_1.default.ok(!frontmatter.includes('tools: Read,'), frontmatter);
    });
    (0, node_test_1.test)('preserves color field', () => {
        const result = convertClaudeAgentToAntigravityAgent(claudeAgent, false);
        node_assert_1.default.ok(result.includes('color: blue'), result);
    });
    (0, node_test_1.test)('applies path replacement in body', () => {
        const result = convertClaudeAgentToAntigravityAgent(claudeAgent, false);
        node_assert_1.default.ok(result.includes('.agent/core/'), result);
        node_assert_1.default.ok(!result.includes('~/.claude/'), result);
    });
    (0, node_test_1.test)('uses global path for global installs', () => {
        const result = convertClaudeAgentToAntigravityAgent(claudeAgent, true);
        node_assert_1.default.ok(result.includes('~/.gemini/antigravity/core/'), result);
    });
    (0, node_test_1.test)('excludes Task tool (filtered by convertGeminiToolName)', () => {
        const result = convertClaudeAgentToAntigravityAgent(claudeAgent, false);
        // Task is excluded by convertGeminiToolName (returns null for Task)
        const fmEnd = result.indexOf('---', 3);
        const frontmatter = result.slice(0, fmEnd);
        node_assert_1.default.ok(!frontmatter.includes('Task'), frontmatter);
    });
});
// ─── copyCommandsAsAntigravitySkills ───────────────────────────────────────────
(0, node_test_1.describe)('copyCommandsAsAntigravitySkills', () => {
    let tmpDir;
    let srcDir;
    let skillsDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-ag-test-'));
        srcDir = path_1.default.join(tmpDir, 'commands', 'vector');
        skillsDir = path_1.default.join(tmpDir, 'skills');
        fs_1.default.mkdirSync(srcDir, { recursive: true });
        // Create a sample command file
        fs_1.default.writeFileSync(path_1.default.join(srcDir, 'new-project.md'), `---
name: vector:new-project
description: Initialize a new project
allowed-tools:
  - Read
  - Write
---
Run /vector:new-project to start.
`);
        // Create a subdirectory command
        const subDir = path_1.default.join(srcDir, 'subdir');
        fs_1.default.mkdirSync(subDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(subDir, 'sub-command.md'), `---
name: vector:sub-command
description: A sub-command
allowed-tools:
  - Read
---
Body text.
`);
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('creates skills directory', () => {
        copyCommandsAsAntigravitySkills(srcDir, skillsDir, 'vector', false);
        node_assert_1.default.ok(fs_1.default.existsSync(skillsDir));
    });
    (0, node_test_1.test)('creates one skill directory per command with SKILL.md', () => {
        copyCommandsAsAntigravitySkills(srcDir, skillsDir, 'vector', false);
        const skillDir = path_1.default.join(skillsDir, 'vector-new-project');
        node_assert_1.default.ok(fs_1.default.existsSync(skillDir), 'skill dir should exist');
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(skillDir, 'SKILL.md')), 'SKILL.md should exist');
    });
    (0, node_test_1.test)('handles subdirectory commands with prefixed names', () => {
        copyCommandsAsAntigravitySkills(srcDir, skillsDir, 'vector', false);
        const subSkillDir = path_1.default.join(skillsDir, 'vector-subdir-sub-command');
        node_assert_1.default.ok(fs_1.default.existsSync(subSkillDir), 'subdirectory skill dir should exist');
    });
    (0, node_test_1.test)('SKILL.md has minimal frontmatter (name + description only)', () => {
        copyCommandsAsAntigravitySkills(srcDir, skillsDir, 'vector', false);
        const content = fs_1.default.readFileSync(path_1.default.join(skillsDir, 'vector-new-project', 'SKILL.md'), 'utf8');
        node_assert_1.default.ok(content.includes('name: vector-new-project'), content);
        node_assert_1.default.ok(content.includes('description: Initialize a new project'), content);
        node_assert_1.default.ok(!content.includes('allowed-tools'), content);
    });
    (0, node_test_1.test)('SKILL.md body has paths converted for local install', () => {
        copyCommandsAsAntigravitySkills(srcDir, skillsDir, 'vector', false);
        const content = fs_1.default.readFileSync(path_1.default.join(skillsDir, 'vector-new-project', 'SKILL.md'), 'utf8');
        // vector: → vector- conversion
        node_assert_1.default.ok(!content.includes('vector:'), content);
    });
    (0, node_test_1.test)('removes old vector-* skill dirs before reinstalling', () => {
        // Create a stale skill dir
        const staleDir = path_1.default.join(skillsDir, 'vector-old-skill');
        fs_1.default.mkdirSync(staleDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(staleDir, 'SKILL.md'), '---\nname: old\n---\n');
        copyCommandsAsAntigravitySkills(srcDir, skillsDir, 'vector', false);
        node_assert_1.default.ok(!fs_1.default.existsSync(staleDir), 'stale skill dir should be removed');
    });
    (0, node_test_1.test)('does not remove non-vector skill dirs', () => {
        // Create a non-Vector skill dir
        const otherDir = path_1.default.join(skillsDir, 'my-custom-skill');
        fs_1.default.mkdirSync(otherDir, { recursive: true });
        copyCommandsAsAntigravitySkills(srcDir, skillsDir, 'vector', false);
        node_assert_1.default.ok(fs_1.default.existsSync(otherDir), 'non-Vector skill dir should be preserved');
    });
});
// ─── writeManifest (Antigravity) ───────────────────────────────────────────────
(0, node_test_1.describe)('writeManifest (Antigravity)', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-manifest-ag-'));
        // Create minimal structure
        const skillsDir = path_1.default.join(tmpDir, 'skills', 'vector-help');
        fs_1.default.mkdirSync(skillsDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(skillsDir, 'SKILL.md'), '---\nname: vector-help\ndescription: Help\n---\n');
        const vectorDir = path_1.default.join(tmpDir, 'core');
        fs_1.default.mkdirSync(vectorDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(vectorDir, 'VERSION'), '1.0.0');
        const agentsDir = path_1.default.join(tmpDir, 'agents');
        fs_1.default.mkdirSync(agentsDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(agentsDir, 'vector-executor.md'), '---\nname: vector-executor\n---\n');
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('writes manifest JSON file', () => {
        writeManifest(tmpDir, 'antigravity');
        const manifestPath = path_1.default.join(tmpDir, 'vector-file-manifest.json');
        node_assert_1.default.ok(fs_1.default.existsSync(manifestPath), 'manifest file should exist');
        const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf8'));
        node_assert_1.default.ok(manifest.version, 'should have version');
        node_assert_1.default.ok(manifest.files, 'should have files');
    });
    (0, node_test_1.test)('manifest includes skills in skills/ directory', () => {
        writeManifest(tmpDir, 'antigravity');
        const manifest = JSON.parse(fs_1.default.readFileSync(path_1.default.join(tmpDir, 'vector-file-manifest.json'), 'utf8'));
        const skillFiles = Object.keys(manifest.files).filter((f) => f.startsWith('skills/'));
        node_assert_1.default.ok(skillFiles.length > 0, 'should have skill files in manifest');
    });
    (0, node_test_1.test)('manifest includes agent files', () => {
        writeManifest(tmpDir, 'antigravity');
        const manifest = JSON.parse(fs_1.default.readFileSync(path_1.default.join(tmpDir, 'vector-file-manifest.json'), 'utf8'));
        const agentFiles = Object.keys(manifest.files).filter((f) => f.startsWith('agents/'));
        node_assert_1.default.ok(agentFiles.length > 0, 'should have agent files in manifest');
    });
});
//# sourceMappingURL=antigravity-install.test.cjs.map