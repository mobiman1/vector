"use strict";
/**
 * Vector Tools Tests - Copilot Install Plumbing
 *
 * Tests for Copilot runtime directory resolution, config paths,
 * and integration with the multi-runtime installer.
 *
 * Requirements: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06
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
const { getDirName, getGlobalDir, getConfigDirFromHome, claudeToCopilotTools, convertCopilotToolName, convertClaudeToCopilotContent, convertClaudeCommandToCopilotSkill, convertClaudeAgentToCopilotAgent, copyCommandsAsCopilotSkills, GSD_COPILOT_INSTRUCTIONS_MARKER, GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER, mergeCopilotInstructions, stripGsdFromCopilotInstructions, writeManifest, reportLocalPatches, } = require('../bin/install.cjs');
// ─── getDirName ─────────────────────────────────────────────────────────────────
(0, node_test_1.describe)('getDirName (Copilot)', () => {
    (0, node_test_1.test)('returns .github for copilot', () => {
        node_assert_1.default.strictEqual(getDirName('copilot'), '.github');
    });
    (0, node_test_1.test)('does not break existing runtimes', () => {
        node_assert_1.default.strictEqual(getDirName('claude'), '.claude');
        node_assert_1.default.strictEqual(getDirName('opencode'), '.opencode');
        node_assert_1.default.strictEqual(getDirName('gemini'), '.gemini');
        node_assert_1.default.strictEqual(getDirName('codex'), '.codex');
    });
});
// ─── getGlobalDir ───────────────────────────────────────────────────────────────
(0, node_test_1.describe)('getGlobalDir (Copilot)', () => {
    (0, node_test_1.test)('returns ~/.copilot with no env var or explicit dir', () => {
        const original = process.env.COPILOT_CONFIG_DIR;
        try {
            delete process.env.COPILOT_CONFIG_DIR;
            const result = getGlobalDir('copilot');
            node_assert_1.default.strictEqual(result, path_1.default.join(os_1.default.homedir(), '.copilot'));
        }
        finally {
            if (original !== undefined) {
                process.env.COPILOT_CONFIG_DIR = original;
            }
            else {
                delete process.env.COPILOT_CONFIG_DIR;
            }
        }
    });
    (0, node_test_1.test)('returns explicit dir when provided', () => {
        const result = getGlobalDir('copilot', '/custom/path');
        node_assert_1.default.strictEqual(result, '/custom/path');
    });
    (0, node_test_1.test)('respects COPILOT_CONFIG_DIR env var', () => {
        const original = process.env.COPILOT_CONFIG_DIR;
        try {
            process.env.COPILOT_CONFIG_DIR = '~/custom-copilot';
            const result = getGlobalDir('copilot');
            node_assert_1.default.strictEqual(result, path_1.default.join(os_1.default.homedir(), 'custom-copilot'));
        }
        finally {
            if (original !== undefined) {
                process.env.COPILOT_CONFIG_DIR = original;
            }
            else {
                delete process.env.COPILOT_CONFIG_DIR;
            }
        }
    });
    (0, node_test_1.test)('explicit dir takes priority over COPILOT_CONFIG_DIR', () => {
        const original = process.env.COPILOT_CONFIG_DIR;
        try {
            process.env.COPILOT_CONFIG_DIR = '~/env-path';
            const result = getGlobalDir('copilot', '/explicit/path');
            node_assert_1.default.strictEqual(result, '/explicit/path');
        }
        finally {
            if (original !== undefined) {
                process.env.COPILOT_CONFIG_DIR = original;
            }
            else {
                delete process.env.COPILOT_CONFIG_DIR;
            }
        }
    });
    (0, node_test_1.test)('does not break existing runtimes', () => {
        node_assert_1.default.strictEqual(getGlobalDir('claude'), path_1.default.join(os_1.default.homedir(), '.claude'));
        node_assert_1.default.strictEqual(getGlobalDir('codex'), path_1.default.join(os_1.default.homedir(), '.codex'));
    });
});
// ─── getConfigDirFromHome ───────────────────────────────────────────────────────
(0, node_test_1.describe)('getConfigDirFromHome (Copilot)', () => {
    (0, node_test_1.test)('returns .github path string for local (isGlobal=false)', () => {
        node_assert_1.default.strictEqual(getConfigDirFromHome('copilot', false), "'.github'");
    });
    (0, node_test_1.test)('returns .copilot path string for global (isGlobal=true)', () => {
        node_assert_1.default.strictEqual(getConfigDirFromHome('copilot', true), "'.copilot'");
    });
    (0, node_test_1.test)('does not break existing runtimes', () => {
        node_assert_1.default.strictEqual(getConfigDirFromHome('opencode', true), "'.config', 'opencode'");
        node_assert_1.default.strictEqual(getConfigDirFromHome('claude', true), "'.claude'");
        node_assert_1.default.strictEqual(getConfigDirFromHome('gemini', true), "'.gemini'");
        node_assert_1.default.strictEqual(getConfigDirFromHome('codex', true), "'.codex'");
    });
});
// ─── Source code integration checks ─────────────────────────────────────────────
(0, node_test_1.describe)('Source code integration (Copilot)', () => {
    const src = fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'bin', 'install.cjs'), 'utf8');
    (0, node_test_1.test)('CLI-01: --copilot flag parsing exists', () => {
        node_assert_1.default.ok(src.includes("args.includes('--copilot')"), '--copilot flag parsed');
    });
    (0, node_test_1.test)('CLI-03: --all array includes copilot', () => {
        node_assert_1.default.ok(src.includes("'copilot'") && src.includes('selectedRuntimes = ['), '--all includes copilot runtime');
    });
    (0, node_test_1.test)('CLI-06: banner text includes Copilot', () => {
        node_assert_1.default.ok(src.includes('Copilot'), 'banner mentions Copilot');
    });
    (0, node_test_1.test)('CLI-06: help text includes --copilot', () => {
        node_assert_1.default.ok(src.includes('--copilot'), 'help text has --copilot option');
    });
    (0, node_test_1.test)('CLI-02: promptRuntime has Copilot as option 5', () => {
        node_assert_1.default.ok(src.includes("choice === '5'"), 'choice 5 exists');
        // Verify choice 5 maps to copilot (the line after choice === '5' should reference copilot)
        const choice5Index = src.indexOf("choice === '5'");
        const nextLines = src.substring(choice5Index, choice5Index + 100);
        node_assert_1.default.ok(nextLines.includes('copilot'), 'choice 5 maps to copilot');
    });
    (0, node_test_1.test)('CLI-02: promptRuntime has All option including copilot', () => {
        // All option callback includes copilot in the runtimes array
        const allCallbackMatch = src.match(/callback\(\[(['a-z', ]+)\]\)/g);
        node_assert_1.default.ok(allCallbackMatch && allCallbackMatch.some((m) => m.includes('copilot')), 'All option includes copilot');
    });
    (0, node_test_1.test)('isCopilot variable exists in install function', () => {
        node_assert_1.default.ok(src.includes("const isCopilot = runtime === 'copilot'"), 'isCopilot defined');
    });
    (0, node_test_1.test)('hooks are skipped for Copilot', () => {
        node_assert_1.default.ok(src.includes('!isCodex && !isCopilot'), 'hooks skip check includes copilot');
    });
    (0, node_test_1.test)('--both flag unchanged (still claude + opencode only)', () => {
        // Verify the else-if-hasBoth maps to ['claude', 'opencode'] — NOT including copilot
        const bothUsage = src.indexOf('else if (hasBoth)');
        node_assert_1.default.ok(bothUsage > 0, 'hasBoth usage exists');
        const bothSection = src.substring(bothUsage, bothUsage + 200);
        node_assert_1.default.ok(bothSection.includes("['claude', 'opencode']"), '--both maps to claude+opencode');
        node_assert_1.default.ok(!bothSection.includes('copilot'), '--both does NOT include copilot');
    });
});
// ─── convertCopilotToolName ─────────────────────────────────────────────────────
(0, node_test_1.describe)('convertCopilotToolName', () => {
    (0, node_test_1.test)('maps Read to read', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('Read'), 'read');
    });
    (0, node_test_1.test)('maps Write to edit', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('Write'), 'edit');
    });
    (0, node_test_1.test)('maps Edit to edit (same as Write)', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('Edit'), 'edit');
    });
    (0, node_test_1.test)('maps Bash to execute', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('Bash'), 'execute');
    });
    (0, node_test_1.test)('maps Grep to search', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('Grep'), 'search');
    });
    (0, node_test_1.test)('maps Glob to search (same as Grep)', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('Glob'), 'search');
    });
    (0, node_test_1.test)('maps Task to agent', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('Task'), 'agent');
    });
    (0, node_test_1.test)('maps WebSearch to web', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('WebSearch'), 'web');
    });
    (0, node_test_1.test)('maps WebFetch to web (same as WebSearch)', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('WebFetch'), 'web');
    });
    (0, node_test_1.test)('maps TodoWrite to todo', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('TodoWrite'), 'todo');
    });
    (0, node_test_1.test)('maps AskUserQuestion to ask_user', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('AskUserQuestion'), 'ask_user');
    });
    (0, node_test_1.test)('maps SlashCommand to skill', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('SlashCommand'), 'skill');
    });
    (0, node_test_1.test)('maps mcp__context7__ prefix to io.github.upstash/context7/', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('mcp__context7__resolve-library-id'), 'io.github.upstash/context7/resolve-library-id');
    });
    (0, node_test_1.test)('maps mcp__context7__* wildcard', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('mcp__context7__*'), 'io.github.upstash/context7/*');
    });
    (0, node_test_1.test)('lowercases unknown tools as fallback', () => {
        node_assert_1.default.strictEqual(convertCopilotToolName('SomeNewTool'), 'somenewtool');
    });
    (0, node_test_1.test)('mapping constant has 13 entries (12 direct + mcp handled separately)', () => {
        node_assert_1.default.strictEqual(Object.keys(claudeToCopilotTools).length, 12);
    });
});
// ─── convertClaudeToCopilotContent ──────────────────────────────────────────────
(0, node_test_1.describe)('convertClaudeToCopilotContent', () => {
    (0, node_test_1.test)('replaces ~/.claude/ with .github/ in local mode (default)', () => {
        node_assert_1.default.strictEqual(convertClaudeToCopilotContent('see ~/.claude/foo'), 'see .github/foo');
    });
    (0, node_test_1.test)('replaces ~/.claude/ with ~/.copilot/ in global mode', () => {
        node_assert_1.default.strictEqual(convertClaudeToCopilotContent('see ~/.claude/foo', true), 'see ~/.copilot/foo');
    });
    (0, node_test_1.test)('replaces ./.claude/ with ./.github/', () => {
        node_assert_1.default.strictEqual(convertClaudeToCopilotContent('at ./.claude/bar'), 'at ./.github/bar');
    });
    (0, node_test_1.test)('replaces bare .claude/ with .github/', () => {
        node_assert_1.default.strictEqual(convertClaudeToCopilotContent('in .claude/baz'), 'in .github/baz');
    });
    (0, node_test_1.test)('replaces $HOME/.claude/ with .github/ in local mode (default)', () => {
        node_assert_1.default.strictEqual(convertClaudeToCopilotContent('"$HOME/.claude/config"'), '".github/config"');
    });
    (0, node_test_1.test)('replaces $HOME/.claude/ with $HOME/.copilot/ in global mode', () => {
        node_assert_1.default.strictEqual(convertClaudeToCopilotContent('"$HOME/.claude/config"', true), '"$HOME/.copilot/config"');
    });
    (0, node_test_1.test)('converts vector: to vector- in command names', () => {
        node_assert_1.default.strictEqual(convertClaudeToCopilotContent('run /vector:health or vector:progress'), 'run /vector-health or vector-progress');
    });
    (0, node_test_1.test)('handles mixed content in local mode', () => {
        const input = 'Config at ~/.claude/settings and $HOME/.claude/config.\n' +
            'Local at ./.claude/data and .claude/commands.\n' +
            'Run vector:health and /vector:progress.';
        const result = convertClaudeToCopilotContent(input);
        node_assert_1.default.ok(result.includes('.github/settings'), 'tilde path converted to local');
        node_assert_1.default.ok(!result.includes('$HOME/.claude/'), '$HOME path converted');
        node_assert_1.default.ok(result.includes('./.github/data'), 'dot-slash path converted');
        node_assert_1.default.ok(result.includes('.github/commands'), 'bare path converted');
        node_assert_1.default.ok(result.includes('vector-health'), 'command name converted');
        node_assert_1.default.ok(result.includes('/vector-progress'), 'slash command converted');
    });
    (0, node_test_1.test)('handles mixed content in global mode', () => {
        const input = 'Config at ~/.claude/settings and $HOME/.claude/config.\n' +
            'Local at ./.claude/data and .claude/commands.\n' +
            'Run vector:health and /vector:progress.';
        const result = convertClaudeToCopilotContent(input, true);
        node_assert_1.default.ok(result.includes('~/.copilot/settings'), 'tilde path converted to global');
        node_assert_1.default.ok(result.includes('$HOME/.copilot/config'), '$HOME path converted to global');
        node_assert_1.default.ok(result.includes('./.github/data'), 'dot-slash path converted');
        node_assert_1.default.ok(result.includes('.github/commands'), 'bare path converted');
    });
    (0, node_test_1.test)('does not double-replace in local mode', () => {
        const input = '~/.claude/foo and ./.claude/bar and .claude/baz';
        const result = convertClaudeToCopilotContent(input);
        node_assert_1.default.ok(!result.includes('.github/.github/'), 'no .github/.github/ artifact');
        node_assert_1.default.strictEqual(result, '.github/foo and ./.github/bar and .github/baz');
    });
    (0, node_test_1.test)('does not double-replace in global mode', () => {
        const input = '~/.claude/foo and ./.claude/bar and .claude/baz';
        const result = convertClaudeToCopilotContent(input, true);
        node_assert_1.default.ok(!result.includes('.copilot/.github/'), 'no .copilot/.github/ artifact');
        node_assert_1.default.strictEqual(result, '~/.copilot/foo and ./.github/bar and .github/baz');
    });
    (0, node_test_1.test)('preserves content with no matches', () => {
        node_assert_1.default.strictEqual(convertClaudeToCopilotContent('hello world'), 'hello world');
    });
});
// ─── convertClaudeCommandToCopilotSkill ─────────────────────────────────────────
(0, node_test_1.describe)('convertClaudeCommandToCopilotSkill', () => {
    (0, node_test_1.test)('converts frontmatter with all fields', () => {
        const input = `---
name: vector:health
description: Diagnose planning directory health
argument-hint: [--repair]
allowed-tools:
  - Read
  - Bash
  - Write
  - AskUserQuestion
---

Body content here referencing ~/.claude/foo and vector:health.`;
        const result = convertClaudeCommandToCopilotSkill(input, 'vector-health');
        node_assert_1.default.ok(result.startsWith('---\nname: vector-health\n'), 'name uses param');
        node_assert_1.default.ok(result.includes('description: Diagnose planning directory health'), 'description preserved');
        node_assert_1.default.ok(result.includes('argument-hint: "[--repair]"'), 'argument-hint double-quoted');
        node_assert_1.default.ok(result.includes('allowed-tools: Read, Bash, Write, AskUserQuestion'), 'tools comma-separated');
        node_assert_1.default.ok(result.includes('.github/foo'), 'CONV-06 applied to body (local mode default)');
        node_assert_1.default.ok(result.includes('vector-health'), 'CONV-07 applied to body');
        node_assert_1.default.ok(!result.includes('vector:health'), 'no vector: references remain');
    });
    (0, node_test_1.test)('handles skill without allowed-tools', () => {
        const input = `---
name: vector:help
description: Show available Vector commands
---

Help content.`;
        const result = convertClaudeCommandToCopilotSkill(input, 'vector-help');
        node_assert_1.default.ok(result.includes('name: vector-help'), 'name set');
        node_assert_1.default.ok(result.includes('description: Show available Vector commands'), 'description preserved');
        node_assert_1.default.ok(!result.includes('allowed-tools:'), 'no allowed-tools line');
    });
    (0, node_test_1.test)('handles skill without argument-hint', () => {
        const input = `---
name: vector:progress
description: Show project progress
allowed-tools:
  - Read
  - Bash
---

Progress body.`;
        const result = convertClaudeCommandToCopilotSkill(input, 'vector-progress');
        node_assert_1.default.ok(!result.includes('argument-hint:'), 'no argument-hint line');
        node_assert_1.default.ok(result.includes('allowed-tools: Read, Bash'), 'tools present');
    });
    (0, node_test_1.test)('argument-hint with inner single quotes uses double-quote YAML delimiter', () => {
        const input = `---
name: vector:new-milestone
description: Start milestone
argument-hint: "[milestone name, e.g., 'v1.1 Notifications']"
allowed-tools:
  - Read
---

Body.`;
        const result = convertClaudeCommandToCopilotSkill(input, 'vector-new-milestone');
        node_assert_1.default.ok(result.includes(`argument-hint: "[milestone name, e.g., 'v1.1 Notifications']"`), 'inner single quotes preserved with double-quote delimiter');
    });
    (0, node_test_1.test)('applies CONV-06 path conversion to body (local mode)', () => {
        const input = `---
name: vector:test
description: Test skill
---

Check ~/.claude/settings and ./.claude/local and $HOME/.claude/global.`;
        const result = convertClaudeCommandToCopilotSkill(input, 'vector-test');
        node_assert_1.default.ok(result.includes('.github/settings'), 'tilde path converted to local');
        node_assert_1.default.ok(result.includes('./.github/local'), 'dot-slash path converted');
        node_assert_1.default.ok(result.includes('.github/global'), '$HOME path converted to local');
    });
    (0, node_test_1.test)('applies CONV-06 path conversion to body (global mode)', () => {
        const input = `---
name: vector:test
description: Test skill
---

Check ~/.claude/settings and ./.claude/local and $HOME/.claude/global.`;
        const result = convertClaudeCommandToCopilotSkill(input, 'vector-test', true);
        node_assert_1.default.ok(result.includes('~/.copilot/settings'), 'tilde path converted to global');
        node_assert_1.default.ok(result.includes('./.github/local'), 'dot-slash path converted');
        node_assert_1.default.ok(result.includes('$HOME/.copilot/global'), '$HOME path converted to global');
    });
    (0, node_test_1.test)('applies CONV-07 command name conversion to body', () => {
        const input = `---
name: vector:test
description: Test skill
---

Run vector:health and /vector:progress for diagnostics.`;
        const result = convertClaudeCommandToCopilotSkill(input, 'vector-test');
        node_assert_1.default.ok(result.includes('vector-health'), 'vector:health converted');
        node_assert_1.default.ok(result.includes('/vector-progress'), '/vector:progress converted');
        node_assert_1.default.ok(!result.match(/vector:[a-z]/), 'no vector: command refs remain');
    });
    (0, node_test_1.test)('handles content without frontmatter (local mode)', () => {
        const input = 'Just some markdown with ~/.claude/path and vector:health.';
        const result = convertClaudeCommandToCopilotSkill(input, 'vector-test');
        node_assert_1.default.ok(result.includes('.github/path'), 'CONV-06 applied (local)');
        node_assert_1.default.ok(result.includes('vector-health'), 'CONV-07 applied');
        node_assert_1.default.ok(!result.includes('---'), 'no frontmatter added');
    });
    (0, node_test_1.test)('preserves agent field in frontmatter', () => {
        const input = `---
name: vector:execute-phase
description: Execute a phase
agent: vector-planner
allowed-tools:
  - Read
  - Bash
---

Body.`;
        const result = convertClaudeCommandToCopilotSkill(input, 'vector-execute-phase');
        node_assert_1.default.ok(result.includes('agent: vector-planner'), 'agent field preserved');
    });
});
// ─── convertClaudeAgentToCopilotAgent ───────────────────────────────────────────
(0, node_test_1.describe)('convertClaudeAgentToCopilotAgent', () => {
    (0, node_test_1.test)('maps and deduplicates tools', () => {
        const input = `---
name: vector-executor
description: Executes Vector plans
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
---

Agent body.`;
        const result = convertClaudeAgentToCopilotAgent(input);
        node_assert_1.default.ok(result.includes("tools: ['read', 'edit', 'execute', 'search']"), 'tools mapped and deduped');
    });
    (0, node_test_1.test)('formats tools as JSON array', () => {
        const input = `---
name: vector-test
description: Test agent
tools: Read, Bash
---

Body.`;
        const result = convertClaudeAgentToCopilotAgent(input);
        node_assert_1.default.ok(result.match(/tools: \['[a-z_]+'(, '[a-z_]+')*\]/), 'tools formatted as JSON array');
    });
    (0, node_test_1.test)('preserves name description and color', () => {
        const input = `---
name: vector-executor
description: Executes Vector plans with atomic commits
tools: Read, Bash
color: yellow
---

Body.`;
        const result = convertClaudeAgentToCopilotAgent(input);
        node_assert_1.default.ok(result.includes('name: vector-executor'), 'name preserved');
        node_assert_1.default.ok(result.includes('description: Executes Vector plans with atomic commits'), 'description preserved');
        node_assert_1.default.ok(result.includes('color: yellow'), 'color preserved');
    });
    (0, node_test_1.test)('handles mcp__context7__ tools', () => {
        const input = `---
name: vector-researcher
description: Research agent
tools: Read, Bash, mcp__context7__resolve-library-id
color: cyan
---

Body.`;
        const result = convertClaudeAgentToCopilotAgent(input);
        node_assert_1.default.ok(result.includes('io.github.upstash/context7/resolve-library-id'), 'mcp tool mapped');
        node_assert_1.default.ok(!result.includes('mcp__context7__'), 'no mcp__ prefix remains');
    });
    (0, node_test_1.test)('handles agent with no tools field', () => {
        const input = `---
name: vector-empty
description: Empty agent
color: green
---

Body.`;
        const result = convertClaudeAgentToCopilotAgent(input);
        node_assert_1.default.ok(result.includes('tools: []'), 'missing tools produces []');
    });
    (0, node_test_1.test)('applies CONV-06 and CONV-07 to body (local mode)', () => {
        const input = `---
name: vector-test
description: Test
tools: Read
---

Check ~/.claude/settings and run vector:health.`;
        const result = convertClaudeAgentToCopilotAgent(input);
        node_assert_1.default.ok(result.includes('.github/settings'), 'CONV-06 applied (local)');
        node_assert_1.default.ok(result.includes('vector-health'), 'CONV-07 applied');
        node_assert_1.default.ok(!result.includes('~/.claude/'), 'no ~/.claude/ remains');
        node_assert_1.default.ok(!result.match(/vector:[a-z]/), 'no vector: command refs remain');
    });
    (0, node_test_1.test)('applies CONV-06 and CONV-07 to body (global mode)', () => {
        const input = `---
name: vector-test
description: Test
tools: Read
---

Check ~/.claude/settings and run vector:health.`;
        const result = convertClaudeAgentToCopilotAgent(input, true);
        node_assert_1.default.ok(result.includes('~/.copilot/settings'), 'CONV-06 applied (global)');
        node_assert_1.default.ok(result.includes('vector-health'), 'CONV-07 applied');
    });
    (0, node_test_1.test)('handles content without frontmatter (local mode)', () => {
        const input = 'Just markdown with ~/.claude/path and vector:test.';
        const result = convertClaudeAgentToCopilotAgent(input);
        node_assert_1.default.ok(result.includes('.github/path'), 'CONV-06 applied (local)');
        node_assert_1.default.ok(result.includes('vector-test'), 'CONV-07 applied');
        node_assert_1.default.ok(!result.includes('---'), 'no frontmatter added');
    });
});
// ─── copyCommandsAsCopilotSkills (integration) ─────────────────────────────────
(0, node_test_1.describe)('copyCommandsAsCopilotSkills', () => {
    const srcDir = path_1.default.join(__dirname, '..', 'commands', 'vector');
    (0, node_test_1.test)('creates skill folders from source commands', () => {
        const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-copilot-skills-'));
        try {
            copyCommandsAsCopilotSkills(srcDir, tempDir, 'vector');
            // Check specific folders exist
            node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tempDir, 'vector-health')), 'vector-health folder exists');
            node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tempDir, 'vector-health', 'SKILL.md')), 'vector-health/SKILL.md exists');
            node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tempDir, 'vector-help')), 'vector-help folder exists');
            node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tempDir, 'vector-progress')), 'vector-progress folder exists');
            // Count vector-* directories — should be 31
            const dirs = fs_1.default.readdirSync(tempDir, { withFileTypes: true })
                .filter((e) => e.isDirectory() && e.name.startsWith('vector-'));
            node_assert_1.default.strictEqual(dirs.length, 37, `expected 37 skill folders, got ${dirs.length}`);
        }
        finally {
            fs_1.default.rmSync(tempDir, { recursive: true });
        }
    });
    (0, node_test_1.test)('skill content has Copilot frontmatter format', () => {
        const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-copilot-skills-'));
        try {
            copyCommandsAsCopilotSkills(srcDir, tempDir, 'vector');
            const skillContent = fs_1.default.readFileSync(path_1.default.join(tempDir, 'vector-health', 'SKILL.md'), 'utf8');
            // Frontmatter format checks
            node_assert_1.default.ok(skillContent.startsWith('---\nname: vector-health\n'), 'starts with name: vector-health');
            node_assert_1.default.ok(skillContent.includes('allowed-tools: Read, Bash, Write, AskUserQuestion'), 'allowed-tools is comma-separated');
            node_assert_1.default.ok(!skillContent.includes('allowed-tools:\n  -'), 'NOT YAML multiline format');
            // CONV-06/07 applied
            node_assert_1.default.ok(!skillContent.includes('~/.claude/'), 'no ~/.claude/ references');
            node_assert_1.default.ok(!skillContent.match(/vector:[a-z]/), 'no vector: command references');
        }
        finally {
            fs_1.default.rmSync(tempDir, { recursive: true });
        }
    });
    (0, node_test_1.test)('generates vector-autonomous skill from autonomous.md command', () => {
        // Fail-fast: source command must exist
        const srcFile = path_1.default.join(srcDir, 'autonomous.md');
        node_assert_1.default.ok(fs_1.default.existsSync(srcFile), 'commands/vector/autonomous.md must exist as source');
        const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-copilot-skills-'));
        try {
            copyCommandsAsCopilotSkills(srcDir, tempDir, 'vector');
            // Skill folder and file created
            node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tempDir, 'vector-autonomous')), 'vector-autonomous folder exists');
            node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tempDir, 'vector-autonomous', 'SKILL.md')), 'vector-autonomous/SKILL.md exists');
            const skillContent = fs_1.default.readFileSync(path_1.default.join(tempDir, 'vector-autonomous', 'SKILL.md'), 'utf8');
            // Frontmatter: name converted from vector:autonomous to vector-autonomous
            node_assert_1.default.ok(skillContent.startsWith('---\nname: vector-autonomous\n'), 'name is vector-autonomous');
            node_assert_1.default.ok(skillContent.includes('description: Run all remaining phases autonomously'), 'description preserved');
            // argument-hint present and double-quoted
            node_assert_1.default.ok(skillContent.includes('argument-hint: "[--from N]"'), 'argument-hint present and quoted');
            // allowed-tools comma-separated
            node_assert_1.default.ok(skillContent.includes('allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion, Task'), 'allowed-tools is comma-separated');
            // No Claude-format remnants
            node_assert_1.default.ok(!skillContent.includes('allowed-tools:\n  -'), 'NOT YAML multiline format');
            node_assert_1.default.ok(!skillContent.includes('~/.claude/'), 'no ~/.claude/ references in body');
        }
        finally {
            fs_1.default.rmSync(tempDir, { recursive: true });
        }
    });
    (0, node_test_1.test)('autonomous skill body converts vector: to vector- (CONV-07)', () => {
        // Use convertClaudeToCopilotContent directly on the command body content
        const srcContent = fs_1.default.readFileSync(path_1.default.join(srcDir, 'autonomous.md'), 'utf8');
        const result = convertClaudeToCopilotContent(srcContent);
        // vector:autonomous references should be converted to vector-autonomous
        node_assert_1.default.ok(!result.match(/vector:[a-z]/), 'no vector: command references remain after conversion');
        // Specific: vector:discuss-phase, vector:plan-phase, vector:execute-phase mentioned in body
        // The body references vector-tools.cjs (not a vector: command) — those should be unaffected
        // But /vector:autonomous → /vector-autonomous, vector:discuss-phase → vector-discuss-phase etc.
        if (srcContent.includes('vector:autonomous')) {
            node_assert_1.default.ok(result.includes('vector-autonomous'), 'vector:autonomous converted to vector-autonomous');
        }
        // Path conversion: ~/.claude/ → .github/
        node_assert_1.default.ok(!result.includes('~/.claude/'), 'no ~/.claude/ paths remain');
    });
    (0, node_test_1.test)('cleans up old skill directories on re-run', () => {
        const tempDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-copilot-skills-'));
        try {
            // Create a fake old directory
            fs_1.default.mkdirSync(path_1.default.join(tempDir, 'vector-fake-old'), { recursive: true });
            fs_1.default.writeFileSync(path_1.default.join(tempDir, 'vector-fake-old', 'SKILL.md'), 'old');
            node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tempDir, 'vector-fake-old')), 'fake old dir exists before');
            // Run copy — should clean up old dirs
            copyCommandsAsCopilotSkills(srcDir, tempDir, 'vector');
            node_assert_1.default.ok(!fs_1.default.existsSync(path_1.default.join(tempDir, 'vector-fake-old')), 'fake old dir removed');
            node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(tempDir, 'vector-health')), 'real dirs still exist');
        }
        finally {
            fs_1.default.rmSync(tempDir, { recursive: true });
        }
    });
});
// ─── Copilot agent conversion - real files ──────────────────────────────────────
(0, node_test_1.describe)('Copilot agent conversion - real files', () => {
    const agentsSrc = path_1.default.join(__dirname, '..', 'agents');
    (0, node_test_1.test)('converts vector-executor agent correctly', () => {
        const content = fs_1.default.readFileSync(path_1.default.join(agentsSrc, 'vector-executor.md'), 'utf8');
        const result = convertClaudeAgentToCopilotAgent(content);
        node_assert_1.default.ok(result.startsWith('---\nname: vector-executor\n'), 'starts with correct name');
        // 6 Claude tools (Read, Write, Edit, Bash, Grep, Glob) → 4 after dedup
        node_assert_1.default.ok(result.includes("tools: ['read', 'edit', 'execute', 'search']"), 'tools mapped and deduplicated (6→4)');
        node_assert_1.default.ok(result.includes('color: yellow'), 'color preserved');
        node_assert_1.default.ok(!result.includes('~/.claude/'), 'no ~/.claude/ in body');
    });
    (0, node_test_1.test)('converts agent with mcp wildcard tools correctly', () => {
        const content = fs_1.default.readFileSync(path_1.default.join(agentsSrc, 'vector-phase-researcher.md'), 'utf8');
        const result = convertClaudeAgentToCopilotAgent(content);
        const toolsLine = result.split('\n').find((l) => l.startsWith('tools:'));
        node_assert_1.default.ok(toolsLine.includes('io.github.upstash/context7/*'), 'mcp wildcard mapped in tools');
        node_assert_1.default.ok(!toolsLine.includes('mcp__context7__'), 'no mcp__ prefix in tools line');
        node_assert_1.default.ok(toolsLine.includes("'web'"), 'WebSearch/WebFetch deduplicated to web');
        node_assert_1.default.ok(toolsLine.includes("'read'"), 'Read mapped');
    });
    (0, node_test_1.test)('all 15 agents convert without error', () => {
        const agents = fs_1.default.readdirSync(agentsSrc)
            .filter((f) => f.startsWith('vector-') && f.endsWith('.md'));
        node_assert_1.default.strictEqual(agents.length, 15, `expected 15 agents, got ${agents.length}`);
        for (const agentFile of agents) {
            const content = fs_1.default.readFileSync(path_1.default.join(agentsSrc, agentFile), 'utf8');
            const result = convertClaudeAgentToCopilotAgent(content);
            node_assert_1.default.ok(result.startsWith('---\n'), `${agentFile} should have frontmatter`);
            node_assert_1.default.ok(result.includes('tools:'), `${agentFile} should have tools field`);
            node_assert_1.default.ok(!result.includes('~/.claude/'), `${agentFile} should not contain ~/.claude/`);
        }
    });
});
// ─── Copilot content conversion - engine files ─────────────────────────────────
(0, node_test_1.describe)('Copilot content conversion - engine files', () => {
    (0, node_test_1.test)('converts engine .md files correctly (local mode default)', () => {
        const healthMd = fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'core', 'workflows', 'health.md'), 'utf8');
        const result = convertClaudeToCopilotContent(healthMd);
        node_assert_1.default.ok(!result.includes('~/.claude/'), 'no ~/.claude/ references remain');
        node_assert_1.default.ok(!result.includes('$HOME/.claude/'), 'no $HOME/.claude/ references remain');
        node_assert_1.default.ok(!result.match(/\/vector:[a-z]/), 'no /vector: command references remain');
        node_assert_1.default.ok(!result.match(/(?<!\/)vector:[a-z]/), 'no bare vector: command references remain');
        // Local mode: ~ and $HOME resolve to .github (repo-relative, no ./ prefix)
        node_assert_1.default.ok(result.includes('.github/'), 'paths converted to .github for local');
        node_assert_1.default.ok(result.includes('vector-health'), 'command name converted');
    });
    (0, node_test_1.test)('converts engine .md files correctly (global mode)', () => {
        const healthMd = fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'core', 'workflows', 'health.md'), 'utf8');
        const result = convertClaudeToCopilotContent(healthMd, true);
        node_assert_1.default.ok(!result.includes('~/.claude/'), 'no ~/.claude/ references remain');
        node_assert_1.default.ok(!result.includes('$HOME/.claude/'), 'no $HOME/.claude/ references remain');
        // Global mode: ~ and $HOME resolve to .copilot
        if (healthMd.includes('$HOME/.claude/')) {
            node_assert_1.default.ok(result.includes('$HOME/.copilot/'), '$HOME path converted to .copilot');
        }
        node_assert_1.default.ok(result.includes('vector-health'), 'command name converted');
    });
    (0, node_test_1.test)('converts engine .cjs files correctly', () => {
        const verifyCjs = fs_1.default.readFileSync(path_1.default.join(__dirname, '..', 'core', 'bin', 'lib', 'verify.cjs'), 'utf8');
        const result = convertClaudeToCopilotContent(verifyCjs);
        node_assert_1.default.ok(!result.match(/vector:[a-z]/), 'no vector: references remain');
        node_assert_1.default.ok(result.includes('vector-new-project'), 'vector:new-project converted');
        node_assert_1.default.ok(result.includes('vector-health'), 'vector:health converted');
    });
});
// ─── Copilot instructions merge/strip ──────────────────────────────────────────
(0, node_test_1.describe)('Copilot instructions merge/strip', () => {
    let tmpDir;
    const vectorContent = '- Follow project conventions\n- Use structured workflows';
    function makeVectorBlock(content) {
        return GSD_COPILOT_INSTRUCTIONS_MARKER + '\n' + content.trim() + '\n' + GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER;
    }
    (0, node_test_1.describe)('mergeCopilotInstructions', () => {
        let tmpMergeDir;
        (0, node_test_1.beforeEach)(() => {
            tmpMergeDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-merge-'));
        });
        (0, node_test_1.afterEach)(() => {
            fs_1.default.rmSync(tmpMergeDir, { recursive: true, force: true });
        });
        (0, node_test_1.test)('creates file from scratch when none exists', () => {
            const filePath = path_1.default.join(tmpMergeDir, 'copilot-instructions.md');
            mergeCopilotInstructions(filePath, vectorContent);
            node_assert_1.default.ok(fs_1.default.existsSync(filePath), 'file was created');
            const result = fs_1.default.readFileSync(filePath, 'utf8');
            node_assert_1.default.ok(result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'has opening marker');
            node_assert_1.default.ok(result.includes(GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER), 'has closing marker');
            node_assert_1.default.ok(result.includes('Follow project conventions'), 'has Vector content');
        });
        (0, node_test_1.test)('replaces Vector section when both markers present', () => {
            const filePath = path_1.default.join(tmpMergeDir, 'copilot-instructions.md');
            const oldContent = '# User Setup\n\n' +
                makeVectorBlock('- Old Vector content') +
                '\n\n# User Notes\n';
            fs_1.default.writeFileSync(filePath, oldContent);
            mergeCopilotInstructions(filePath, vectorContent);
            const result = fs_1.default.readFileSync(filePath, 'utf8');
            node_assert_1.default.ok(result.includes('# User Setup'), 'user content before preserved');
            node_assert_1.default.ok(result.includes('# User Notes'), 'user content after preserved');
            node_assert_1.default.ok(!result.includes('Old Vector content'), 'old Vector content removed');
            node_assert_1.default.ok(result.includes('Follow project conventions'), 'new Vector content inserted');
        });
        (0, node_test_1.test)('appends to existing file when no markers present', () => {
            const filePath = path_1.default.join(tmpMergeDir, 'copilot-instructions.md');
            const userContent = '# My Custom Instructions\n\nDo things my way.\n';
            fs_1.default.writeFileSync(filePath, userContent);
            mergeCopilotInstructions(filePath, vectorContent);
            const result = fs_1.default.readFileSync(filePath, 'utf8');
            node_assert_1.default.ok(result.includes('# My Custom Instructions'), 'original content preserved');
            node_assert_1.default.ok(result.includes('Do things my way.'), 'original text preserved');
            node_assert_1.default.ok(result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'Vector block appended');
            node_assert_1.default.ok(result.includes('Follow project conventions'), 'Vector content appended');
            // Verify separator exists
            node_assert_1.default.ok(result.includes('Do things my way.\n\n' + GSD_COPILOT_INSTRUCTIONS_MARKER), 'double newline separator before Vector block');
        });
        (0, node_test_1.test)('handles file that is Vector-only (re-creates cleanly)', () => {
            const filePath = path_1.default.join(tmpMergeDir, 'copilot-instructions.md');
            const vectorOnly = makeVectorBlock('- Old instructions') + '\n';
            fs_1.default.writeFileSync(filePath, vectorOnly);
            const newContent = '- Updated instructions';
            mergeCopilotInstructions(filePath, newContent);
            const result = fs_1.default.readFileSync(filePath, 'utf8');
            node_assert_1.default.ok(!result.includes('Old instructions'), 'old content removed');
            node_assert_1.default.ok(result.includes('Updated instructions'), 'new content present');
            node_assert_1.default.ok(result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'has opening marker');
            node_assert_1.default.ok(result.includes(GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER), 'has closing marker');
        });
        (0, node_test_1.test)('preserves user content before and after markers', () => {
            const filePath = path_1.default.join(tmpMergeDir, 'copilot-instructions.md');
            const content = '# My Setup\n\n' +
                makeVectorBlock('- old content') +
                '\n\n# My Notes\n';
            fs_1.default.writeFileSync(filePath, content);
            mergeCopilotInstructions(filePath, vectorContent);
            const result = fs_1.default.readFileSync(filePath, 'utf8');
            node_assert_1.default.ok(result.includes('# My Setup'), 'content before markers preserved');
            node_assert_1.default.ok(result.includes('# My Notes'), 'content after markers preserved');
            node_assert_1.default.ok(result.includes('Follow project conventions'), 'new Vector content between markers');
            // Verify ordering: before → Vector → after
            const setupIdx = result.indexOf('# My Setup');
            const markerIdx = result.indexOf(GSD_COPILOT_INSTRUCTIONS_MARKER);
            const notesIdx = result.indexOf('# My Notes');
            node_assert_1.default.ok(setupIdx < markerIdx, 'user setup comes before Vector block');
            node_assert_1.default.ok(markerIdx < notesIdx, 'Vector block comes before user notes');
        });
    });
    (0, node_test_1.describe)('stripGsdFromCopilotInstructions', () => {
        (0, node_test_1.test)('returns null when content is Vector-only', () => {
            const content = makeVectorBlock('- Vector instructions only') + '\n';
            const result = stripGsdFromCopilotInstructions(content);
            node_assert_1.default.strictEqual(result, null, 'returns null for Vector-only content');
        });
        (0, node_test_1.test)('returns cleaned content when user content exists before markers', () => {
            const content = '# My Setup\n\nCustom rules here.\n\n' +
                makeVectorBlock('- Vector stuff') + '\n';
            const result = stripGsdFromCopilotInstructions(content);
            node_assert_1.default.ok(result !== null, 'does not return null');
            node_assert_1.default.ok(result.includes('# My Setup'), 'user content preserved');
            node_assert_1.default.ok(result.includes('Custom rules here.'), 'user text preserved');
            node_assert_1.default.ok(!result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'opening marker removed');
            node_assert_1.default.ok(!result.includes(GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER), 'closing marker removed');
            node_assert_1.default.ok(!result.includes('Vector stuff'), 'Vector content removed');
        });
        (0, node_test_1.test)('returns cleaned content when user content exists after markers', () => {
            const content = makeVectorBlock('- Vector stuff') + '\n\n# My Notes\n\nPersonal notes.\n';
            const result = stripGsdFromCopilotInstructions(content);
            node_assert_1.default.ok(result !== null, 'does not return null');
            node_assert_1.default.ok(result.includes('# My Notes'), 'user content after preserved');
            node_assert_1.default.ok(result.includes('Personal notes.'), 'user text after preserved');
            node_assert_1.default.ok(!result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'opening marker removed');
            node_assert_1.default.ok(!result.includes('Vector stuff'), 'Vector content removed');
        });
        (0, node_test_1.test)('returns cleaned content preserving both before and after', () => {
            const content = '# Before\n\n' + makeVectorBlock('- Vector middle') + '\n\n# After\n';
            const result = stripGsdFromCopilotInstructions(content);
            node_assert_1.default.ok(result !== null, 'does not return null');
            node_assert_1.default.ok(result.includes('# Before'), 'content before preserved');
            node_assert_1.default.ok(result.includes('# After'), 'content after preserved');
            node_assert_1.default.ok(!result.includes('Vector middle'), 'Vector content removed');
            node_assert_1.default.ok(!result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'markers removed');
        });
        (0, node_test_1.test)('returns original content when no markers found', () => {
            const content = '# Just user content\n\nNo Vector markers here.\n';
            const result = stripGsdFromCopilotInstructions(content);
            node_assert_1.default.strictEqual(result, content, 'returns content unchanged');
        });
    });
});
// ─── Copilot uninstall skill removal ───────────────────────────────────────────
(0, node_test_1.describe)('Copilot uninstall skill removal', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-uninstall-'));
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('identifies vector-* skill directories for removal', () => {
        // Create Copilot-like skills directory structure
        const skillsDir = path_1.default.join(tmpDir, 'skills');
        fs_1.default.mkdirSync(path_1.default.join(skillsDir, 'vector-foo'), { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(skillsDir, 'vector-foo', 'SKILL.md'), '# Foo');
        fs_1.default.mkdirSync(path_1.default.join(skillsDir, 'vector-bar'), { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(skillsDir, 'vector-bar', 'SKILL.md'), '# Bar');
        fs_1.default.mkdirSync(path_1.default.join(skillsDir, 'custom-skill'), { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(skillsDir, 'custom-skill', 'SKILL.md'), '# Custom');
        // Test the pattern: read skills, filter vector-* entries
        const entries = fs_1.default.readdirSync(skillsDir, { withFileTypes: true });
        const vectorSkills = entries
            .filter((e) => e.isDirectory() && e.name.startsWith('vector-'))
            .map((e) => e.name);
        const nonVectorSkills = entries
            .filter((e) => e.isDirectory() && !e.name.startsWith('vector-'))
            .map((e) => e.name);
        node_assert_1.default.deepStrictEqual(vectorSkills.sort(), ['vector-bar', 'vector-foo'], 'identifies vector-* skills');
        node_assert_1.default.deepStrictEqual(nonVectorSkills, ['custom-skill'], 'preserves non-vector skills');
    });
    (0, node_test_1.test)('cleans Vector section from copilot-instructions.md on uninstall', () => {
        const content = '# My Setup\n\nMy custom rules.\n\n' +
            GSD_COPILOT_INSTRUCTIONS_MARKER + '\n' +
            '- Vector managed content\n' +
            GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER + '\n';
        const result = stripGsdFromCopilotInstructions(content);
        node_assert_1.default.ok(result !== null, 'does not return null when user content exists');
        node_assert_1.default.ok(result.includes('# My Setup'), 'user content preserved');
        node_assert_1.default.ok(result.includes('My custom rules.'), 'user text preserved');
        node_assert_1.default.ok(!result.includes('Vector managed content'), 'Vector content removed');
        node_assert_1.default.ok(!result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'markers removed');
    });
    (0, node_test_1.test)('deletes copilot-instructions.md when Vector-only on uninstall', () => {
        const content = GSD_COPILOT_INSTRUCTIONS_MARKER + '\n' +
            '- Only Vector content\n' +
            GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER + '\n';
        const result = stripGsdFromCopilotInstructions(content);
        node_assert_1.default.strictEqual(result, null, 'returns null signaling file deletion');
    });
});
// ─── Copilot manifest and patches fixes ────────────────────────────────────────
(0, node_test_1.describe)('Copilot manifest and patches fixes', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-manifest-'));
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('writeManifest hashes skills for Copilot runtime', () => {
        // Create minimal core dir (required by writeManifest)
        const vectorDir = path_1.default.join(tmpDir, 'core', 'bin');
        fs_1.default.mkdirSync(vectorDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(vectorDir, 'verify.cjs'), '// verify stub');
        // Create Copilot skills directory
        const skillDir = path_1.default.join(tmpDir, 'skills', 'vector-test');
        fs_1.default.mkdirSync(skillDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(skillDir, 'SKILL.md'), '# Test Skill\n\nA test skill.');
        const manifest = writeManifest(tmpDir, 'copilot');
        // Check manifest file was written
        const manifestPath = path_1.default.join(tmpDir, 'vector-file-manifest.json');
        node_assert_1.default.ok(fs_1.default.existsSync(manifestPath), 'manifest file created');
        // Read and verify skills are hashed
        const data = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf8'));
        const skillKey = 'skills/vector-test/SKILL.md';
        node_assert_1.default.ok(data.files[skillKey], 'skill file hashed in manifest');
        node_assert_1.default.ok(typeof data.files[skillKey] === 'string', 'hash is a string');
        node_assert_1.default.ok(data.files[skillKey].length === 64, 'hash is SHA-256 (64 hex chars)');
    });
    (0, node_test_1.test)('reportLocalPatches shows /vector-reapply-patches for Copilot', () => {
        // Create patches directory with metadata
        const patchesDir = path_1.default.join(tmpDir, 'vector-local-patches');
        fs_1.default.mkdirSync(patchesDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(patchesDir, 'backup-meta.json'), JSON.stringify({
            from_version: '1.0',
            files: ['skills/vector-test/SKILL.md']
        }));
        // Capture console output
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(' '));
        try {
            const result = reportLocalPatches(tmpDir, 'copilot');
            node_assert_1.default.ok(result.length > 0, 'returns patched files list');
            const output = logs.join('\n');
            node_assert_1.default.ok(output.includes('/vector-reapply-patches'), 'uses dash format for Copilot');
            node_assert_1.default.ok(!output.includes('/vector:reapply-patches'), 'does not use colon format');
        }
        finally {
            console.log = originalLog;
        }
    });
    (0, node_test_1.test)('reportLocalPatches shows /vector:reapply-patches for Claude (unchanged)', () => {
        // Create patches directory with metadata
        const patchesDir = path_1.default.join(tmpDir, 'vector-local-patches');
        fs_1.default.mkdirSync(patchesDir, { recursive: true });
        fs_1.default.writeFileSync(path_1.default.join(patchesDir, 'backup-meta.json'), JSON.stringify({
            from_version: '1.0',
            files: ['core/bin/verify.cjs']
        }));
        // Capture console output
        const logs = [];
        const originalLog = console.log;
        console.log = (...args) => logs.push(args.join(' '));
        try {
            const result = reportLocalPatches(tmpDir, 'claude');
            node_assert_1.default.ok(result.length > 0, 'returns patched files list');
            const output = logs.join('\n');
            node_assert_1.default.ok(output.includes('/vector:reapply-patches'), 'uses colon format for Claude');
        }
        finally {
            console.log = originalLog;
        }
    });
});
// ============================================================================
// E2E Integration Tests — Copilot Install & Uninstall
// ============================================================================
const { execFileSync } = require('child_process');
const crypto = require('crypto');
const INSTALL_PATH = path_1.default.join(__dirname, '..', 'bin', 'install.cjs');
const EXPECTED_SKILLS = 37;
const EXPECTED_AGENTS = 15;
function runCopilotInstall(cwd) {
    const env = { ...process.env };
    delete env.VECTOR_TEST_MODE;
    return execFileSync(process.execPath, [INSTALL_PATH, '--copilot', '--local'], {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
    });
}
function runCopilotUninstall(cwd) {
    const env = { ...process.env };
    delete env.VECTOR_TEST_MODE;
    return execFileSync(process.execPath, [INSTALL_PATH, '--copilot', '--local', '--uninstall'], {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
        env,
    });
}
(0, node_test_1.describe)('E2E: Copilot full install verification', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-e2e-'));
        runCopilotInstall(tmpDir);
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('installs expected number of skill directories', () => {
        const skillsDir = path_1.default.join(tmpDir, '.github', 'skills');
        const entries = fs_1.default.readdirSync(skillsDir, { withFileTypes: true });
        const vectorSkills = entries.filter((e) => e.isDirectory() && e.name.startsWith('vector-'));
        node_assert_1.default.strictEqual(vectorSkills.length, EXPECTED_SKILLS, `Expected ${EXPECTED_SKILLS} skill directories, got ${vectorSkills.length}`);
    });
    (0, node_test_1.test)('each skill directory contains SKILL.md', () => {
        const skillsDir = path_1.default.join(tmpDir, '.github', 'skills');
        const entries = fs_1.default.readdirSync(skillsDir, { withFileTypes: true });
        const vectorSkills = entries.filter((e) => e.isDirectory() && e.name.startsWith('vector-'));
        for (const skill of vectorSkills) {
            const skillMdPath = path_1.default.join(skillsDir, skill.name, 'SKILL.md');
            node_assert_1.default.ok(fs_1.default.existsSync(skillMdPath), `Missing SKILL.md in ${skill.name}`);
        }
    });
    (0, node_test_1.test)('installs expected number of agent files', () => {
        const agentsDir = path_1.default.join(tmpDir, '.github', 'agents');
        const files = fs_1.default.readdirSync(agentsDir);
        const vectorAgents = files.filter((f) => f.startsWith('vector-') && f.endsWith('.agent.md'));
        node_assert_1.default.strictEqual(vectorAgents.length, EXPECTED_AGENTS, `Expected ${EXPECTED_AGENTS} agent files, got ${vectorAgents.length}`);
    });
    (0, node_test_1.test)('installs all expected agent files', () => {
        const agentsDir = path_1.default.join(tmpDir, '.github', 'agents');
        const files = fs_1.default.readdirSync(agentsDir);
        const vectorAgents = files.filter((f) => f.startsWith('vector-') && f.endsWith('.agent.md')).sort();
        const expected = [
            'vector-codebase-mapper.agent.md',
            'vector-debugger.agent.md',
            'vector-executor.agent.md',
            'vector-integration-checker.agent.md',
            'vector-nyquist-auditor.agent.md',
            'vector-phase-researcher.agent.md',
            'vector-plan-checker.agent.md',
            'vector-planner.agent.md',
            'vector-project-researcher.agent.md',
            'vector-research-synthesizer.agent.md',
            'vector-roadmapper.agent.md',
            'vector-ui-auditor.agent.md',
            'vector-ui-checker.agent.md',
            'vector-ui-researcher.agent.md',
            'vector-verifier.agent.md',
        ].sort();
        node_assert_1.default.deepStrictEqual(vectorAgents, expected);
    });
    (0, node_test_1.test)('generates copilot-instructions.md with Vector markers', () => {
        const instrPath = path_1.default.join(tmpDir, '.github', 'copilot-instructions.md');
        node_assert_1.default.ok(fs_1.default.existsSync(instrPath), 'copilot-instructions.md should exist');
        const content = fs_1.default.readFileSync(instrPath, 'utf-8');
        node_assert_1.default.ok(content.includes('<!-- Vector Configuration'), 'Should contain Vector Configuration open marker');
        node_assert_1.default.ok(content.includes('<!-- /Vector Configuration -->'), 'Should contain Vector Configuration close marker');
    });
    (0, node_test_1.test)('creates manifest with correct structure', () => {
        const manifestPath = path_1.default.join(tmpDir, '.github', 'vector-file-manifest.json');
        node_assert_1.default.ok(fs_1.default.existsSync(manifestPath), 'vector-file-manifest.json should exist');
        const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
        node_assert_1.default.ok(manifest.version, 'manifest should have version');
        node_assert_1.default.ok(manifest.timestamp, 'manifest should have timestamp');
        node_assert_1.default.ok(manifest.files && typeof manifest.files === 'object', 'manifest should have files object');
        node_assert_1.default.ok(Object.keys(manifest.files).length > 0, 'manifest files should not be empty');
    });
    (0, node_test_1.test)('manifest contains expected file categories', () => {
        const manifestPath = path_1.default.join(tmpDir, '.github', 'vector-file-manifest.json');
        const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
        const keys = Object.keys(manifest.files);
        const skillEntries = keys.filter((k) => k.startsWith('skills/'));
        const agentEntries = keys.filter((k) => k.startsWith('agents/'));
        const engineEntries = keys.filter((k) => k.startsWith('core/'));
        node_assert_1.default.strictEqual(skillEntries.length, EXPECTED_SKILLS, `Expected ${EXPECTED_SKILLS} skill manifest entries, got ${skillEntries.length}`);
        node_assert_1.default.strictEqual(agentEntries.length, EXPECTED_AGENTS, `Expected ${EXPECTED_AGENTS} agent manifest entries, got ${agentEntries.length}`);
        node_assert_1.default.ok(engineEntries.length > 0, 'Should have core/ engine manifest entries');
    });
    (0, node_test_1.test)('manifest SHA256 hashes match actual file contents', () => {
        const manifestPath = path_1.default.join(tmpDir, '.github', 'vector-file-manifest.json');
        const manifest = JSON.parse(fs_1.default.readFileSync(manifestPath, 'utf-8'));
        const githubDir = path_1.default.join(tmpDir, '.github');
        for (const [relPath, expectedHash] of Object.entries(manifest.files)) {
            const filePath = path_1.default.join(githubDir, relPath);
            node_assert_1.default.ok(fs_1.default.existsSync(filePath), `Manifest references ${relPath} but file does not exist`);
            const content = fs_1.default.readFileSync(filePath);
            const actualHash = crypto.createHash('sha256').update(content).digest('hex');
            node_assert_1.default.strictEqual(actualHash, expectedHash, `SHA256 mismatch for ${relPath}: expected ${expectedHash}, got ${actualHash}`);
        }
    });
    (0, node_test_1.test)('engine directory contains required subdirectories and files', () => {
        const engineDir = path_1.default.join(tmpDir, '.github', 'core');
        const requiredDirs = ['bin', 'references', 'templates', 'workflows'];
        const requiredFiles = ['CHANGELOG.md', 'VERSION'];
        for (const dir of requiredDirs) {
            const dirPath = path_1.default.join(engineDir, dir);
            node_assert_1.default.ok(fs_1.default.existsSync(dirPath) && fs_1.default.statSync(dirPath).isDirectory(), `Engine should contain directory: ${dir}`);
        }
        for (const file of requiredFiles) {
            const filePath = path_1.default.join(engineDir, file);
            node_assert_1.default.ok(fs_1.default.existsSync(filePath) && fs_1.default.statSync(filePath).isFile(), `Engine should contain file: ${file}`);
        }
    });
});
(0, node_test_1.describe)('E2E: Copilot uninstall verification', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-e2e-'));
        runCopilotInstall(tmpDir);
        runCopilotUninstall(tmpDir);
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    (0, node_test_1.test)('removes engine directory', () => {
        const engineDir = path_1.default.join(tmpDir, '.github', 'core');
        node_assert_1.default.ok(!fs_1.default.existsSync(engineDir), 'core directory should not exist after uninstall');
    });
    (0, node_test_1.test)('removes copilot-instructions.md', () => {
        const instrPath = path_1.default.join(tmpDir, '.github', 'copilot-instructions.md');
        node_assert_1.default.ok(!fs_1.default.existsSync(instrPath), 'copilot-instructions.md should not exist after uninstall');
    });
    (0, node_test_1.test)('removes all Vector skill directories', () => {
        const skillsDir = path_1.default.join(tmpDir, '.github', 'skills');
        if (fs_1.default.existsSync(skillsDir)) {
            const entries = fs_1.default.readdirSync(skillsDir, { withFileTypes: true });
            const vectorSkills = entries.filter((e) => e.isDirectory() && e.name.startsWith('vector-'));
            node_assert_1.default.strictEqual(vectorSkills.length, 0, `Expected 0 Vector skill directories after uninstall, found: ${vectorSkills.map((e) => e.name).join(', ')}`);
        }
    });
    (0, node_test_1.test)('removes all Vector agent files', () => {
        const agentsDir = path_1.default.join(tmpDir, '.github', 'agents');
        if (fs_1.default.existsSync(agentsDir)) {
            const files = fs_1.default.readdirSync(agentsDir);
            const vectorAgents = files.filter((f) => f.startsWith('vector-') && f.endsWith('.agent.md'));
            node_assert_1.default.strictEqual(vectorAgents.length, 0, `Expected 0 Vector agent files after uninstall, found: ${vectorAgents.join(', ')}`);
        }
    });
    (0, node_test_1.test)('preserves non-Vector content in skills directory', () => {
        // Standalone lifecycle: install → add custom content → uninstall → verify
        const td = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-e2e-preserve-skill-'));
        try {
            runCopilotInstall(td);
            // Add non-Vector custom skill
            const customSkillDir = path_1.default.join(td, '.github', 'skills', 'my-custom-skill');
            fs_1.default.mkdirSync(customSkillDir, { recursive: true });
            fs_1.default.writeFileSync(path_1.default.join(customSkillDir, 'SKILL.md'), '# My Custom Skill\n');
            // Uninstall
            runCopilotUninstall(td);
            // Verify custom content preserved
            node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(customSkillDir, 'SKILL.md')), 'Non-Vector skill directory and SKILL.md should be preserved after uninstall');
        }
        finally {
            fs_1.default.rmSync(td, { recursive: true, force: true });
        }
    });
    (0, node_test_1.test)('preserves non-Vector content in agents directory', () => {
        // Standalone lifecycle: install → add custom content → uninstall → verify
        const td = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-e2e-preserve-agent-'));
        try {
            runCopilotInstall(td);
            // Add non-Vector custom agent
            const customAgentPath = path_1.default.join(td, '.github', 'agents', 'my-agent.md');
            fs_1.default.writeFileSync(customAgentPath, '# My Custom Agent\n');
            // Uninstall
            runCopilotUninstall(td);
            // Verify custom content preserved
            node_assert_1.default.ok(fs_1.default.existsSync(customAgentPath), 'Non-Vector agent file should be preserved after uninstall');
        }
        finally {
            fs_1.default.rmSync(td, { recursive: true, force: true });
        }
    });
});
//# sourceMappingURL=copilot-install.test.cjs.map