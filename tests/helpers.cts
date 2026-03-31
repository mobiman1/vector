/**
 * Vector Tools Test Helpers
 */

import { execSync, execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import os from 'os';

export const TOOLS_PATH = path.join(__dirname, '..', 'core', 'bin', 'vector-tools.cjs');

/**
 * Run vector-tools command.
 *
 * @param args - Command string (shell-interpreted) or array
 *   of arguments (shell-bypassed via execFileSync, safe for JSON and dollar signs).
 * @param cwd - Working directory.
 */
export function runVectorTools(args: string | string[], cwd = process.cwd()) {
  try {
    let result: string;
    if (Array.isArray(args)) {
      result = execFileSync(process.execPath, [TOOLS_PATH, ...args], {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } else {
      result = execSync(`node "${TOOLS_PATH}" ${args}`, {
        cwd,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    }
    return { success: true, output: result.trim() };
  } catch (err) {
    const e = err as { stdout?: Buffer | string; stderr?: Buffer | string; message: string };
    return {
      success: false,
      output: e.stdout?.toString().trim() || '',
      error: e.stderr?.toString().trim() || e.message,
    };
  }
}

// Create temp directory structure
export function createTempProject() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });
  return tmpDir;
}

// Create temp directory with initialized git repo and at least one commit
export function createTempGitProject() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'vector-test-'));
  fs.mkdirSync(path.join(tmpDir, '.planning', 'phases'), { recursive: true });

  execSync('git init', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.email "test@test.com"', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git config user.name "Test"', { cwd: tmpDir, stdio: 'pipe' });

  fs.writeFileSync(
    path.join(tmpDir, '.planning', 'PROJECT.md'),
    '# Project\n\nTest project.\n'
  );

  execSync('git add -A', { cwd: tmpDir, stdio: 'pipe' });
  execSync('git commit -m "initial commit"', { cwd: tmpDir, stdio: 'pipe' });

  return tmpDir;
}

export function cleanup(tmpDir: string) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
