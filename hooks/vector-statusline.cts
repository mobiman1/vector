#!/usr/bin/env node
// Claude Code Statusline - Vector Edition
// Shows: model | current task | directory | context usage

import fs from 'fs';
import path from 'path';
import os from 'os';

interface StatuslineInput {
  model?: { display_name?: string };
  workspace?: { current_dir?: string };
  session_id?: string;
  context_window?: { remaining_percentage?: number };
}

interface TodoItem {
  status: string;
  activeForm?: string;
}

interface TodoFile {
  name: string;
  mtime: Date;
}

interface UpdateCache {
  update_available?: boolean;
}

let input = '';
// Timeout guard: if stdin doesn't close within 3s (e.g. pipe issues on
// Windows/Git Bash), exit silently instead of hanging. See #775.
const stdinTimeout = setTimeout(() => process.exit(0), 3000);
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk: string) => { input += chunk; });
process.stdin.on('end', () => {
  clearTimeout(stdinTimeout);
  try {
    const data = JSON.parse(input) as StatuslineInput;
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
          const bridgePath = path.join(os.tmpdir(), `claude-ctx-${session}.json`);
          const bridgeData = JSON.stringify({
            session_id: session,
            remaining_percentage: remaining,
            used_pct: used,
            timestamp: Math.floor(Date.now() / 1000),
          });
          fs.writeFileSync(bridgePath, bridgeData);
        } catch {
          // Silent fail -- bridge is best-effort, don't break statusline
        }
      }

      // Build progress bar (10 segments)
      const filled = Math.floor(used / 10);
      const bar = '█'.repeat(filled) + '░'.repeat(10 - filled);

      if (used < 50) {
        ctx = ` \x1b[32m${bar} ${used}%\x1b[0m`;
      } else if (used < 65) {
        ctx = ` \x1b[33m${bar} ${used}%\x1b[0m`;
      } else if (used < 80) {
        ctx = ` \x1b[38;5;208m${bar} ${used}%\x1b[0m`;
      } else {
        ctx = ` \x1b[5;31m💀 ${bar} ${used}%\x1b[0m`;
      }
    }

    // Current task from todos
    let task = '';
    const homeDir = os.homedir();
    const claudeDir = process.env.CLAUDE_CONFIG_DIR ?? path.join(homeDir, '.claude');
    const todosDir = path.join(claudeDir, 'todos');
    if (session && fs.existsSync(todosDir)) {
      try {
        const files: TodoFile[] = fs.readdirSync(todosDir)
          .filter((f: string) => f.startsWith(session) && f.includes('-agent-') && f.endsWith('.json'))
          .map((f: string) => ({ name: f, mtime: fs.statSync(path.join(todosDir, f)).mtime }))
          .sort((a: TodoFile, b: TodoFile) => b.mtime.getTime() - a.mtime.getTime());

        if (files.length > 0 && files[0]) {
          try {
            const todos = JSON.parse(fs.readFileSync(path.join(todosDir, files[0].name), 'utf8')) as TodoItem[];
            const inProgress = todos.find((t: TodoItem) => t.status === 'in_progress');
            if (inProgress) task = inProgress.activeForm ?? '';
          } catch {
            // ignore
          }
        }
      } catch {
        // Silently fail on file system errors - don't break statusline
      }
    }

    // Vector update available?
    let vectorUpdate = '';
    const cacheFile = path.join(claudeDir, 'cache', 'vector-update-check.json');
    if (fs.existsSync(cacheFile)) {
      try {
        const cache = JSON.parse(fs.readFileSync(cacheFile, 'utf8')) as UpdateCache;
        if (cache.update_available) {
          vectorUpdate = '\x1b[33m⬆ /vector:update\x1b[0m │ ';
        }
      } catch {
        // ignore
      }
    }

    const dirname = path.basename(dir);
    if (task) {
      process.stdout.write(`${vectorUpdate}\x1b[2m${model}\x1b[0m │ \x1b[1m${task}\x1b[0m │ \x1b[2m${dirname}\x1b[0m${ctx}`);
    } else {
      process.stdout.write(`${vectorUpdate}\x1b[2m${model}\x1b[0m │ \x1b[2m${dirname}\x1b[0m${ctx}`);
    }
  } catch {
    // Silent fail - don't break statusline on parse errors
  }
});
