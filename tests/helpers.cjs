"use strict";
/**
 * Vector Tools Test Helpers
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runVectorTools = exports.TOOLS_PATH = void 0;
exports.runGsdTools = runGsdTools;
exports.createTempProject = createTempProject;
exports.createTempGitProject = createTempGitProject;
exports.cleanup = cleanup;
const child_process_1 = require("child_process");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
exports.TOOLS_PATH = path_1.default.join(__dirname, '..', 'core', 'bin', 'vector-tools.cjs');
/**
 * Run vector-tools command.
 *
 * @param args - Command string (shell-interpreted) or array
 *   of arguments (shell-bypassed via execFileSync, safe for JSON and dollar signs).
 * @param cwd - Working directory.
 */
function runGsdTools(args, cwd = process.cwd()) {
    try {
        let result;
        if (Array.isArray(args)) {
            result = (0, child_process_1.execFileSync)(process.execPath, [exports.TOOLS_PATH, ...args], {
                cwd,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe'],
            });
        }
        else {
            result = (0, child_process_1.execSync)(`node "${exports.TOOLS_PATH}" ${args}`, {
                cwd,
                encoding: 'utf-8',
                stdio: ['pipe', 'pipe', 'pipe'],
            });
        }
        return { success: true, output: result.trim() };
    }
    catch (err) {
        const e = err;
        return {
            success: false,
            output: e.stdout?.toString().trim() || '',
            error: e.stderr?.toString().trim() || e.message,
        };
    }
}
// Alias for backward compat
exports.runVectorTools = runGsdTools;
// Create temp directory structure
function createTempProject() {
    const tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-test-'));
    fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases'), { recursive: true });
    return tmpDir;
}
// Create temp directory with initialized git repo and at least one commit
function createTempGitProject() {
    const tmpDir = fs_1.default.mkdtempSync(path_1.default.join(os_1.default.tmpdir(), 'vector-test-'));
    fs_1.default.mkdirSync(path_1.default.join(tmpDir, '.planning', 'phases'), { recursive: true });
    (0, child_process_1.execSync)('git init', { cwd: tmpDir, stdio: 'pipe' });
    (0, child_process_1.execSync)('git config user.email "test@test.com"', { cwd: tmpDir, stdio: 'pipe' });
    (0, child_process_1.execSync)('git config user.name "Test"', { cwd: tmpDir, stdio: 'pipe' });
    fs_1.default.writeFileSync(path_1.default.join(tmpDir, '.planning', 'PROJECT.md'), '# Project\n\nTest project.\n');
    (0, child_process_1.execSync)('git add -A', { cwd: tmpDir, stdio: 'pipe' });
    (0, child_process_1.execSync)('git commit -m "initial commit"', { cwd: tmpDir, stdio: 'pipe' });
    return tmpDir;
}
function cleanup(tmpDir) {
    fs_1.default.rmSync(tmpDir, { recursive: true, force: true });
}
//# sourceMappingURL=helpers.cjs.map