#!/usr/bin/env node
"use strict";
// Claude Code Statusline - Vector Edition
// Shows: model | current task | directory | context usage
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
let input = '';
// Timeout guard: if stdin doesn't close within 3s (e.g. pipe issues on
// Windows/Git Bash), exit silently instead of hanging. See #775.
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => { input += chunk; });
process.stdin.on('end', () => {
    clearTimeout(stdinTimeout);
    try {
        const data = JSON.parse(input);
        const model = data.model?.display_name ?? 'Claude';
        const dir = data.workspace?.current_dir ?? process.cwd();
        const session = data.session_id ?? '';
        const remaining = data.context_window?.remaining_percentage;
        // Context window display (shows USED percentage scaled to usable context)
        // Claude Code reserves ~16.5% for autocompact buffer, so usable context
        // is 83.5% of the total window. We normalize to show 100% at that point.
        const AUTO_COMPACT_BUFFER_PCT = 16.5;
        let ctx = '';
        if (remaining != null) {
            const usableRemaining = Math.max(0, ((remaining - AUTO_COMPACT_BUFFER_PCT) / (100 - AUTO_COMPACT_BUFFER_PCT)) * 100);
            const used = Math.max(0, Math.min(100, Math.round(100 - usableRemaining)));
            // Write context metrics to bridge file for the context-monitor PostToolUse hook.
            if (session) {
                try {
                    const bridgePath = path_1.default.join(os_1.default.tmpdir(), `claude-ctx-${session}.json`);
                    const bridgeData = JSON.stringify({
                        session_id: session,
                        remaining_percentage: remaining,
                        used_pct: used,
                        timestamp: Math.floor(Date.now() / 1000),
                    });
                    fs_1.default.writeFileSync(bridgePath, bridgeData);
                }
                catch {
                    // Silent fail -- bridge is best-effort, don't break statusline
                }
            }
            // Build progress bar (10 segments)
            const filled = Math.floor(used / 10);
            const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);
            if (used < 50) {
                ctx = ` \x1b[32m${bar} ${used}%\x1b[0m`;
            }
            else if (used < 65) {
                ctx = ` \x1b[33m${bar} ${used}%\x1b[0m`;
            }
            else if (used < 80) {
                ctx = ` \x1b[38;5;208m${bar} ${used}%\x1b[0m`;
            }
            else {
                ctx = ` \x1b[5;31m💀 ${bar} ${used}%\x1b[0m`;
            }
        }
        // Current task from todos
        let task = '';
        const homeDir = os_1.default.homedir();
        const claudeDir = process.env.CLAUDE_CONFIG_DIR ?? path_1.default.join(homeDir, '.claude');
        const todosDir = path_1.default.join(claudeDir, 'todos');
        if (session && fs_1.default.existsSync(todosDir)) {
            try {
                const files = fs_1.default.readdirSync(todosDir)
                    .filter((f) => f.startsWith(session) && f.includes('-agent-') && f.endsWith('.json'))
                    .map((f) => ({ name: f, mtime: fs_1.default.statSync(path_1.default.join(todosDir, f)).mtime }))
                    .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());
                if (files.length > 0 && files[0]) {
                    try {
                        const todos = JSON.parse(fs_1.default.readFileSync(path_1.default.join(todosDir, files[0].name), 'utf8'));
                        const inProgress = todos.find((t) => t.status === 'in_progress');
                        if (inProgress)
                            task = inProgress.activeForm ?? '';
                    }
                    catch {
                        // ignore
                    }
                }
            }
            catch {
                // Silently fail on file system errors - don't break statusline
            }
        }
        // Vector update available?
        let vectorUpdate = '';
        const cacheFile = path_1.default.join(claudeDir, 'cache', 'vector-update-check.json');
        if (fs_1.default.existsSync(cacheFile)) {
            try {
                const cache = JSON.parse(fs_1.default.readFileSync(cacheFile, 'utf8'));
                if (cache.update_available) {
                    vectorUpdate = '\x1b[33m⬆ /vector:update\x1b[0m │ ';
                }
            }
            catch {
                // ignore
            }
        }
        const dirname = path_1.default.basename(dir);
        if (task) {
            process.stdout.write(`${vectorUpdate}\x1b[2m${model}\x1b[0m │ \x1b[1m${task}\x1b[0m │ \x1b[2m${dirname}\x1b[0m${ctx}`);
        }
        else {
            process.stdout.write(`${vectorUpdate}\x1b[2m${model}\x1b[0m │ \x1b[2m${dirname}\x1b[0m${ctx}`);
        }
    }
    catch {
        // Silent fail - don't break statusline on parse errors
    }
});
//# sourceMappingURL=vector-statusline.cjs.map