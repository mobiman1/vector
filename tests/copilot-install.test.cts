/**
 * Vector Tools Tests - Copilot Install Plumbing
 *
 * Tests for Copilot runtime directory resolution, config paths,
 * and integration with the multi-runtime installer.
 *
 * Requirements: CLI-01, CLI-02, CLI-03, CLI-04, CLI-05, CLI-06
 */

process.env.VECTOR_TEST_MODE = '1';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import path from 'path';
import os from 'os';
import fs from 'fs';

const {
  getDirName,
  getGlobalDir,
  getConfigDirFromHome,
  claudeToCopilotTools,
  convertCopilotToolName,
  convertClaudeToCopilotContent,
  convertClaudeCommandToCopilotSkill,
  convertClaudeAgentToCopilotAgent,
  copyCommandsAsCopilotSkills,
  GSD_COPILOT_INSTRUCTIONS_MARKER,
  GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER,
  mergeCopilotInstructions,
  stripGsdFromCopilotInstructions,
  writeManifest,
  reportLocalPatches,
} = require('../bin/install.cjs');

// ─── getDirName ─────────────────────────────────────────────────────────────────

describe('getDirName (Copilot)', () => {
  test('returns .github for copilot', () => {
    assert.strictEqual(getDirName('copilot'), '.github');
  });

  test('does not break existing runtimes', () => {
    assert.strictEqual(getDirName('claude'), '.claude');
    assert.strictEqual(getDirName('opencode'), '.opencode');
    assert.strictEqual(getDirName('gemini'), '.gemini');
    assert.strictEqual(getDirName('codex'), '.codex');
  });
});

// ─── getGlobalDir ───────────────────────────────────────────────────────────────

describe('getGlobalDir (Copilot)', () => {
  test('returns ~/.copilot with no env var or explicit dir', () => {
    const original = process.env.COPILOT_CONFIG_DIR;
    try {
      delete process.env.COPILOT_CONFIG_DIR;
      const result = getGlobalDir('copilot');
      assert.strictEqual(result, path.join(os.homedir(), '.copilot'));
    } finally {
      if (original !== undefined) {
        process.env.COPILOT_CONFIG_DIR = original;
      } else {
        delete process.env.COPILOT_CONFIG_DIR;
      }
    }
  });

  test('returns explicit dir when provided', () => {
    const result = getGlobalDir('copilot', '/custom/path');
    assert.strictEqual(result, '/custom/path');
  });

  test('respects COPILOT_CONFIG_DIR env var', () => {
    const original = process.env.COPILOT_CONFIG_DIR;
    try {
      process.env.COPILOT_CONFIG_DIR = '~/custom-copilot';
      const result = getGlobalDir('copilot');
      assert.strictEqual(result, path.join(os.homedir(), 'custom-copilot'));
    } finally {
      if (original !== undefined) {
        process.env.COPILOT_CONFIG_DIR = original;
      } else {
        delete process.env.COPILOT_CONFIG_DIR;
      }
    }
  });

  test('explicit dir takes priority over COPILOT_CONFIG_DIR', () => {
    const original = process.env.COPILOT_CONFIG_DIR;
    try {
      process.env.COPILOT_CONFIG_DIR = '~/env-path';
      const result = getGlobalDir('copilot', '/explicit/path');
      assert.strictEqual(result, '/explicit/path');
    } finally {
      if (original !== undefined) {
        process.env.COPILOT_CONFIG_DIR = original;
      } else {
        delete process.env.COPILOT_CONFIG_DIR;
      }
    }
  });

  test('does not break existing runtimes', () => {
    assert.strictEqual(getGlobalDir('claude'), path.join(os.homedir(), '.claude'));
    assert.strictEqual(getGlobalDir('codex'), path.join(os.homedir(), '.codex'));
  });
});

// ─── getConfigDirFromHome ───────────────────────────────────────────────────────

describe('getConfigDirFromHome (Copilot)', () => {
  test('returns .github path string for local (isGlobal=false)', () => {
    assert.strictEqual(getConfigDirFromHome('copilot', false), "'.github'");
  });

  test('returns .copilot path string for global (isGlobal=true)', () => {
    assert.strictEqual(getConfigDirFromHome('copilot', true), "'.copilot'");
  });

  test('does not break existing runtimes', () => {
    assert.strictEqual(getConfigDirFromHome('opencode', true), "'.config', 'opencode'");
    assert.strictEqual(getConfigDirFromHome('claude', true), "'.claude'");
    assert.strictEqual(getConfigDirFromHome('gemini', true), "'.gemini'");
    assert.strictEqual(getConfigDirFromHome('codex', true), "'.codex'");
  });
});

// ─── Source code integration checks ─────────────────────────────────────────────

describe('Source code integration (Copilot)', () => {
  const src = fs.readFileSync(path.join(__dirname, '..', 'bin', 'install.cjs'), 'utf8');

  test('CLI-01: --copilot flag parsing exists', () => {
    assert.ok(src.includes("args.includes('--copilot')"), '--copilot flag parsed');
  });

  test('CLI-03: --all array includes copilot', () => {
    assert.ok(
      src.includes("'copilot'") && src.includes('selectedRuntimes = ['),
      '--all includes copilot runtime'
    );
  });

  test('CLI-06: banner text includes Copilot', () => {
    assert.ok(src.includes('Copilot'), 'banner mentions Copilot');
  });

  test('CLI-06: help text includes --copilot', () => {
    assert.ok(src.includes('--copilot'), 'help text has --copilot option');
  });

  test('CLI-02: promptRuntime has Copilot as option 5', () => {
    assert.ok(src.includes("choice === '5'"), 'choice 5 exists');
    // Verify choice 5 maps to copilot (the line after choice === '5' should reference copilot)
    const choice5Index = src.indexOf("choice === '5'");
    const nextLines = src.substring(choice5Index, choice5Index + 100);
    assert.ok(nextLines.includes('copilot'), 'choice 5 maps to copilot');
  });

  test('CLI-02: promptRuntime has All option including copilot', () => {
    // All option callback includes copilot in the runtimes array
    const allCallbackMatch = src.match(/callback\(\[(['a-z', ]+)\]\)/g);
    assert.ok(allCallbackMatch && allCallbackMatch.some((m: any) => m.includes('copilot')), 'All option includes copilot');
  });

  test('isCopilot variable exists in install function', () => {
    assert.ok(src.includes("const isCopilot = runtime === 'copilot'"), 'isCopilot defined');
  });

  test('hooks are skipped for Copilot', () => {
    assert.ok(src.includes('!isCodex && !isCopilot'), 'hooks skip check includes copilot');
  });

  test('--both flag unchanged (still claude + opencode only)', () => {
    // Verify the else-if-hasBoth maps to ['claude', 'opencode'] — NOT including copilot
    const bothUsage = src.indexOf('else if (hasBoth)');
    assert.ok(bothUsage > 0, 'hasBoth usage exists');
    const bothSection = src.substring(bothUsage, bothUsage + 200);
    assert.ok(bothSection.includes("['claude', 'opencode']"), '--both maps to claude+opencode');
    assert.ok(!bothSection.includes('copilot'), '--both does NOT include copilot');
  });
});

// ─── convertCopilotToolName ─────────────────────────────────────────────────────

describe('convertCopilotToolName', () => {
  test('maps Read to read', () => {
    assert.strictEqual(convertCopilotToolName('Read'), 'read');
  });

  test('maps Write to edit', () => {
    assert.strictEqual(convertCopilotToolName('Write'), 'edit');
  });

  test('maps Edit to edit (same as Write)', () => {
    assert.strictEqual(convertCopilotToolName('Edit'), 'edit');
  });

  test('maps Bash to execute', () => {
    assert.strictEqual(convertCopilotToolName('Bash'), 'execute');
  });

  test('maps Grep to search', () => {
    assert.strictEqual(convertCopilotToolName('Grep'), 'search');
  });

  test('maps Glob to search (same as Grep)', () => {
    assert.strictEqual(convertCopilotToolName('Glob'), 'search');
  });

  test('maps Task to agent', () => {
    assert.strictEqual(convertCopilotToolName('Task'), 'agent');
  });

  test('maps WebSearch to web', () => {
    assert.strictEqual(convertCopilotToolName('WebSearch'), 'web');
  });

  test('maps WebFetch to web (same as WebSearch)', () => {
    assert.strictEqual(convertCopilotToolName('WebFetch'), 'web');
  });

  test('maps TodoWrite to todo', () => {
    assert.strictEqual(convertCopilotToolName('TodoWrite'), 'todo');
  });

  test('maps AskUserQuestion to ask_user', () => {
    assert.strictEqual(convertCopilotToolName('AskUserQuestion'), 'ask_user');
  });

  test('maps SlashCommand to skill', () => {
    assert.strictEqual(convertCopilotToolName('SlashCommand'), 'skill');
  });

  test('maps mcp__context7__ prefix to io.github.upstash/context7/', () => {
    assert.strictEqual(
      convertCopilotToolName('mcp__context7__resolve-library-id'),
      'io.github.upstash/context7/resolve-library-id'
    );
  });

  test('maps mcp__context7__* wildcard', () => {
    assert.strictEqual(
      convertCopilotToolName('mcp__context7__*'),
      'io.github.upstash/context7/*'
    );
  });

  test('lowercases unknown tools as fallback', () => {
    assert.strictEqual(convertCopilotToolName('SomeNewTool'), 'somenewtool');
  });

  test('mapping constant has 13 entries (12 direct + mcp handled separately)', () => {
    assert.strictEqual(Object.keys(claudeToCopilotTools).length, 12);
  });
});

// ─── convertClaudeToCopilotContent ──────────────────────────────────────────────

describe('convertClaudeToCopilotContent', () => {
  test('replaces ~/.claude/ with .github/ in local mode (default)', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('see ~/.claude/foo'),
      'see .github/foo'
    );
  });

  test('replaces ~/.claude/ with ~/.copilot/ in global mode', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('see ~/.claude/foo', true),
      'see ~/.copilot/foo'
    );
  });

  test('replaces ./.claude/ with ./.github/', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('at ./.claude/bar'),
      'at ./.github/bar'
    );
  });

  test('replaces bare .claude/ with .github/', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('in .claude/baz'),
      'in .github/baz'
    );
  });

  test('replaces $HOME/.claude/ with .github/ in local mode (default)', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('"$HOME/.claude/config"'),
      '".github/config"'
    );
  });

  test('replaces $HOME/.claude/ with $HOME/.copilot/ in global mode', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('"$HOME/.claude/config"', true),
      '"$HOME/.copilot/config"'
    );
  });

  test('converts vector: to vector- in command names', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('run /vector:health or vector:progress'),
      'run /vector-health or vector-progress'
    );
  });

  test('handles mixed content in local mode', () => {
    const input = 'Config at ~/.claude/settings and $HOME/.claude/config.\n' +
      'Local at ./.claude/data and .claude/commands.\n' +
      'Run vector:health and /vector:progress.';
    const result = convertClaudeToCopilotContent(input);
    assert.ok(result.includes('.github/settings'), 'tilde path converted to local');
    assert.ok(!result.includes('$HOME/.claude/'), '$HOME path converted');
    assert.ok(result.includes('./.github/data'), 'dot-slash path converted');
    assert.ok(result.includes('.github/commands'), 'bare path converted');
    assert.ok(result.includes('vector-health'), 'command name converted');
    assert.ok(result.includes('/vector-progress'), 'slash command converted');
  });

  test('handles mixed content in global mode', () => {
    const input = 'Config at ~/.claude/settings and $HOME/.claude/config.\n' +
      'Local at ./.claude/data and .claude/commands.\n' +
      'Run vector:health and /vector:progress.';
    const result = convertClaudeToCopilotContent(input, true);
    assert.ok(result.includes('~/.copilot/settings'), 'tilde path converted to global');
    assert.ok(result.includes('$HOME/.copilot/config'), '$HOME path converted to global');
    assert.ok(result.includes('./.github/data'), 'dot-slash path converted');
    assert.ok(result.includes('.github/commands'), 'bare path converted');
  });

  test('does not double-replace in local mode', () => {
    const input = '~/.claude/foo and ./.claude/bar and .claude/baz';
    const result = convertClaudeToCopilotContent(input);
    assert.ok(!result.includes('.github/.github/'), 'no .github/.github/ artifact');
    assert.strictEqual(result, '.github/foo and ./.github/bar and .github/baz');
  });

  test('does not double-replace in global mode', () => {
    const input = '~/.claude/foo and ./.claude/bar and .claude/baz';
    const result = convertClaudeToCopilotContent(input, true);
    assert.ok(!result.includes('.copilot/.github/'), 'no .copilot/.github/ artifact');
    assert.strictEqual(result, '~/.copilot/foo and ./.github/bar and .github/baz');
  });

  test('preserves content with no matches', () => {
    assert.strictEqual(
      convertClaudeToCopilotContent('hello world'),
      'hello world'
    );
  });
});

// ─── convertClaudeCommandToCopilotSkill ─────────────────────────────────────────

describe('convertClaudeCommandToCopilotSkill', () => {
  test('converts frontmatter with all fields', () => {
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
    assert.ok(result.startsWith('---\nname: vector-health\n'), 'name uses param');
    assert.ok(result.includes('description: Diagnose planning directory health'), 'description preserved');
    assert.ok(result.includes('argument-hint: "[--repair]"'), 'argument-hint double-quoted');
    assert.ok(result.includes('allowed-tools: Read, Bash, Write, AskUserQuestion'), 'tools comma-separated');
    assert.ok(result.includes('.github/foo'), 'CONV-06 applied to body (local mode default)');
    assert.ok(result.includes('vector-health'), 'CONV-07 applied to body');
    assert.ok(!result.includes('vector:health'), 'no vector: references remain');
  });

  test('handles skill without allowed-tools', () => {
    const input = `---
name: vector:help
description: Show available Vector commands
---

Help content.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'vector-help');
    assert.ok(result.includes('name: vector-help'), 'name set');
    assert.ok(result.includes('description: Show available Vector commands'), 'description preserved');
    assert.ok(!result.includes('allowed-tools:'), 'no allowed-tools line');
  });

  test('handles skill without argument-hint', () => {
    const input = `---
name: vector:progress
description: Show project progress
allowed-tools:
  - Read
  - Bash
---

Progress body.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'vector-progress');
    assert.ok(!result.includes('argument-hint:'), 'no argument-hint line');
    assert.ok(result.includes('allowed-tools: Read, Bash'), 'tools present');
  });

  test('argument-hint with inner single quotes uses double-quote YAML delimiter', () => {
    const input = `---
name: vector:new-milestone
description: Start milestone
argument-hint: "[milestone name, e.g., 'v1.1 Notifications']"
allowed-tools:
  - Read
---

Body.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'vector-new-milestone');
    assert.ok(result.includes(`argument-hint: "[milestone name, e.g., 'v1.1 Notifications']"`), 'inner single quotes preserved with double-quote delimiter');
  });

  test('applies CONV-06 path conversion to body (local mode)', () => {
    const input = `---
name: vector:test
description: Test skill
---

Check ~/.claude/settings and ./.claude/local and $HOME/.claude/global.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'vector-test');
    assert.ok(result.includes('.github/settings'), 'tilde path converted to local');
    assert.ok(result.includes('./.github/local'), 'dot-slash path converted');
    assert.ok(result.includes('.github/global'), '$HOME path converted to local');
  });

  test('applies CONV-06 path conversion to body (global mode)', () => {
    const input = `---
name: vector:test
description: Test skill
---

Check ~/.claude/settings and ./.claude/local and $HOME/.claude/global.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'vector-test', true);
    assert.ok(result.includes('~/.copilot/settings'), 'tilde path converted to global');
    assert.ok(result.includes('./.github/local'), 'dot-slash path converted');
    assert.ok(result.includes('$HOME/.copilot/global'), '$HOME path converted to global');
  });

  test('applies CONV-07 command name conversion to body', () => {
    const input = `---
name: vector:test
description: Test skill
---

Run vector:health and /vector:progress for diagnostics.`;

    const result = convertClaudeCommandToCopilotSkill(input, 'vector-test');
    assert.ok(result.includes('vector-health'), 'vector:health converted');
    assert.ok(result.includes('/vector-progress'), '/vector:progress converted');
    assert.ok(!result.match(/vector:[a-z]/), 'no vector: command refs remain');
  });

  test('handles content without frontmatter (local mode)', () => {
    const input = 'Just some markdown with ~/.claude/path and vector:health.';
    const result = convertClaudeCommandToCopilotSkill(input, 'vector-test');
    assert.ok(result.includes('.github/path'), 'CONV-06 applied (local)');
    assert.ok(result.includes('vector-health'), 'CONV-07 applied');
    assert.ok(!result.includes('---'), 'no frontmatter added');
  });

  test('preserves agent field in frontmatter', () => {
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
    assert.ok(result.includes('agent: vector-planner'), 'agent field preserved');
  });
});

// ─── convertClaudeAgentToCopilotAgent ───────────────────────────────────────────

describe('convertClaudeAgentToCopilotAgent', () => {
  test('maps and deduplicates tools', () => {
    const input = `---
name: vector-executor
description: Executes Vector plans
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
---

Agent body.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes("tools: ['read', 'edit', 'execute', 'search']"), 'tools mapped and deduped');
  });

  test('formats tools as JSON array', () => {
    const input = `---
name: vector-test
description: Test agent
tools: Read, Bash
---

Body.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.match(/tools: \['[a-z_]+'(, '[a-z_]+')*\]/), 'tools formatted as JSON array');
  });

  test('preserves name description and color', () => {
    const input = `---
name: vector-executor
description: Executes Vector plans with atomic commits
tools: Read, Bash
color: yellow
---

Body.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes('name: vector-executor'), 'name preserved');
    assert.ok(result.includes('description: Executes Vector plans with atomic commits'), 'description preserved');
    assert.ok(result.includes('color: yellow'), 'color preserved');
  });

  test('handles mcp__context7__ tools', () => {
    const input = `---
name: vector-researcher
description: Research agent
tools: Read, Bash, mcp__context7__resolve-library-id
color: cyan
---

Body.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes('io.github.upstash/context7/resolve-library-id'), 'mcp tool mapped');
    assert.ok(!result.includes('mcp__context7__'), 'no mcp__ prefix remains');
  });

  test('handles agent with no tools field', () => {
    const input = `---
name: vector-empty
description: Empty agent
color: green
---

Body.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes('tools: []'), 'missing tools produces []');
  });

  test('applies CONV-06 and CONV-07 to body (local mode)', () => {
    const input = `---
name: vector-test
description: Test
tools: Read
---

Check ~/.claude/settings and run vector:health.`;

    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes('.github/settings'), 'CONV-06 applied (local)');
    assert.ok(result.includes('vector-health'), 'CONV-07 applied');
    assert.ok(!result.includes('~/.claude/'), 'no ~/.claude/ remains');
    assert.ok(!result.match(/vector:[a-z]/), 'no vector: command refs remain');
  });

  test('applies CONV-06 and CONV-07 to body (global mode)', () => {
    const input = `---
name: vector-test
description: Test
tools: Read
---

Check ~/.claude/settings and run vector:health.`;

    const result = convertClaudeAgentToCopilotAgent(input, true);
    assert.ok(result.includes('~/.copilot/settings'), 'CONV-06 applied (global)');
    assert.ok(result.includes('vector-health'), 'CONV-07 applied');
  });

  test('handles content without frontmatter (local mode)', () => {
    const input = 'Just markdown with ~/.claude/path and vector:test.';
    const result = convertClaudeAgentToCopilotAgent(input);
    assert.ok(result.includes('.github/path'), 'CONV-06 applied (local)');
    assert.ok(result.includes('vector-test'), 'CONV-07 applied');
    assert.ok(!result.includes('---'), 'no frontmatter added');
  });
});

// ─── copyCommandsAsCopilotSkills (integration) ─────────────────────────────────

describe('copyCommandsAsCopilotSkills', () => {
  const srcDir = path.join(__dirname, '..', 'commands', 'vector');

  test('creates skill folders from source commands', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-copilot-skills-'));
    try {
      copyCommandsAsCopilotSkills(srcDir, tempDir, 'vector');

      // Check specific folders exist
      assert.ok(fs.existsSync(path.join(tempDir, 'vector-health')), 'vector-health folder exists');
      assert.ok(fs.existsSync(path.join(tempDir, 'vector-health', 'SKILL.md')), 'vector-health/SKILL.md exists');
      assert.ok(fs.existsSync(path.join(tempDir, 'vector-help')), 'vector-help folder exists');
      assert.ok(fs.existsSync(path.join(tempDir, 'vector-progress')), 'vector-progress folder exists');

      // Count vector-* directories — should be 31
      const dirs = fs.readdirSync(tempDir, { withFileTypes: true })
        .filter((e: any) => e.isDirectory() && e.name.startsWith('vector-'));
      assert.strictEqual(dirs.length, 37, `expected 37 skill folders, got ${dirs.length}`);
    } finally {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  test('skill content has Copilot frontmatter format', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-copilot-skills-'));
    try {
      copyCommandsAsCopilotSkills(srcDir, tempDir, 'vector');

      const skillContent = fs.readFileSync(path.join(tempDir, 'vector-health', 'SKILL.md'), 'utf8');
      // Frontmatter format checks
      assert.ok(skillContent.startsWith('---\nname: vector-health\n'), 'starts with name: vector-health');
      assert.ok(skillContent.includes('allowed-tools: Read, Bash, Write, AskUserQuestion'),
        'allowed-tools is comma-separated');
      assert.ok(!skillContent.includes('allowed-tools:\n  -'), 'NOT YAML multiline format');
      // CONV-06/07 applied
      assert.ok(!skillContent.includes('~/.claude/'), 'no ~/.claude/ references');
      assert.ok(!skillContent.match(/vector:[a-z]/), 'no vector: command references');
    } finally {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  test('generates vector-autonomous skill from autonomous.md command', () => {
    // Fail-fast: source command must exist
    const srcFile = path.join(srcDir, 'autonomous.md');
    assert.ok(fs.existsSync(srcFile), 'commands/vector/autonomous.md must exist as source');

    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-copilot-skills-'));
    try {
      copyCommandsAsCopilotSkills(srcDir, tempDir, 'vector');

      // Skill folder and file created
      assert.ok(fs.existsSync(path.join(tempDir, 'vector-autonomous')), 'vector-autonomous folder exists');
      assert.ok(fs.existsSync(path.join(tempDir, 'vector-autonomous', 'SKILL.md')), 'vector-autonomous/SKILL.md exists');

      const skillContent = fs.readFileSync(path.join(tempDir, 'vector-autonomous', 'SKILL.md'), 'utf8');

      // Frontmatter: name converted from vector:autonomous to vector-autonomous
      assert.ok(skillContent.startsWith('---\nname: vector-autonomous\n'), 'name is vector-autonomous');
      assert.ok(skillContent.includes('description: Run all remaining phases autonomously'),
        'description preserved');
      // argument-hint present and double-quoted
      assert.ok(skillContent.includes('argument-hint: "[--from N]"'), 'argument-hint present and quoted');
      // allowed-tools comma-separated
      assert.ok(skillContent.includes('allowed-tools: Read, Write, Bash, Glob, Grep, AskUserQuestion, Task'),
        'allowed-tools is comma-separated');
      // No Claude-format remnants
      assert.ok(!skillContent.includes('allowed-tools:\n  -'), 'NOT YAML multiline format');
      assert.ok(!skillContent.includes('~/.claude/'), 'no ~/.claude/ references in body');
    } finally {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  test('autonomous skill body converts vector: to vector- (CONV-07)', () => {
    // Use convertClaudeToCopilotContent directly on the command body content
    const srcContent = fs.readFileSync(path.join(srcDir, 'autonomous.md'), 'utf8');
    const result = convertClaudeToCopilotContent(srcContent);

    // vector:autonomous references should be converted to vector-autonomous
    assert.ok(!result.match(/vector:[a-z]/), 'no vector: command references remain after conversion');
    // Specific: vector:discuss-phase, vector:plan-phase, vector:execute-phase mentioned in body
    // The body references vector-tools.cjs (not a vector: command) — those should be unaffected
    // But /vector:autonomous → /vector-autonomous, vector:discuss-phase → vector-discuss-phase etc.
    if (srcContent.includes('vector:autonomous')) {
      assert.ok(result.includes('vector-autonomous'), 'vector:autonomous converted to vector-autonomous');
    }
    // Path conversion: ~/.claude/ → .github/
    assert.ok(!result.includes('~/.claude/'), 'no ~/.claude/ paths remain');
  });

  test('cleans up old skill directories on re-run', () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-copilot-skills-'));
    try {
      // Create a fake old directory
      fs.mkdirSync(path.join(tempDir, 'vector-fake-old'), { recursive: true });
      fs.writeFileSync(path.join(tempDir, 'vector-fake-old', 'SKILL.md'), 'old');
      assert.ok(fs.existsSync(path.join(tempDir, 'vector-fake-old')), 'fake old dir exists before');

      // Run copy — should clean up old dirs
      copyCommandsAsCopilotSkills(srcDir, tempDir, 'vector');

      assert.ok(!fs.existsSync(path.join(tempDir, 'vector-fake-old')), 'fake old dir removed');
      assert.ok(fs.existsSync(path.join(tempDir, 'vector-health')), 'real dirs still exist');
    } finally {
      fs.rmSync(tempDir, { recursive: true });
    }
  });
});

// ─── Copilot agent conversion - real files ──────────────────────────────────────

describe('Copilot agent conversion - real files', () => {
  const agentsSrc = path.join(__dirname, '..', 'agents');

  test('converts vector-executor agent correctly', () => {
    const content = fs.readFileSync(path.join(agentsSrc, 'vector-executor.md'), 'utf8');
    const result = convertClaudeAgentToCopilotAgent(content);

    assert.ok(result.startsWith('---\nname: vector-executor\n'), 'starts with correct name');
    // 6 Claude tools (Read, Write, Edit, Bash, Grep, Glob) → 4 after dedup
    assert.ok(result.includes("tools: ['read', 'edit', 'execute', 'search']"),
      'tools mapped and deduplicated (6→4)');
    assert.ok(result.includes('color: yellow'), 'color preserved');
    assert.ok(!result.includes('~/.claude/'), 'no ~/.claude/ in body');
  });

  test('converts agent with mcp wildcard tools correctly', () => {
    const content = fs.readFileSync(path.join(agentsSrc, 'vector-phase-researcher.md'), 'utf8');
    const result = convertClaudeAgentToCopilotAgent(content);

    const toolsLine = result.split('\n').find((l: any) => l.startsWith('tools:'));
    assert.ok(toolsLine.includes('io.github.upstash/context7/*'), 'mcp wildcard mapped in tools');
    assert.ok(!toolsLine.includes('mcp__context7__'), 'no mcp__ prefix in tools line');
    assert.ok(toolsLine.includes("'web'"), 'WebSearch/WebFetch deduplicated to web');
    assert.ok(toolsLine.includes("'read'"), 'Read mapped');
  });

  test('all 15 agents convert without error', () => {
    const agents = fs.readdirSync(agentsSrc)
      .filter((f: any) => f.startsWith('vector-') && f.endsWith('.md'));
    assert.strictEqual(agents.length, 15, `expected 15 agents, got ${agents.length}`);

    for (const agentFile of agents) {
      const content = fs.readFileSync(path.join(agentsSrc, agentFile), 'utf8');
      const result = convertClaudeAgentToCopilotAgent(content);
      assert.ok(result.startsWith('---\n'), `${agentFile} should have frontmatter`);
      assert.ok(result.includes('tools:'), `${agentFile} should have tools field`);
      assert.ok(!result.includes('~/.claude/'), `${agentFile} should not contain ~/.claude/`);
    }
  });
});

// ─── Copilot content conversion - engine files ─────────────────────────────────

describe('Copilot content conversion - engine files', () => {
  test('converts engine .md files correctly (local mode default)', () => {
    const healthMd = fs.readFileSync(
      path.join(__dirname, '..', 'core', 'workflows', 'health.md'), 'utf8'
    );
    const result = convertClaudeToCopilotContent(healthMd);

    assert.ok(!result.includes('~/.claude/'), 'no ~/.claude/ references remain');
    assert.ok(!result.includes('$HOME/.claude/'), 'no $HOME/.claude/ references remain');
    assert.ok(!result.match(/\/vector:[a-z]/), 'no /vector: command references remain');
    assert.ok(!result.match(/(?<!\/)vector:[a-z]/), 'no bare vector: command references remain');
    // Local mode: ~ and $HOME resolve to .github (repo-relative, no ./ prefix)
    assert.ok(result.includes('.github/'), 'paths converted to .github for local');
    assert.ok(result.includes('vector-health'), 'command name converted');
  });

  test('converts engine .md files correctly (global mode)', () => {
    const healthMd = fs.readFileSync(
      path.join(__dirname, '..', 'core', 'workflows', 'health.md'), 'utf8'
    );
    const result = convertClaudeToCopilotContent(healthMd, true);

    assert.ok(!result.includes('~/.claude/'), 'no ~/.claude/ references remain');
    assert.ok(!result.includes('$HOME/.claude/'), 'no $HOME/.claude/ references remain');
    // Global mode: ~ and $HOME resolve to .copilot
    if (healthMd.includes('$HOME/.claude/')) {
      assert.ok(result.includes('$HOME/.copilot/'), '$HOME path converted to .copilot');
    }
    assert.ok(result.includes('vector-health'), 'command name converted');
  });

  test('converts engine .cjs files correctly', () => {
    const verifyCjs = fs.readFileSync(
      path.join(__dirname, '..', 'core', 'bin', 'lib', 'verify.cjs'), 'utf8'
    );
    const result = convertClaudeToCopilotContent(verifyCjs);

    assert.ok(!result.match(/vector:[a-z]/), 'no vector: references remain');
    assert.ok(result.includes('vector-new-project'), 'vector:new-project converted');
    assert.ok(result.includes('vector-health'), 'vector:health converted');
  });
});

// ─── Copilot instructions merge/strip ──────────────────────────────────────────

describe('Copilot instructions merge/strip', () => {
  let tmpDir: string;

  const vectorContent = '- Follow project conventions\n- Use structured workflows';

  function makeVectorBlock(content: string) {
    return GSD_COPILOT_INSTRUCTIONS_MARKER + '\n' + content.trim() + '\n' + GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER;
  }

  describe('mergeCopilotInstructions', () => {
    let tmpMergeDir: string;

    beforeEach(() => {
      tmpMergeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-merge-'));
    });

    afterEach(() => {
      fs.rmSync(tmpMergeDir, { recursive: true, force: true });
    });

    test('creates file from scratch when none exists', () => {
      const filePath = path.join(tmpMergeDir, 'copilot-instructions.md');
      mergeCopilotInstructions(filePath, vectorContent);

      assert.ok(fs.existsSync(filePath), 'file was created');
      const result = fs.readFileSync(filePath, 'utf8');
      assert.ok(result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'has opening marker');
      assert.ok(result.includes(GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER), 'has closing marker');
      assert.ok(result.includes('Follow project conventions'), 'has Vector content');
    });

    test('replaces Vector section when both markers present', () => {
      const filePath = path.join(tmpMergeDir, 'copilot-instructions.md');
      const oldContent = '# User Setup\n\n' +
        makeVectorBlock('- Old Vector content') +
        '\n\n# User Notes\n';
      fs.writeFileSync(filePath, oldContent);

      mergeCopilotInstructions(filePath, vectorContent);
      const result = fs.readFileSync(filePath, 'utf8');

      assert.ok(result.includes('# User Setup'), 'user content before preserved');
      assert.ok(result.includes('# User Notes'), 'user content after preserved');
      assert.ok(!result.includes('Old Vector content'), 'old Vector content removed');
      assert.ok(result.includes('Follow project conventions'), 'new Vector content inserted');
    });

    test('appends to existing file when no markers present', () => {
      const filePath = path.join(tmpMergeDir, 'copilot-instructions.md');
      const userContent = '# My Custom Instructions\n\nDo things my way.\n';
      fs.writeFileSync(filePath, userContent);

      mergeCopilotInstructions(filePath, vectorContent);
      const result = fs.readFileSync(filePath, 'utf8');

      assert.ok(result.includes('# My Custom Instructions'), 'original content preserved');
      assert.ok(result.includes('Do things my way.'), 'original text preserved');
      assert.ok(result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'Vector block appended');
      assert.ok(result.includes('Follow project conventions'), 'Vector content appended');
      // Verify separator exists
      assert.ok(result.includes('Do things my way.\n\n' + GSD_COPILOT_INSTRUCTIONS_MARKER),
        'double newline separator before Vector block');
    });

    test('handles file that is Vector-only (re-creates cleanly)', () => {
      const filePath = path.join(tmpMergeDir, 'copilot-instructions.md');
      const vectorOnly = makeVectorBlock('- Old instructions') + '\n';
      fs.writeFileSync(filePath, vectorOnly);

      const newContent = '- Updated instructions';
      mergeCopilotInstructions(filePath, newContent);
      const result = fs.readFileSync(filePath, 'utf8');

      assert.ok(!result.includes('Old instructions'), 'old content removed');
      assert.ok(result.includes('Updated instructions'), 'new content present');
      assert.ok(result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'has opening marker');
      assert.ok(result.includes(GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER), 'has closing marker');
    });

    test('preserves user content before and after markers', () => {
      const filePath = path.join(tmpMergeDir, 'copilot-instructions.md');
      const content = '# My Setup\n\n' +
        makeVectorBlock('- old content') +
        '\n\n# My Notes\n';
      fs.writeFileSync(filePath, content);

      mergeCopilotInstructions(filePath, vectorContent);
      const result = fs.readFileSync(filePath, 'utf8');

      assert.ok(result.includes('# My Setup'), 'content before markers preserved');
      assert.ok(result.includes('# My Notes'), 'content after markers preserved');
      assert.ok(result.includes('Follow project conventions'), 'new Vector content between markers');
      // Verify ordering: before → Vector → after
      const setupIdx = result.indexOf('# My Setup');
      const markerIdx = result.indexOf(GSD_COPILOT_INSTRUCTIONS_MARKER);
      const notesIdx = result.indexOf('# My Notes');
      assert.ok(setupIdx < markerIdx, 'user setup comes before Vector block');
      assert.ok(markerIdx < notesIdx, 'Vector block comes before user notes');
    });
  });

  describe('stripGsdFromCopilotInstructions', () => {
    test('returns null when content is Vector-only', () => {
      const content = makeVectorBlock('- Vector instructions only') + '\n';
      const result = stripGsdFromCopilotInstructions(content);
      assert.strictEqual(result, null, 'returns null for Vector-only content');
    });

    test('returns cleaned content when user content exists before markers', () => {
      const content = '# My Setup\n\nCustom rules here.\n\n' +
        makeVectorBlock('- Vector stuff') + '\n';
      const result = stripGsdFromCopilotInstructions(content);

      assert.ok(result !== null, 'does not return null');
      assert.ok(result.includes('# My Setup'), 'user content preserved');
      assert.ok(result.includes('Custom rules here.'), 'user text preserved');
      assert.ok(!result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'opening marker removed');
      assert.ok(!result.includes(GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER), 'closing marker removed');
      assert.ok(!result.includes('Vector stuff'), 'Vector content removed');
    });

    test('returns cleaned content when user content exists after markers', () => {
      const content = makeVectorBlock('- Vector stuff') + '\n\n# My Notes\n\nPersonal notes.\n';
      const result = stripGsdFromCopilotInstructions(content);

      assert.ok(result !== null, 'does not return null');
      assert.ok(result.includes('# My Notes'), 'user content after preserved');
      assert.ok(result.includes('Personal notes.'), 'user text after preserved');
      assert.ok(!result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'opening marker removed');
      assert.ok(!result.includes('Vector stuff'), 'Vector content removed');
    });

    test('returns cleaned content preserving both before and after', () => {
      const content = '# Before\n\n' + makeVectorBlock('- Vector middle') + '\n\n# After\n';
      const result = stripGsdFromCopilotInstructions(content);

      assert.ok(result !== null, 'does not return null');
      assert.ok(result.includes('# Before'), 'content before preserved');
      assert.ok(result.includes('# After'), 'content after preserved');
      assert.ok(!result.includes('Vector middle'), 'Vector content removed');
      assert.ok(!result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'markers removed');
    });

    test('returns original content when no markers found', () => {
      const content = '# Just user content\n\nNo Vector markers here.\n';
      const result = stripGsdFromCopilotInstructions(content);
      assert.strictEqual(result, content, 'returns content unchanged');
    });
  });
});

// ─── Copilot uninstall skill removal ───────────────────────────────────────────

describe('Copilot uninstall skill removal', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-uninstall-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('identifies vector-* skill directories for removal', () => {
    // Create Copilot-like skills directory structure
    const skillsDir = path.join(tmpDir, 'skills');
    fs.mkdirSync(path.join(skillsDir, 'vector-foo'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'vector-foo', 'SKILL.md'), '# Foo');
    fs.mkdirSync(path.join(skillsDir, 'vector-bar'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'vector-bar', 'SKILL.md'), '# Bar');
    fs.mkdirSync(path.join(skillsDir, 'custom-skill'), { recursive: true });
    fs.writeFileSync(path.join(skillsDir, 'custom-skill', 'SKILL.md'), '# Custom');

    // Test the pattern: read skills, filter vector-* entries
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const vectorSkills = entries
      .filter((e: any) => e.isDirectory() && e.name.startsWith('vector-'))
      .map((e: any) => e.name);
    const nonVectorSkills = entries
      .filter((e: any) => e.isDirectory() && !e.name.startsWith('vector-'))
      .map((e: any) => e.name);

    assert.deepStrictEqual(vectorSkills.sort(), ['vector-bar', 'vector-foo'], 'identifies vector-* skills');
    assert.deepStrictEqual(nonVectorSkills, ['custom-skill'], 'preserves non-vector skills');
  });

  test('cleans Vector section from copilot-instructions.md on uninstall', () => {
    const content = '# My Setup\n\nMy custom rules.\n\n' +
      GSD_COPILOT_INSTRUCTIONS_MARKER + '\n' +
      '- Vector managed content\n' +
      GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER + '\n';

    const result = stripGsdFromCopilotInstructions(content);

    assert.ok(result !== null, 'does not return null when user content exists');
    assert.ok(result.includes('# My Setup'), 'user content preserved');
    assert.ok(result.includes('My custom rules.'), 'user text preserved');
    assert.ok(!result.includes('Vector managed content'), 'Vector content removed');
    assert.ok(!result.includes(GSD_COPILOT_INSTRUCTIONS_MARKER), 'markers removed');
  });

  test('deletes copilot-instructions.md when Vector-only on uninstall', () => {
    const content = GSD_COPILOT_INSTRUCTIONS_MARKER + '\n' +
      '- Only Vector content\n' +
      GSD_COPILOT_INSTRUCTIONS_CLOSE_MARKER + '\n';

    const result = stripGsdFromCopilotInstructions(content);

    assert.strictEqual(result, null, 'returns null signaling file deletion');
  });
});

// ─── Copilot manifest and patches fixes ────────────────────────────────────────

describe('Copilot manifest and patches fixes', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-manifest-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('writeManifest hashes skills for Copilot runtime', () => {
    // Create minimal core dir (required by writeManifest)
    const vectorDir = path.join(tmpDir, 'core', 'bin');
    fs.mkdirSync(vectorDir, { recursive: true });
    fs.writeFileSync(path.join(vectorDir, 'verify.cjs'), '// verify stub');

    // Create Copilot skills directory
    const skillDir = path.join(tmpDir, 'skills', 'vector-test');
    fs.mkdirSync(skillDir, { recursive: true });
    fs.writeFileSync(path.join(skillDir, 'SKILL.md'), '# Test Skill\n\nA test skill.');

    const manifest = writeManifest(tmpDir, 'copilot');

    // Check manifest file was written
    const manifestPath = path.join(tmpDir, 'vector-file-manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'manifest file created');

    // Read and verify skills are hashed
    const data = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const skillKey = 'skills/vector-test/SKILL.md';
    assert.ok(data.files[skillKey], 'skill file hashed in manifest');
    assert.ok(typeof data.files[skillKey] === 'string', 'hash is a string');
    assert.ok(data.files[skillKey].length === 64, 'hash is SHA-256 (64 hex chars)');
  });

  test('reportLocalPatches shows /vector-reapply-patches for Copilot', () => {
    // Create patches directory with metadata
    const patchesDir = path.join(tmpDir, 'vector-local-patches');
    fs.mkdirSync(patchesDir, { recursive: true });
    fs.writeFileSync(path.join(patchesDir, 'backup-meta.json'), JSON.stringify({
      from_version: '1.0',
      files: ['skills/vector-test/SKILL.md']
    }));

    // Capture console output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    try {
      const result = reportLocalPatches(tmpDir, 'copilot');

      assert.ok(result.length > 0, 'returns patched files list');
      const output = logs.join('\n');
      assert.ok(output.includes('/vector-reapply-patches'), 'uses dash format for Copilot');
      assert.ok(!output.includes('/vector:reapply-patches'), 'does not use colon format');
    } finally {
      console.log = originalLog;
    }
  });

  test('reportLocalPatches shows /vector:reapply-patches for Claude (unchanged)', () => {
    // Create patches directory with metadata
    const patchesDir = path.join(tmpDir, 'vector-local-patches');
    fs.mkdirSync(patchesDir, { recursive: true });
    fs.writeFileSync(path.join(patchesDir, 'backup-meta.json'), JSON.stringify({
      from_version: '1.0',
      files: ['core/bin/verify.cjs']
    }));

    // Capture console output
    const logs: string[] = [];
    const originalLog = console.log;
    console.log = (...args: unknown[]) => logs.push(args.join(' '));

    try {
      const result = reportLocalPatches(tmpDir, 'claude');

      assert.ok(result.length > 0, 'returns patched files list');
      const output = logs.join('\n');
      assert.ok(output.includes('/vector:reapply-patches'), 'uses colon format for Claude');
    } finally {
      console.log = originalLog;
    }
  });
});

// ============================================================================
// E2E Integration Tests — Copilot Install & Uninstall
// ============================================================================

const { execFileSync } = require('child_process');
const crypto = require('crypto');

const INSTALL_PATH = path.join(__dirname, '..', 'bin', 'install.cjs');
const EXPECTED_SKILLS = 37;
const EXPECTED_AGENTS = 15;

function runCopilotInstall(cwd: string) {
  const env = { ...process.env };
  delete env.VECTOR_TEST_MODE;
  return execFileSync(process.execPath, [INSTALL_PATH, '--copilot', '--local'], {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });
}

function runCopilotUninstall(cwd: string) {
  const env = { ...process.env };
  delete env.VECTOR_TEST_MODE;
  return execFileSync(process.execPath, [INSTALL_PATH, '--copilot', '--local', '--uninstall'], {
    cwd,
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    env,
  });
}

describe('E2E: Copilot full install verification', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-e2e-'));
    runCopilotInstall(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('installs expected number of skill directories', () => {
    const skillsDir = path.join(tmpDir, '.github', 'skills');
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const vectorSkills = entries.filter((e: any) => e.isDirectory() && e.name.startsWith('vector-'));
    assert.strictEqual(vectorSkills.length, EXPECTED_SKILLS,
      `Expected ${EXPECTED_SKILLS} skill directories, got ${vectorSkills.length}`);
  });

  test('each skill directory contains SKILL.md', () => {
    const skillsDir = path.join(tmpDir, '.github', 'skills');
    const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
    const vectorSkills = entries.filter((e: any) => e.isDirectory() && e.name.startsWith('vector-'));
    for (const skill of vectorSkills) {
      const skillMdPath = path.join(skillsDir, skill.name, 'SKILL.md');
      assert.ok(fs.existsSync(skillMdPath),
        `Missing SKILL.md in ${skill.name}`);
    }
  });

  test('installs expected number of agent files', () => {
    const agentsDir = path.join(tmpDir, '.github', 'agents');
    const files = fs.readdirSync(agentsDir);
    const vectorAgents = files.filter((f: any) => f.startsWith('vector-') && f.endsWith('.agent.md'));
    assert.strictEqual(vectorAgents.length, EXPECTED_AGENTS,
      `Expected ${EXPECTED_AGENTS} agent files, got ${vectorAgents.length}`);
  });

  test('installs all expected agent files', () => {
    const agentsDir = path.join(tmpDir, '.github', 'agents');
    const files = fs.readdirSync(agentsDir);
    const vectorAgents = files.filter((f: any) => f.startsWith('vector-') && f.endsWith('.agent.md')).sort();
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
    assert.deepStrictEqual(vectorAgents, expected);
  });

  test('generates copilot-instructions.md with Vector markers', () => {
    const instrPath = path.join(tmpDir, '.github', 'copilot-instructions.md');
    assert.ok(fs.existsSync(instrPath), 'copilot-instructions.md should exist');
    const content = fs.readFileSync(instrPath, 'utf-8');
    assert.ok(content.includes('<!-- Vector Configuration'),
      'Should contain Vector Configuration open marker');
    assert.ok(content.includes('<!-- /Vector Configuration -->'),
      'Should contain Vector Configuration close marker');
  });

  test('creates manifest with correct structure', () => {
    const manifestPath = path.join(tmpDir, '.github', 'vector-file-manifest.json');
    assert.ok(fs.existsSync(manifestPath), 'vector-file-manifest.json should exist');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    assert.ok(manifest.version, 'manifest should have version');
    assert.ok(manifest.timestamp, 'manifest should have timestamp');
    assert.ok(manifest.files && typeof manifest.files === 'object',
      'manifest should have files object');
    assert.ok(Object.keys(manifest.files).length > 0,
      'manifest files should not be empty');
  });

  test('manifest contains expected file categories', () => {
    const manifestPath = path.join(tmpDir, '.github', 'vector-file-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const keys = Object.keys(manifest.files);

    const skillEntries = keys.filter((k: any) => k.startsWith('skills/'));
    const agentEntries = keys.filter((k: any) => k.startsWith('agents/'));
    const engineEntries = keys.filter((k: any) => k.startsWith('core/'));

    assert.strictEqual(skillEntries.length, EXPECTED_SKILLS,
      `Expected ${EXPECTED_SKILLS} skill manifest entries, got ${skillEntries.length}`);
    assert.strictEqual(agentEntries.length, EXPECTED_AGENTS,
      `Expected ${EXPECTED_AGENTS} agent manifest entries, got ${agentEntries.length}`);
    assert.ok(engineEntries.length > 0,
      'Should have core/ engine manifest entries');
  });

  test('manifest SHA256 hashes match actual file contents', () => {
    const manifestPath = path.join(tmpDir, '.github', 'vector-file-manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
    const githubDir = path.join(tmpDir, '.github');

    for (const [relPath, expectedHash] of Object.entries(manifest.files)) {
      const filePath = path.join(githubDir, relPath);
      assert.ok(fs.existsSync(filePath),
        `Manifest references ${relPath} but file does not exist`);
      const content = fs.readFileSync(filePath);
      const actualHash = crypto.createHash('sha256').update(content).digest('hex');
      assert.strictEqual(actualHash, expectedHash,
        `SHA256 mismatch for ${relPath}: expected ${expectedHash}, got ${actualHash}`);
    }
  });

  test('engine directory contains required subdirectories and files', () => {
    const engineDir = path.join(tmpDir, '.github', 'core');
    const requiredDirs = ['bin', 'references', 'templates', 'workflows'];
    const requiredFiles = ['CHANGELOG.md', 'VERSION'];

    for (const dir of requiredDirs) {
      const dirPath = path.join(engineDir, dir);
      assert.ok(fs.existsSync(dirPath) && fs.statSync(dirPath).isDirectory(),
        `Engine should contain directory: ${dir}`);
    }
    for (const file of requiredFiles) {
      const filePath = path.join(engineDir, file);
      assert.ok(fs.existsSync(filePath) && fs.statSync(filePath).isFile(),
        `Engine should contain file: ${file}`);
    }
  });
});

describe('E2E: Copilot uninstall verification', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-e2e-'));
    runCopilotInstall(tmpDir);
    runCopilotUninstall(tmpDir);
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('removes engine directory', () => {
    const engineDir = path.join(tmpDir, '.github', 'core');
    assert.ok(!fs.existsSync(engineDir),
      'core directory should not exist after uninstall');
  });

  test('removes copilot-instructions.md', () => {
    const instrPath = path.join(tmpDir, '.github', 'copilot-instructions.md');
    assert.ok(!fs.existsSync(instrPath),
      'copilot-instructions.md should not exist after uninstall');
  });

  test('removes all Vector skill directories', () => {
    const skillsDir = path.join(tmpDir, '.github', 'skills');
    if (fs.existsSync(skillsDir)) {
      const entries = fs.readdirSync(skillsDir, { withFileTypes: true });
      const vectorSkills = entries.filter((e: any) => e.isDirectory() && e.name.startsWith('vector-'));
      assert.strictEqual(vectorSkills.length, 0,
        `Expected 0 Vector skill directories after uninstall, found: ${vectorSkills.map((e: any) => e.name).join(', ')}`);
    }
  });

  test('removes all Vector agent files', () => {
    const agentsDir = path.join(tmpDir, '.github', 'agents');
    if (fs.existsSync(agentsDir)) {
      const files = fs.readdirSync(agentsDir);
      const vectorAgents = files.filter((f: any) => f.startsWith('vector-') && f.endsWith('.agent.md'));
      assert.strictEqual(vectorAgents.length, 0,
        `Expected 0 Vector agent files after uninstall, found: ${vectorAgents.join(', ')}`);
    }
  });

  test('preserves non-Vector content in skills directory', () => {
    // Standalone lifecycle: install → add custom content → uninstall → verify
    const td = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-e2e-preserve-skill-'));
    try {
      runCopilotInstall(td);
      // Add non-Vector custom skill
      const customSkillDir = path.join(td, '.github', 'skills', 'my-custom-skill');
      fs.mkdirSync(customSkillDir, { recursive: true });
      fs.writeFileSync(path.join(customSkillDir, 'SKILL.md'), '# My Custom Skill\n');
      // Uninstall
      runCopilotUninstall(td);
      // Verify custom content preserved
      assert.ok(fs.existsSync(path.join(customSkillDir, 'SKILL.md')),
        'Non-Vector skill directory and SKILL.md should be preserved after uninstall');
    } finally {
      fs.rmSync(td, { recursive: true, force: true });
    }
  });

  test('preserves non-Vector content in agents directory', () => {
    // Standalone lifecycle: install → add custom content → uninstall → verify
    const td = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-e2e-preserve-agent-'));
    try {
      runCopilotInstall(td);
      // Add non-Vector custom agent
      const customAgentPath = path.join(td, '.github', 'agents', 'my-agent.md');
      fs.writeFileSync(customAgentPath, '# My Custom Agent\n');
      // Uninstall
      runCopilotUninstall(td);
      // Verify custom content preserved
      assert.ok(fs.existsSync(customAgentPath),
        'Non-Vector agent file should be preserved after uninstall');
    } finally {
      fs.rmSync(td, { recursive: true, force: true });
    }
  });
});
