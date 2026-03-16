#!/usr/bin/env node
"use strict";
// Context Monitor - PostToolUse/AfterTool hook (Gemini uses AfterTool)
// Reads context metrics from the statusline bridge file and injects
// warnings when context usage is high. This makes the AGENT aware of
// context limits (the statusline only shows the user).
//
// How it works:
// 1. The statusline hook writes metrics to /tmp/claude-ctx-{session_id}.json
// 2. This hook reads those metrics after each tool use
// 3. When remaining context drops below thresholds, it injects a warning
//    as additionalContext, which the agent sees in its conversation
//
// Thresholds:
//   WARNING  (remaining <= 35%): Agent should wrap up current task
//   CRITICAL (remaining <= 25%): Agent should stop immediately and save state
//
// Debounce: 5 tool uses between warnings to avoid spam
// Severity escalation bypasses debounce (WARNING -> CRITICAL fires immediately)
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const os_1 = __importDefault(require("os"));
const path_1 = __importDefault(require("path"));
const WARNING_THRESHOLD = 35; // remaining_percentage <= 35%
const CRITICAL_THRESHOLD = 25; // remaining_percentage <= 25%
const STALE_SECONDS = 60; // ignore metrics older than 60s
const DEBOUNCE_CALLS = 5; // min tool uses between warnings
let input = '';
// Timeout guard: if stdin doesn't close within 3s (e.g. pipe issues on
// Windows/Git Bash), exit silently instead of hanging until Claude Code
// kills the process and reports "hook error". See #775.
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
    clearTimeout(stdinTimeout);
    try {
        const data = JSON.parse(input);
        const sessionId = data.session_id;
        if (!sessionId) {
            process.exit(0);
        }
        const tmpDir = os_1.default.tmpdir();
        const metricsPath = path_1.default.join(tmpDir, `claude-ctx-${sessionId}.json`);
        // If no metrics file, this is a subagent or fresh session -- exit silently
        if (!fs_1.default.existsSync(metricsPath)) {
            process.exit(0);
        }
        const metrics = JSON.parse(fs_1.default.readFileSync(metricsPath, 'utf8'));
        const now = Math.floor(Date.now() / 1000);
        // Ignore stale metrics
        if (metrics.timestamp && (now - metrics.timestamp) > STALE_SECONDS) {
            process.exit(0);
        }
        const remaining = metrics.remaining_percentage;
        const usedPct = metrics.used_pct;
        // No warning needed
        if (remaining > WARNING_THRESHOLD) {
            process.exit(0);
        }
        // Debounce: check if we warned recently
        const warnPath = path_1.default.join(tmpDir, `claude-ctx-${sessionId}-warned.json`);
        let warnData = { callsSinceWarn: 0, lastLevel: null };
        let firstWarn = true;
        if (fs_1.default.existsSync(warnPath)) {
            try {
                warnData = JSON.parse(fs_1.default.readFileSync(warnPath, 'utf8'));
                firstWarn = false;
            }
            catch {
                // Corrupted file, reset
            }
        }
        warnData.callsSinceWarn = (warnData.callsSinceWarn || 0) + 1;
        const isCritical = remaining <= CRITICAL_THRESHOLD;
        const currentLevel = isCritical ? 'critical' : 'warning';
        // Emit immediately on first warning, then debounce subsequent ones
        // Severity escalation (WARNING -> CRITICAL) bypasses debounce
        const severityEscalated = currentLevel === 'critical' && warnData.lastLevel === 'warning';
        if (!firstWarn && warnData.callsSinceWarn < DEBOUNCE_CALLS && !severityEscalated) {
            fs_1.default.writeFileSync(warnPath, JSON.stringify(warnData));
            process.exit(0);
        }
        // Reset debounce counter
        warnData.callsSinceWarn = 0;
        warnData.lastLevel = currentLevel;
        fs_1.default.writeFileSync(warnPath, JSON.stringify(warnData));
        // Detect if Vector is active (has .planning/STATE.md in working directory)
        const hookCwd = data.cwd || process.cwd();
        const isVectorActive = fs_1.default.existsSync(path_1.default.join(hookCwd, '.planning', 'STATE.md'));
        let message;
        if (isCritical) {
            message = isVectorActive
                ? `CONTEXT CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
                    'Context is nearly exhausted. Do NOT start new complex work or write handoff files — ' +
                    'Vector state is already tracked in STATE.md. Inform the user so they can run ' +
                    '/vector:pause-work at the next natural stopping point.'
                : `CONTEXT CRITICAL: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
                    'Context is nearly exhausted. Inform the user that context is low and ask how they ' +
                    'want to proceed. Do NOT autonomously save state or write handoff files unless the user asks.';
        }
        else {
            message = isVectorActive
                ? `CONTEXT WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
                    'Context is getting limited. Avoid starting new complex work. If not between ' +
                    'defined plan steps, inform the user so they can prepare to pause.'
                : `CONTEXT WARNING: Usage at ${usedPct}%. Remaining: ${remaining}%. ` +
                    'Be aware that context is getting limited. Avoid unnecessary exploration or ' +
                    'starting new complex work.';
        }
        const output = {
            hookSpecificOutput: {
                hookEventName: process.env.GEMINI_API_KEY ? 'AfterTool' : 'PostToolUse',
                additionalContext: message,
            },
        };
        process.stdout.write(JSON.stringify(output));
    }
    catch {
        // Silent fail -- never block tool execution
        process.exit(0);
    }
});
//# sourceMappingURL=vector-context-monitor.cjs.map