#!/usr/bin/env node
"use strict";
// Check for Vector updates in background, write result to cache
// Called by SessionStart hook - runs once per session
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const child_process_1 = require("child_process");
const homeDir = os_1.default.homedir();
const cwd = process.cwd();
// Detect runtime config directory (supports Claude, OpenCode, Gemini)
// Respects CLAUDE_CONFIG_DIR for custom config directory setups
function detectConfigDir(baseDir) {
    const envDir = process.env.CLAUDE_CONFIG_DIR;
    if (envDir && fs_1.default.existsSync(path_1.default.join(envDir, 'core', 'VERSION'))) {
        return envDir;
    }
    for (const dir of ['.config/opencode', '.opencode', '.gemini', '.claude']) {
        if (fs_1.default.existsSync(path_1.default.join(baseDir, dir, 'core', 'VERSION'))) {
            return path_1.default.join(baseDir, dir);
        }
    }
    return envDir || path_1.default.join(baseDir, '.claude');
}
const globalConfigDir = detectConfigDir(homeDir);
const projectConfigDir = detectConfigDir(cwd);
const cacheDir = path_1.default.join(globalConfigDir, 'cache');
const cacheFile = path_1.default.join(cacheDir, 'vector-update-check.json');
// VERSION file locations (check project first, then global)
const projectVersionFile = path_1.default.join(projectConfigDir, 'core', 'VERSION');
const globalVersionFile = path_1.default.join(globalConfigDir, 'core', 'VERSION');
// Ensure cache directory exists
if (!fs_1.default.existsSync(cacheDir)) {
    fs_1.default.mkdirSync(cacheDir, { recursive: true });
}
// Run check in background (spawn background process, windowsHide prevents console flash)
// ts-ignore: the child script is a plain Node.js string template, not checkable by tsc
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const child = (0, child_process_1.spawn)(process.execPath, ['-e', `
  const fs = require('fs');
  const { execSync } = require('child_process');

  const cacheFile = ${JSON.stringify(cacheFile)};
  const projectVersionFile = ${JSON.stringify(projectVersionFile)};
  const globalVersionFile = ${JSON.stringify(globalVersionFile)};

  let installed = '0.0.0';
  try {
    if (fs.existsSync(projectVersionFile)) {
      installed = fs.readFileSync(projectVersionFile, 'utf8').trim();
    } else if (fs.existsSync(globalVersionFile)) {
      installed = fs.readFileSync(globalVersionFile, 'utf8').trim();
    }
  } catch (e) {}

  let latest = null;
  try {
    latest = execSync('npm view vector version', { encoding: 'utf8', timeout: 10000, windowsHide: true }).trim();
  } catch (e) {}

  const result = {
    update_available: latest && installed !== latest,
    installed,
    latest: latest || 'unknown',
    checked: Math.floor(Date.now() / 1000)
  };

  fs.writeFileSync(cacheFile, JSON.stringify(result));
`], {
    stdio: 'ignore',
    windowsHide: true,
    detached: true,
});
child.unref();
//# sourceMappingURL=vector-check-update.cjs.map