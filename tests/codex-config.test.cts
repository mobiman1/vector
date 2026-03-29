/**
 * Vector Tools Tests - codex-config.cjs
 *
 * Tests for Codex adapter header, agent conversion, config.toml generation/merge,
 * per-agent .toml generation, and uninstall cleanup.
 */

// Enable test exports from install.js (skips main CLI logic)
process.env.VECTOR_TEST_MODE = '1';

import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import fs from 'fs';
import path from 'path';
import os from 'os';

const {
  getCodexSkillAdapterHeader,
  convertClaudeAgentToCodexAgent,
  generateCodexAgentToml,
  generateCodexConfigBlock,
  stripVectorFromCodexConfig,
  mergeCodexConfig,
  VECTOR_CODEX_MARKER,
  CODEX_AGENT_SANDBOX,
} = require('../bin/install.cjs');

// ─── getCodexSkillAdapterHeader ─────────────────────────────────────────────────

describe('getCodexSkillAdapterHeader', () => {
  test('contains all three sections', () => {
    const result = getCodexSkillAdapterHeader('vector-execute-phase');
    assert.ok(result.includes('<codex_skill_adapter>'), 'has opening tag');
    assert.ok(result.includes('</codex_skill_adapter>'), 'has closing tag');
    assert.ok(result.includes('## A. Skill Invocation'), 'has section A');
    assert.ok(result.includes('## B. AskUserQuestion'), 'has section B');
    assert.ok(result.includes('## C. Task() → spawn_agent'), 'has section C');
  });

  test('includes correct invocation syntax', () => {
    const result = getCodexSkillAdapterHeader('vector-plan-phase');
    assert.ok(result.includes('`$vector-plan-phase`'), 'has $skillName invocation');
    assert.ok(result.includes('{{VECTOR_ARGS}}'), 'has VECTOR_ARGS variable');
  });

  test('section B maps AskUserQuestion parameters', () => {
    const result = getCodexSkillAdapterHeader('vector-discuss-phase');
    assert.ok(result.includes('request_user_input'), 'maps to request_user_input');
    assert.ok(result.includes('header'), 'maps header parameter');
    assert.ok(result.includes('question'), 'maps question parameter');
    assert.ok(result.includes('label'), 'maps options label');
    assert.ok(result.includes('description'), 'maps options description');
    assert.ok(result.includes('multiSelect'), 'documents multiSelect workaround');
    assert.ok(result.includes('Execute mode'), 'documents Execute mode fallback');
  });

  test('section C maps Task to spawn_agent', () => {
    const result = getCodexSkillAdapterHeader('vector-execute-phase');
    assert.ok(result.includes('spawn_agent'), 'maps to spawn_agent');
    assert.ok(result.includes('agent_type'), 'maps subagent_type to agent_type');
    assert.ok(result.includes('fork_context'), 'documents fork_context default');
    assert.ok(result.includes('wait(ids)'), 'documents parallel wait pattern');
    assert.ok(result.includes('close_agent'), 'documents close_agent cleanup');
    assert.ok(result.includes('CHECKPOINT'), 'documents result markers');
  });
});

// ─── convertClaudeAgentToCodexAgent ─────────────────────────────────────────────

describe('convertClaudeAgentToCodexAgent', () => {
  test('adds codex_agent_role header and cleans frontmatter', () => {
    const input = `---
name: vector-executor
description: Executes Vector plans with atomic commits
tools: Read, Write, Edit, Bash, Grep, Glob
color: yellow
---

<role>
You are a Vector plan executor.
</role>`;

    const result = convertClaudeAgentToCodexAgent(input);

    // Frontmatter rebuilt with only name and description
    assert.ok(result.startsWith('---\n'), 'starts with frontmatter');
    assert.ok(result.includes('"vector-executor"'), 'has quoted name');
    assert.ok(result.includes('"Executes Vector plans with atomic commits"'), 'has quoted description');
    assert.ok(!result.includes('color: yellow'), 'drops color field');
    // Tools should be in <codex_agent_role> but NOT in frontmatter
    const fmEnd = result.indexOf('---', 4);
    const frontmatterSection = result.substring(0, fmEnd);
    assert.ok(!frontmatterSection.includes('tools:'), 'drops tools from frontmatter');

    // Has codex_agent_role block
    assert.ok(result.includes('<codex_agent_role>'), 'has role header');
    assert.ok(result.includes('role: vector-executor'), 'role matches agent name');
    assert.ok(result.includes('tools: Read, Write, Edit, Bash, Grep, Glob'), 'tools in role block');
    assert.ok(result.includes('purpose: Executes Vector plans with atomic commits'), 'purpose from description');
    assert.ok(result.includes('</codex_agent_role>'), 'has closing tag');

    // Body preserved
    assert.ok(result.includes('<role>'), 'body content preserved');
  });

  test('converts slash commands in body', () => {
    const input = `---
name: vector-test
description: Test agent
tools: Read
---

Run /vector:execute-phase to proceed.`;

    const result = convertClaudeAgentToCodexAgent(input);
    assert.ok(result.includes('$vector-execute-phase'), 'converts slash commands');
    assert.ok(!result.includes('/vector:execute-phase'), 'original slash command removed');
  });

  test('handles content without frontmatter', () => {
    const input = 'Just some content without frontmatter.';
    const result = convertClaudeAgentToCodexAgent(input);
    assert.strictEqual(result, input, 'returns input unchanged');
  });
});

// ─── generateCodexAgentToml ─────────────────────────────────────────────────────

describe('generateCodexAgentToml', () => {
  const sampleAgent = `---
name: vector-executor
description: Executes plans
tools: Read, Write, Edit
color: yellow
---

<role>You are an executor.</role>`;

  test('sets workspace-write for executor', () => {
    const result = generateCodexAgentToml('vector-executor', sampleAgent);
    assert.ok(result.includes('sandbox_mode = "workspace-write"'), 'has workspace-write');
  });

  test('sets read-only for plan-checker', () => {
    const checker = `---
name: vector-plan-checker
description: Checks plans
tools: Read, Grep, Glob
---

<role>You check plans.</role>`;
    const result = generateCodexAgentToml('vector-plan-checker', checker);
    assert.ok(result.includes('sandbox_mode = "read-only"'), 'has read-only');
  });

  test('includes developer_instructions from body', () => {
    const result = generateCodexAgentToml('vector-executor', sampleAgent);
    assert.ok(result.includes("developer_instructions = '''"), 'has literal triple-quoted instructions');
    assert.ok(result.includes('<role>You are an executor.</role>'), 'body content in instructions');
    assert.ok(result.includes("'''"), 'has closing literal triple quotes');
  });

  test('defaults unknown agents to read-only', () => {
    const result = generateCodexAgentToml('vector-unknown', sampleAgent);
    assert.ok(result.includes('sandbox_mode = "read-only"'), 'defaults to read-only');
  });
});

// ─── CODEX_AGENT_SANDBOX mapping ────────────────────────────────────────────────

describe('CODEX_AGENT_SANDBOX', () => {
  test('has all 11 agents mapped', () => {
    const agentNames = Object.keys(CODEX_AGENT_SANDBOX);
    assert.strictEqual(agentNames.length, 11, 'has 11 agents');
  });

  test('workspace-write agents have write tools', () => {
    const writeAgents = [
      'vector-executor', 'vector-planner', 'vector-phase-researcher',
      'vector-project-researcher', 'vector-research-synthesizer', 'vector-verifier',
      'vector-codebase-mapper', 'vector-roadmapper', 'vector-debugger',
    ];
    for (const name of writeAgents) {
      assert.strictEqual(CODEX_AGENT_SANDBOX[name], 'workspace-write', `${name} is workspace-write`);
    }
  });

  test('read-only agents have no write tools', () => {
    const readOnlyAgents = ['vector-plan-checker', 'vector-integration-checker'];
    for (const name of readOnlyAgents) {
      assert.strictEqual(CODEX_AGENT_SANDBOX[name], 'read-only', `${name} is read-only`);
    }
  });
});

// ─── generateCodexConfigBlock ───────────────────────────────────────────────────

describe('generateCodexConfigBlock', () => {
  const agents = [
    { name: 'vector-executor', description: 'Executes plans' },
    { name: 'vector-planner', description: 'Creates plans' },
  ];

  test('starts with Vector marker', () => {
    const result = generateCodexConfigBlock(agents);
    assert.ok(result.startsWith(VECTOR_CODEX_MARKER), 'starts with marker');
  });

  test('does not include feature flags or agents table header', () => {
    const result = generateCodexConfigBlock(agents);
    assert.ok(!result.includes('[features]'), 'no features table');
    assert.ok(!result.includes('multi_agent'), 'no multi_agent');
    assert.ok(!result.includes('default_mode_request_user_input'), 'no request_user_input');
    // Should not have bare [agents] table header (only [agents.vector-*] sections)
    assert.ok(!result.match(/^\[agents\]\s*$/m), 'no bare [agents] table');
    assert.ok(!result.includes('max_threads'), 'no max_threads');
    assert.ok(!result.includes('max_depth'), 'no max_depth');
  });

  test('includes per-agent sections', () => {
    const result = generateCodexConfigBlock(agents);
    assert.ok(result.includes('[agents.vector-executor]'), 'has executor section');
    assert.ok(result.includes('[agents.vector-planner]'), 'has planner section');
    assert.ok(result.includes('config_file = "agents/vector-executor.toml"'), 'has executor config_file');
    assert.ok(result.includes('"Executes plans"'), 'has executor description');
  });
});

// ─── stripVectorFromCodexConfig ────────────────────────────────────────────────────

describe('stripVectorFromCodexConfig', () => {
  test('returns null for Vector-only config', () => {
    const content = `${VECTOR_CODEX_MARKER}\n[features]\nmulti_agent = true\n`;
    const result = stripVectorFromCodexConfig(content);
    assert.strictEqual(result, null, 'returns null when Vector-only');
  });

  test('preserves user content before marker', () => {
    const content = `[model]\nname = "o3"\n\n${VECTOR_CODEX_MARKER}\n[features]\nmulti_agent = true\n`;
    const result = stripVectorFromCodexConfig(content);
    assert.ok(result.includes('[model]'), 'preserves user section');
    assert.ok(result.includes('name = "o3"'), 'preserves user values');
    assert.ok(!result.includes('multi_agent'), 'removes Vector content');
    assert.ok(!result.includes(VECTOR_CODEX_MARKER), 'removes marker');
  });

  test('strips injected feature keys without marker', () => {
    const content = `[features]\nmulti_agent = true\ndefault_mode_request_user_input = true\nother_feature = false\n`;
    const result = stripVectorFromCodexConfig(content);
    assert.ok(!result.includes('multi_agent'), 'removes multi_agent');
    assert.ok(!result.includes('default_mode_request_user_input'), 'removes request_user_input');
    assert.ok(result.includes('other_feature = false'), 'preserves user features');
  });

  test('removes empty [features] section', () => {
    const content = `[features]\nmulti_agent = true\n[model]\nname = "o3"\n`;
    const result = stripVectorFromCodexConfig(content);
    assert.ok(!result.includes('[features]'), 'removes empty features section');
    assert.ok(result.includes('[model]'), 'preserves other sections');
  });

  test('strips injected keys above marker on uninstall', () => {
    // Case 3 install injects keys into [features] AND appends marker block
    const content = `[model]\nname = "o3"\n\n[features]\nmulti_agent = true\ndefault_mode_request_user_input = true\nsome_custom_flag = true\n\n${VECTOR_CODEX_MARKER}\n[agents]\nmax_threads = 4\n`;
    const result = stripVectorFromCodexConfig(content);
    assert.ok(result.includes('[model]'), 'preserves user model section');
    assert.ok(result.includes('some_custom_flag = true'), 'preserves user feature');
    assert.ok(!result.includes('multi_agent'), 'strips injected multi_agent');
    assert.ok(!result.includes('default_mode_request_user_input'), 'strips injected request_user_input');
    assert.ok(!result.includes(VECTOR_CODEX_MARKER), 'strips marker');
  });

  test('removes [agents.vector-*] sections', () => {
    const content = `[agents.vector-executor]\ndescription = "test"\nconfig_file = "agents/vector-executor.toml"\n\n[agents.custom-agent]\ndescription = "user agent"\n`;
    const result = stripVectorFromCodexConfig(content);
    assert.ok(!result.includes('[agents.vector-executor]'), 'removes Vector agent section');
    assert.ok(result.includes('[agents.custom-agent]'), 'preserves user agent section');
  });
});

// ─── mergeCodexConfig ───────────────────────────────────────────────────────────

describe('mergeCodexConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-codex-merge-'));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  const sampleBlock = generateCodexConfigBlock([
    { name: 'vector-executor', description: 'Executes plans' },
  ]);

  test('case 1: creates new config.toml', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    mergeCodexConfig(configPath, sampleBlock);

    assert.ok(fs.existsSync(configPath), 'file created');
    const content = fs.readFileSync(configPath, 'utf8');
    assert.ok(content.includes(VECTOR_CODEX_MARKER), 'has marker');
    assert.ok(content.includes('[agents.vector-executor]'), 'has agent');
    assert.ok(!content.includes('[features]'), 'no features section');
    assert.ok(!content.includes('multi_agent'), 'no multi_agent');
  });

  test('case 2: replaces existing Vector block', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    const userContent = '[model]\nname = "o3"\n';
    fs.writeFileSync(configPath, userContent + '\n' + sampleBlock + '\n');

    // Re-merge with updated block
    const newBlock = generateCodexConfigBlock([
      { name: 'vector-executor', description: 'Updated description' },
      { name: 'vector-planner', description: 'New agent' },
    ]);
    mergeCodexConfig(configPath, newBlock);

    const content = fs.readFileSync(configPath, 'utf8');
    assert.ok(content.includes('[model]'), 'preserves user content');
    assert.ok(content.includes('Updated description'), 'has new description');
    assert.ok(content.includes('[agents.vector-planner]'), 'has new agent');
    // Verify no duplicate markers
    const markerCount = (content.match(new RegExp(VECTOR_CODEX_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    assert.strictEqual(markerCount, 1, 'exactly one marker');
  });

  test('case 3: appends to config without Vector marker', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, '[model]\nname = "o3"\n');

    mergeCodexConfig(configPath, sampleBlock);

    const content = fs.readFileSync(configPath, 'utf8');
    assert.ok(content.includes('[model]'), 'preserves user content');
    assert.ok(content.includes(VECTOR_CODEX_MARKER), 'adds marker');
    assert.ok(content.includes('[agents.vector-executor]'), 'has agent');
  });

  test('case 3 with existing [features]: preserves user features, does not inject Vector keys', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, '[features]\nother_feature = true\n\n[model]\nname = "o3"\n');

    mergeCodexConfig(configPath, sampleBlock);

    const content = fs.readFileSync(configPath, 'utf8');
    assert.ok(content.includes('other_feature = true'), 'preserves existing feature');
    assert.ok(!content.includes('multi_agent'), 'does not inject multi_agent');
    assert.ok(!content.includes('default_mode_request_user_input'), 'does not inject request_user_input');
    assert.ok(content.includes(VECTOR_CODEX_MARKER), 'adds marker for agents block');
    assert.ok(content.includes('[agents.vector-executor]'), 'has agent');
  });

  test('idempotent: re-merge produces same result', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    mergeCodexConfig(configPath, sampleBlock);
    const first = fs.readFileSync(configPath, 'utf8');

    mergeCodexConfig(configPath, sampleBlock);
    const second = fs.readFileSync(configPath, 'utf8');

    assert.strictEqual(first, second, 'idempotent merge');
  });

  test('case 2 after case 3 with existing [features]: no duplicate sections', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, '[features]\nother_feature = true\n\n[model]\nname = "o3"\n');
    mergeCodexConfig(configPath, sampleBlock);

    mergeCodexConfig(configPath, sampleBlock);

    const content = fs.readFileSync(configPath, 'utf8');
    const featuresCount = (content.match(/^\[features\]\s*$/gm) || []).length;
    assert.strictEqual(featuresCount, 1, 'exactly one [features] section');
    assert.ok(content.includes('other_feature = true'), 'preserves user feature keys');
    assert.ok(content.includes('[agents.vector-executor]'), 'has agent');
    // Verify no duplicate markers
    const markerCount = (content.match(new RegExp(VECTOR_CODEX_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    assert.strictEqual(markerCount, 1, 'exactly one marker');
  });

  test('case 2 does not inject feature keys', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    const manualContent = '[features]\nother_feature = true\n\n' + VECTOR_CODEX_MARKER + '\n[agents.vector-old]\ndescription = "old"\n';
    fs.writeFileSync(configPath, manualContent);

    mergeCodexConfig(configPath, sampleBlock);

    const content = fs.readFileSync(configPath, 'utf8');
    assert.ok(!content.includes('multi_agent'), 'does not inject multi_agent');
    assert.ok(!content.includes('default_mode_request_user_input'), 'does not inject request_user_input');
    assert.ok(content.includes('other_feature = true'), 'preserves user feature');
    assert.ok(content.includes('[agents.vector-executor]'), 'has agent from fresh block');
  });

  test('case 2 strips leaked [agents] and [agents.vector-*] from before content', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    const brokenContent = [
      '[features]',
      'child_agents_md = false',
      '',
      '[agents]',
      'max_threads = 4',
      'max_depth = 2',
      '',
      '[agents.vector-executor]',
      'description = "old"',
      'config_file = "agents/vector-executor.toml"',
      '',
      VECTOR_CODEX_MARKER,
      '',
      '[agents.vector-executor]',
      'description = "Executes plans"',
      'config_file = "agents/vector-executor.toml"',
      '',
    ].join('\n');
    fs.writeFileSync(configPath, brokenContent);

    mergeCodexConfig(configPath, sampleBlock);

    const content = fs.readFileSync(configPath, 'utf8');
    assert.ok(content.includes('child_agents_md = false'), 'preserves user feature keys');
    assert.ok(content.includes('[agents.vector-executor]'), 'has agent from fresh block');
    // Verify the leaked [agents] table header above marker was stripped
    const markerIndex = content.indexOf(VECTOR_CODEX_MARKER);
    const beforeMarker = content.substring(0, markerIndex);
    assert.ok(!beforeMarker.match(/^\[agents\]\s*$/m), 'no leaked [agents] above marker');
    assert.ok(!beforeMarker.includes('[agents.vector-'), 'no leaked [agents.vector-*] above marker');
  });

  test('case 2 idempotent after case 3 with existing [features]', () => {
    const configPath = path.join(tmpDir, 'config.toml');
    fs.writeFileSync(configPath, '[features]\nother_feature = true\n');
    mergeCodexConfig(configPath, sampleBlock);
    const first = fs.readFileSync(configPath, 'utf8');

    mergeCodexConfig(configPath, sampleBlock);
    const second = fs.readFileSync(configPath, 'utf8');

    mergeCodexConfig(configPath, sampleBlock);
    const third = fs.readFileSync(configPath, 'utf8');

    assert.strictEqual(first, second, 'idempotent after 2nd merge');
    assert.strictEqual(second, third, 'idempotent after 3rd merge');
  });
});

// ─── Integration: installCodexConfig ────────────────────────────────────────────

describe('installCodexConfig (integration)', () => {
  let tmpTarget: string;
  const agentsSrc = path.join(__dirname, '..', 'agents');

  beforeEach(() => {
    tmpTarget = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-codex-install-'));
  });

  afterEach(() => {
    fs.rmSync(tmpTarget, { recursive: true, force: true });
  });

  // Only run if agents/ directory exists (not in CI without full checkout)
  const hasAgents = fs.existsSync(agentsSrc);

  (hasAgents ? test : test.skip)('generates config.toml and agent .toml files', () => {
    const { installCodexConfig } = require('../bin/install.cjs');
    const count = installCodexConfig(tmpTarget, agentsSrc);

    assert.ok(count >= 11, `installed ${count} agents (expected >= 11)`);

    // Verify config.toml
    const configPath = path.join(tmpTarget, 'config.toml');
    assert.ok(fs.existsSync(configPath), 'config.toml exists');
    const config = fs.readFileSync(configPath, 'utf8');
    assert.ok(config.includes(VECTOR_CODEX_MARKER), 'has Vector marker');
    assert.ok(config.includes('[agents.vector-executor]'), 'has executor agent');
    assert.ok(!config.includes('multi_agent'), 'no feature flags');

    // Verify per-agent .toml files
    const agentsDir = path.join(tmpTarget, 'agents');
    assert.ok(fs.existsSync(path.join(agentsDir, 'vector-executor.toml')), 'executor .toml exists');
    assert.ok(fs.existsSync(path.join(agentsDir, 'vector-plan-checker.toml')), 'plan-checker .toml exists');

    const executorToml = fs.readFileSync(path.join(agentsDir, 'vector-executor.toml'), 'utf8');
    assert.ok(executorToml.includes('sandbox_mode = "workspace-write"'), 'executor is workspace-write');
    assert.ok(executorToml.includes('developer_instructions'), 'has developer_instructions');

    const checkerToml = fs.readFileSync(path.join(agentsDir, 'vector-plan-checker.toml'), 'utf8');
    assert.ok(checkerToml.includes('sandbox_mode = "read-only"'), 'plan-checker is read-only');
  });
});
