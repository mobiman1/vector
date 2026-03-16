"use strict";
/**
 * Vector Tools Tests - codex-config.cjs
 *
 * Tests for Codex adapter header, agent conversion, config.toml generation/merge,
 * per-agent .toml generation, and uninstall cleanup.
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Enable test exports from install.js (skips main CLI logic)
process.env.VECTOR_TEST_MODE = '1';
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const { getCodexSkillAdapterHeader, convertClaudeAgentToCodexAgent, generateCodexAgentToml, generateCodexConfigBlock, stripGsdFromCodexConfig, mergeCodexConfig, GSD_CODEX_MARKER, CODEX_AGENT_SANDBOX, } = require('../bin/install.cjs');
// ─── getCodexSkillAdapterHeader ─────────────────────────────────────────────────
(0, node_test_1.describe)('getCodexSkillAdapterHeader', () => {
    (0, node_test_1.test)('contains all three sections', () => {
        const result = getCodexSkillAdapterHeader('vector-execute-phase');
        node_assert_1.default.ok(result.includes('<codex_skill_adapter>'), 'has opening tag');
        node_assert_1.default.ok(result.includes('</codex_skill_adapter>'), 'has closing tag');
        node_assert_1.default.ok(result.includes('## A. Skill Invocation'), 'has section A');
        node_assert_1.default.ok(result.includes('## B. AskUserQuestion'), 'has section B');
        node_assert_1.default.ok(result.includes('## C. Task() → spawn_agent'), 'has section C');
    });
    (0, node_test_1.test)('includes correct invocation syntax', () => {
        const result = getCodexSkillAdapterHeader('vector-plan-phase');
        node_assert_1.default.ok(result.includes('`$vector-plan-phase`'), 'has $skillName invocation');
        node_assert_1.default.ok(result.includes('{{VECTOR_ARGS}}'), 'has VECTOR_ARGS variable');
    });
    (0, node_test_1.test)('section B maps AskUserQuestion parameters', () => {
        const result = getCodexSkillAdapterHeader('vector-discuss-phase');
        node_assert_1.default.ok(result.includes('request_user_input'), 'maps to request_user_input');
        node_assert_1.default.ok(result.includes('header'), 'maps header parameter');
        node_assert_1.default.ok(result.includes('question'), 'maps question parameter');
        node_assert_1.default.ok(result.includes('label'), 'maps options label');
        node_assert_1.default.ok(result.includes('description'), 'maps options description');
        node_assert_1.default.ok(result.includes('multiSelect'), 'documents multiSelect workaround');
        node_assert_1.default.ok(result.includes('Execute mode'), 'documents Execute mode fallback');
    });
    (0, node_test_1.test)('section C maps Task to spawn_agent', () => {
        const result = getCodexSkillAdapterHeader('vector-execute-phase');
        node_assert_1.default.ok(result.includes('spawn_agent'), 'maps to spawn_agent');
        node_assert_1.default.ok(result.includes('agent_type'), 'maps subagent_type to agent_type');
        node_assert_1.default.ok(result.includes('fork_context'), 'documents fork_context default');
        node_assert_1.default.ok(result.includes('wait(ids)'), 'documents parallel wait pattern');
        node_assert_1.default.ok(result.includes('close_agent'), 'documents close_agent cleanup');
        node_assert_1.default.ok(result.includes('CHECKPOINT'), 'documents result markers');
    });
});
// ─── convertClaudeAgentToCodexAgent ─────────────────────────────────────────────
(0, node_test_1.describe)('convertClaudeAgentToCodexAgent', () => {
    (0, node_test_1.test)('adds codex_agent_role header and cleans frontmatter', () => {
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
        node_assert_1.default.ok(result.startsWith('---\n'), 'starts with frontmatter');
        node_assert_1.default.ok(result.includes('"vector-executor"'), 'has quoted name');
        node_assert_1.default.ok(result.includes('"Executes Vector plans with atomic commits"'), 'has quoted description');
        node_assert_1.default.ok(!result.includes('color: yellow'), 'drops color field');
        // Tools should be in <codex_agent_role> but NOT in frontmatter
        const fmEnd = result.indexOf('---', 4);
        const frontmatterSection = result.substring(0, fmEnd);
        node_assert_1.default.ok(!frontmatterSection.includes('tools:'), 'drops tools from frontmatter');
        // Has codex_agent_role block
        node_assert_1.default.ok(result.includes('<codex_agent_role>'), 'has role header');
        node_assert_1.default.ok(result.includes('role: vector-executor'), 'role matches agent name');
        node_assert_1.default.ok(result.includes('tools: Read, Write, Edit, Bash, Grep, Glob'), 'tools in role block');
        node_assert_1.default.ok(result.includes('purpose: Executes Vector plans with atomic commits'), 'purpose from description');
        node_assert_1.default.ok(result.includes('</codex_agent_role>'), 'has closing tag');
        // Body preserved
        node_assert_1.default.ok(result.includes('<role>'), 'body content preserved');
    });
    (0, node_test_1.test)('converts slash commands in body', () => {
        const input = `---
name: vector-test
description: Test agent
tools: Read
---

Run /vector:execute-phase to proceed.`;
        const result = convertClaudeAgentToCodexAgent(input);
        node_assert_1.default.ok(result.includes('$vector-execute-phase'), 'converts slash commands');
        node_assert_1.default.ok(!result.includes('/vector:execute-phase'), 'original slash command removed');
    });
    (0, node_test_1.test)('handles content without frontmatter', () => {
        const input = 'Just some content without frontmatter.';
        const result = convertClaudeAgentToCodexAgent(input);
        node_assert_1.default.strictEqual(result, input, 'returns input unchanged');
    });
});
// ─── generateCodexAgentToml ─────────────────────────────────────────────────────
(0, node_test_1.describe)('generateCodexAgentToml', () => {
    const sampleAgent = `---
name: vector-executor
description: Executes plans
tools: Read, Write, Edit
color: yellow
---

<role>You are an executor.</role>`;
    (0, node_test_1.test)('sets workspace-write for executor', () => {
        const result = generateCodexAgentToml('vector-executor', sampleAgent);
        node_assert_1.default.ok(result.includes('sandbox_mode = "workspace-write"'), 'has workspace-write');
    });
    (0, node_test_1.test)('sets read-only for plan-checker', () => {
        const checker = `---
name: vector-plan-checker
description: Checks plans
tools: Read, Grep, Glob
---

<role>You check plans.</role>`;
        const result = generateCodexAgentToml('vector-plan-checker', checker);
        node_assert_1.default.ok(result.includes('sandbox_mode = "read-only"'), 'has read-only');
    });
    (0, node_test_1.test)('includes developer_instructions from body', () => {
        const result = generateCodexAgentToml('vector-executor', sampleAgent);
        node_assert_1.default.ok(result.includes("developer_instructions = '''"), 'has literal triple-quoted instructions');
        node_assert_1.default.ok(result.includes('<role>You are an executor.</role>'), 'body content in instructions');
        node_assert_1.default.ok(result.includes("'''"), 'has closing literal triple quotes');
    });
    (0, node_test_1.test)('defaults unknown agents to read-only', () => {
        const result = generateCodexAgentToml('vector-unknown', sampleAgent);
        node_assert_1.default.ok(result.includes('sandbox_mode = "read-only"'), 'defaults to read-only');
    });
});
// ─── CODEX_AGENT_SANDBOX mapping ────────────────────────────────────────────────
(0, node_test_1.describe)('CODEX_AGENT_SANDBOX', () => {
    (0, node_test_1.test)('has all 11 agents mapped', () => {
        const agentNames = Object.keys(CODEX_AGENT_SANDBOX);
        node_assert_1.default.strictEqual(agentNames.length, 11, 'has 11 agents');
    });
    (0, node_test_1.test)('workspace-write agents have write tools', () => {
        const writeAgents = [
            'vector-executor', 'vector-planner', 'vector-phase-researcher',
            'vector-project-researcher', 'vector-research-synthesizer', 'vector-verifier',
            'vector-codebase-mapper', 'vector-roadmapper', 'vector-debugger',
        ];
        for (const name of writeAgents) {
            node_assert_1.default.strictEqual(CODEX_AGENT_SANDBOX[name], 'workspace-write', `${name} is workspace-write`);
        }
    });
    (0, node_test_1.test)('read-only agents have no write tools', () => {
        const readOnlyAgents = ['vector-plan-checker', 'vector-integration-checker'];
        for (const name of readOnlyAgents) {
            node_assert_1.default.strictEqual(CODEX_AGENT_SANDBOX[name], 'read-only', `${name} is read-only`);
        }
    });
});
// ─── generateCodexConfigBlock ───────────────────────────────────────────────────
(0, node_test_1.describe)('generateCodexConfigBlock', () => {
    const agents = [
        { name: 'vector-executor', description: 'Executes plans' },
        { name: 'vector-planner', description: 'Creates plans' },
    ];
    (0, node_test_1.test)('starts with Vector marker', () => {
        const result = generateCodexConfigBlock(agents);
        node_assert_1.default.ok(result.startsWith(GSD_CODEX_MARKER), 'starts with marker');
    });
    (0, node_test_1.test)('does not include feature flags or agents table header', () => {
        const result = generateCodexConfigBlock(agents);
        node_assert_1.default.ok(!result.includes('[features]'), 'no features table');
        node_assert_1.default.ok(!result.includes('multi_agent'), 'no multi_agent');
        node_assert_1.default.ok(!result.includes('default_mode_request_user_input'), 'no request_user_input');
        // Should not have bare [agents] table header (only [agents.vector-*] sections)
        node_assert_1.default.ok(!result.match(/^\[agents\]\s*$/m), 'no bare [agents] table');
        node_assert_1.default.ok(!result.includes('max_threads'), 'no max_threads');
        node_assert_1.default.ok(!result.includes('max_depth'), 'no max_depth');
    });
    (0, node_test_1.test)('includes per-agent sections', () => {
        const result = generateCodexConfigBlock(agents);
        node_assert_1.default.ok(result.includes('[agents.vector-executor]'), 'has executor section');
        node_assert_1.default.ok(result.includes('[agents.vector-planner]'), 'has planner section');
        node_assert_1.default.ok(result.includes('config_file = "agents/vector-executor.toml"'), 'has executor config_file');
        node_assert_1.default.ok(result.includes('"Executes plans"'), 'has executor description');
    });
});
// ─── stripGsdFromCodexConfig ────────────────────────────────────────────────────
(0, node_test_1.describe)('stripGsdFromCodexConfig', () => {
    (0, node_test_1.test)('returns null for Vector-only config', () => {
        const content = `${GSD_CODEX_MARKER}\n[features]\nmulti_agent = true\n`;
        const result = stripGsdFromCodexConfig(content);
        node_assert_1.default.strictEqual(result, null, 'returns null when Vector-only');
    });
    (0, node_test_1.test)('preserves user content before marker', () => {
        const content = `[model]\nname = "o3"\n\n${GSD_CODEX_MARKER}\n[features]\nmulti_agent = true\n`;
        const result = stripGsdFromCodexConfig(content);
        node_assert_1.default.ok(result.includes('[model]'), 'preserves user section');
        node_assert_1.default.ok(result.includes('name = "o3"'), 'preserves user values');
        node_assert_1.default.ok(!result.includes('multi_agent'), 'removes Vector content');
        node_assert_1.default.ok(!result.includes(GSD_CODEX_MARKER), 'removes marker');
    });
    (0, node_test_1.test)('strips injected feature keys without marker', () => {
        const content = `[features]\nmulti_agent = true\ndefault_mode_request_user_input = true\nother_feature = false\n`;
        const result = stripGsdFromCodexConfig(content);
        node_assert_1.default.ok(!result.includes('multi_agent'), 'removes multi_agent');
        node_assert_1.default.ok(!result.includes('default_mode_request_user_input'), 'removes request_user_input');
        node_assert_1.default.ok(result.includes('other_feature = false'), 'preserves user features');
    });
    (0, node_test_1.test)('removes empty [features] section', () => {
        const content = `[features]\nmulti_agent = true\n[model]\nname = "o3"\n`;
        const result = stripGsdFromCodexConfig(content);
        node_assert_1.default.ok(!result.includes('[features]'), 'removes empty features section');
        node_assert_1.default.ok(result.includes('[model]'), 'preserves other sections');
    });
    (0, node_test_1.test)('strips injected keys above marker on uninstall', () => {
        // Case 3 install injects keys into [features] AND appends marker block
        const content = `[model]\nname = "o3"\n\n[features]\nmulti_agent = true\ndefault_mode_request_user_input = true\nsome_custom_flag = true\n\n${GSD_CODEX_MARKER}\n[agents]\nmax_threads = 4\n`;
        const result = stripGsdFromCodexConfig(content);
        node_assert_1.default.ok(result.includes('[model]'), 'preserves user model section');
        node_assert_1.default.ok(result.includes('some_custom_flag = true'), 'preserves user feature');
        node_assert_1.default.ok(!result.includes('multi_agent'), 'strips injected multi_agent');
        node_assert_1.default.ok(!result.includes('default_mode_request_user_input'), 'strips injected request_user_input');
        node_assert_1.default.ok(!result.includes(GSD_CODEX_MARKER), 'strips marker');
    });
    (0, node_test_1.test)('removes [agents.vector-*] sections', () => {
        const content = `[agents.vector-executor]\ndescription = "test"\nconfig_file = "agents/vector-executor.toml"\n\n[agents.custom-agent]\ndescription = "user agent"\n`;
        const result = stripGsdFromCodexConfig(content);
        node_assert_1.default.ok(!result.includes('[agents.vector-executor]'), 'removes Vector agent section');
        node_assert_1.default.ok(result.includes('[agents.custom-agent]'), 'preserves user agent section');
    });
});
// ─── mergeCodexConfig ───────────────────────────────────────────────────────────
(0, node_test_1.describe)('mergeCodexConfig', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-codex-merge-'));
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
    });
    const sampleBlock = generateCodexConfigBlock([
        { name: 'vector-executor', description: 'Executes plans' },
    ]);
    (0, node_test_1.test)('case 1: creates new config.toml', () => {
        const configPath = path_1.default.join(tmpDir, 'config.toml');
        mergeCodexConfig(configPath, sampleBlock);
        node_assert_1.default.ok(fs_1.default.existsSync(configPath), 'file created');
        const content = fs_1.default.readFileSync(configPath, 'utf8');
        node_assert_1.default.ok(content.includes(GSD_CODEX_MARKER), 'has marker');
        node_assert_1.default.ok(content.includes('[agents.vector-executor]'), 'has agent');
        node_assert_1.default.ok(!content.includes('[features]'), 'no features section');
        node_assert_1.default.ok(!content.includes('multi_agent'), 'no multi_agent');
    });
    (0, node_test_1.test)('case 2: replaces existing Vector block', () => {
        const configPath = path_1.default.join(tmpDir, 'config.toml');
        const userContent = '[model]\nname = "o3"\n';
        fs_1.default.writeFileSync(configPath, userContent + '\n' + sampleBlock + '\n');
        // Re-merge with updated block
        const newBlock = generateCodexConfigBlock([
            { name: 'vector-executor', description: 'Updated description' },
            { name: 'vector-planner', description: 'New agent' },
        ]);
        mergeCodexConfig(configPath, newBlock);
        const content = fs_1.default.readFileSync(configPath, 'utf8');
        node_assert_1.default.ok(content.includes('[model]'), 'preserves user content');
        node_assert_1.default.ok(content.includes('Updated description'), 'has new description');
        node_assert_1.default.ok(content.includes('[agents.vector-planner]'), 'has new agent');
        // Verify no duplicate markers
        const markerCount = (content.match(new RegExp(GSD_CODEX_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        node_assert_1.default.strictEqual(markerCount, 1, 'exactly one marker');
    });
    (0, node_test_1.test)('case 3: appends to config without Vector marker', () => {
        const configPath = path_1.default.join(tmpDir, 'config.toml');
        fs_1.default.writeFileSync(configPath, '[model]\nname = "o3"\n');
        mergeCodexConfig(configPath, sampleBlock);
        const content = fs_1.default.readFileSync(configPath, 'utf8');
        node_assert_1.default.ok(content.includes('[model]'), 'preserves user content');
        node_assert_1.default.ok(content.includes(GSD_CODEX_MARKER), 'adds marker');
        node_assert_1.default.ok(content.includes('[agents.vector-executor]'), 'has agent');
    });
    (0, node_test_1.test)('case 3 with existing [features]: preserves user features, does not inject Vector keys', () => {
        const configPath = path_1.default.join(tmpDir, 'config.toml');
        fs_1.default.writeFileSync(configPath, '[features]\nother_feature = true\n\n[model]\nname = "o3"\n');
        mergeCodexConfig(configPath, sampleBlock);
        const content = fs_1.default.readFileSync(configPath, 'utf8');
        node_assert_1.default.ok(content.includes('other_feature = true'), 'preserves existing feature');
        node_assert_1.default.ok(!content.includes('multi_agent'), 'does not inject multi_agent');
        node_assert_1.default.ok(!content.includes('default_mode_request_user_input'), 'does not inject request_user_input');
        node_assert_1.default.ok(content.includes(GSD_CODEX_MARKER), 'adds marker for agents block');
        node_assert_1.default.ok(content.includes('[agents.vector-executor]'), 'has agent');
    });
    (0, node_test_1.test)('idempotent: re-merge produces same result', () => {
        const configPath = path_1.default.join(tmpDir, 'config.toml');
        mergeCodexConfig(configPath, sampleBlock);
        const first = fs_1.default.readFileSync(configPath, 'utf8');
        mergeCodexConfig(configPath, sampleBlock);
        const second = fs_1.default.readFileSync(configPath, 'utf8');
        node_assert_1.default.strictEqual(first, second, 'idempotent merge');
    });
    (0, node_test_1.test)('case 2 after case 3 with existing [features]: no duplicate sections', () => {
        const configPath = path_1.default.join(tmpDir, 'config.toml');
        fs_1.default.writeFileSync(configPath, '[features]\nother_feature = true\n\n[model]\nname = "o3"\n');
        mergeCodexConfig(configPath, sampleBlock);
        mergeCodexConfig(configPath, sampleBlock);
        const content = fs_1.default.readFileSync(configPath, 'utf8');
        const featuresCount = (content.match(/^\[features\]\s*$/gm) || []).length;
        node_assert_1.default.strictEqual(featuresCount, 1, 'exactly one [features] section');
        node_assert_1.default.ok(content.includes('other_feature = true'), 'preserves user feature keys');
        node_assert_1.default.ok(content.includes('[agents.vector-executor]'), 'has agent');
        // Verify no duplicate markers
        const markerCount = (content.match(new RegExp(GSD_CODEX_MARKER.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
        node_assert_1.default.strictEqual(markerCount, 1, 'exactly one marker');
    });
    (0, node_test_1.test)('case 2 does not inject feature keys', () => {
        const configPath = path_1.default.join(tmpDir, 'config.toml');
        const manualContent = '[features]\nother_feature = true\n\n' + GSD_CODEX_MARKER + '\n[agents.vector-old]\ndescription = "old"\n';
        fs_1.default.writeFileSync(configPath, manualContent);
        mergeCodexConfig(configPath, sampleBlock);
        const content = fs_1.default.readFileSync(configPath, 'utf8');
        node_assert_1.default.ok(!content.includes('multi_agent'), 'does not inject multi_agent');
        node_assert_1.default.ok(!content.includes('default_mode_request_user_input'), 'does not inject request_user_input');
        node_assert_1.default.ok(content.includes('other_feature = true'), 'preserves user feature');
        node_assert_1.default.ok(content.includes('[agents.vector-executor]'), 'has agent from fresh block');
    });
    (0, node_test_1.test)('case 2 strips leaked [agents] and [agents.vector-*] from before content', () => {
        const configPath = path_1.default.join(tmpDir, 'config.toml');
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
            GSD_CODEX_MARKER,
            '',
            '[agents.vector-executor]',
            'description = "Executes plans"',
            'config_file = "agents/vector-executor.toml"',
            '',
        ].join('\n');
        fs_1.default.writeFileSync(configPath, brokenContent);
        mergeCodexConfig(configPath, sampleBlock);
        const content = fs_1.default.readFileSync(configPath, 'utf8');
        node_assert_1.default.ok(content.includes('child_agents_md = false'), 'preserves user feature keys');
        node_assert_1.default.ok(content.includes('[agents.vector-executor]'), 'has agent from fresh block');
        // Verify the leaked [agents] table header above marker was stripped
        const markerIndex = content.indexOf(GSD_CODEX_MARKER);
        const beforeMarker = content.substring(0, markerIndex);
        node_assert_1.default.ok(!beforeMarker.match(/^\[agents\]\s*$/m), 'no leaked [agents] above marker');
        node_assert_1.default.ok(!beforeMarker.includes('[agents.vector-'), 'no leaked [agents.vector-*] above marker');
    });
    (0, node_test_1.test)('case 2 idempotent after case 3 with existing [features]', () => {
        const configPath = path_1.default.join(tmpDir, 'config.toml');
        fs_1.default.writeFileSync(configPath, '[features]\nother_feature = true\n');
        mergeCodexConfig(configPath, sampleBlock);
        const first = fs_1.default.readFileSync(configPath, 'utf8');
        mergeCodexConfig(configPath, sampleBlock);
        const second = fs_1.default.readFileSync(configPath, 'utf8');
        mergeCodexConfig(configPath, sampleBlock);
        const third = fs_1.default.readFileSync(configPath, 'utf8');
        node_assert_1.default.strictEqual(first, second, 'idempotent after 2nd merge');
        node_assert_1.default.strictEqual(second, third, 'idempotent after 3rd merge');
    });
});
// ─── Integration: installCodexConfig ────────────────────────────────────────────
(0, node_test_1.describe)('installCodexConfig (integration)', () => {
    let tmpTarget;
    const agentsSrc = path_1.default.join(__dirname, '..', 'agents');
    (0, node_test_1.beforeEach)(() => {
        tmpTarget = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-codex-install-'));
    });
    (0, node_test_1.afterEach)(() => {
        fs_1.default.rmSync(tmpTarget, { recursive: true, force: true });
    });
    // Only run if agents/ directory exists (not in CI without full checkout)
    const hasAgents = fs_1.default.existsSync(agentsSrc);
    (hasAgents ? node_test_1.test : node_test_1.test.skip)('generates config.toml and agent .toml files', () => {
        const { installCodexConfig } = require('../bin/install.cjs');
        const count = installCodexConfig(tmpTarget, agentsSrc);
        node_assert_1.default.ok(count >= 11, `installed ${count} agents (expected >= 11)`);
        // Verify config.toml
        const configPath = path_1.default.join(tmpTarget, 'config.toml');
        node_assert_1.default.ok(fs_1.default.existsSync(configPath), 'config.toml exists');
        const config = fs_1.default.readFileSync(configPath, 'utf8');
        node_assert_1.default.ok(config.includes(GSD_CODEX_MARKER), 'has Vector marker');
        node_assert_1.default.ok(config.includes('[agents.vector-executor]'), 'has executor agent');
        node_assert_1.default.ok(!config.includes('multi_agent'), 'no feature flags');
        // Verify per-agent .toml files
        const agentsDir = path_1.default.join(tmpTarget, 'agents');
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(agentsDir, 'vector-executor.toml')), 'executor .toml exists');
        node_assert_1.default.ok(fs_1.default.existsSync(path_1.default.join(agentsDir, 'vector-plan-checker.toml')), 'plan-checker .toml exists');
        const executorToml = fs_1.default.readFileSync(path_1.default.join(agentsDir, 'vector-executor.toml'), 'utf8');
        node_assert_1.default.ok(executorToml.includes('sandbox_mode = "workspace-write"'), 'executor is workspace-write');
        node_assert_1.default.ok(executorToml.includes('developer_instructions'), 'has developer_instructions');
        const checkerToml = fs_1.default.readFileSync(path_1.default.join(agentsDir, 'vector-plan-checker.toml'), 'utf8');
        node_assert_1.default.ok(checkerToml.includes('sandbox_mode = "read-only"'), 'plan-checker is read-only');
    });
});
//# sourceMappingURL=codex-config.test.cjs.map