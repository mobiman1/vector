"use strict";
/**
 * Vector Tools Tests - config.cjs
 *
 * CLI integration tests for config-ensure-section, config-set, and config-get
 * commands exercised through vector-tools.cjs via execSync.
 *
 * Requirements: TEST-13
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_test_1 = require("node:test");
const node_assert_1 = __importDefault(require("node:assert"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const helpers_cjs_1 = require("./helpers.cjs");
// ─── helpers ──────────────────────────────────────────────────────────────────
function readConfig(tmpDir) {
    const configPath = path_1.default.join(tmpDir, '.planning', 'config.json');
    return JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
}
function writeConfig(tmpDir, obj) {
    const configPath = path_1.default.join(tmpDir, '.planning', 'config.json');
    fs_1.default.writeFileSync(configPath, JSON.stringify(obj, null, 2), 'utf-8');
}
// ─── config-ensure-section ───────────────────────────────────────────────────
(0, node_test_1.describe)('config-ensure-section command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('creates config.json with expected structure and types', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-ensure-section', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.created, true);
        const config = readConfig(tmpDir);
        // Verify structure and types — exact values may vary if ~/.vector/defaults.json exists
        node_assert_1.default.strictEqual(typeof config.model_profile, 'string');
        node_assert_1.default.strictEqual(typeof config.commit_docs, 'boolean');
        node_assert_1.default.strictEqual(typeof config.parallelization, 'boolean');
        node_assert_1.default.strictEqual(typeof config.branching_strategy, 'string');
        node_assert_1.default.ok(config.workflow && typeof config.workflow === 'object', 'workflow should be an object');
        node_assert_1.default.strictEqual(typeof config.workflow.research, 'boolean');
        node_assert_1.default.strictEqual(typeof config.workflow.plan_check, 'boolean');
        node_assert_1.default.strictEqual(typeof config.workflow.verifier, 'boolean');
        node_assert_1.default.strictEqual(typeof config.workflow.nyquist_validation, 'boolean');
        // These hardcoded defaults are always present (may be overridden by user defaults)
        node_assert_1.default.ok('model_profile' in config, 'model_profile should exist');
        node_assert_1.default.ok('brave_search' in config, 'brave_search should exist');
        node_assert_1.default.ok('search_gitignored' in config, 'search_gitignored should exist');
    });
    (0, node_test_1.test)('is idempotent — returns already_exists on second call', () => {
        const first = (0, helpers_cjs_1.runGsdTools)('config-ensure-section', tmpDir);
        node_assert_1.default.ok(first.success, `First call failed: ${first.error}`);
        const firstOutput = JSON.parse(first.output);
        node_assert_1.default.strictEqual(firstOutput.created, true);
        const second = (0, helpers_cjs_1.runGsdTools)('config-ensure-section', tmpDir);
        node_assert_1.default.ok(second.success, `Second call failed: ${second.error}`);
        const secondOutput = JSON.parse(second.output);
        node_assert_1.default.strictEqual(secondOutput.created, false);
        node_assert_1.default.strictEqual(secondOutput.reason, 'already_exists');
    });
    // NOTE: This test touches ~/.vector/ on the real filesystem. It uses save/restore
    // try/finally and skips if the file already exists to avoid corrupting user config.
    (0, node_test_1.test)('detects Brave Search from file-based key', () => {
        const homedir = os_1.default.homedir();
        const vectorDir = path_1.default.join(homedir, '.vector');
        const braveKeyFile = path_1.default.join(vectorDir, 'brave_api_key');
        // Skip if file already exists (don't mess with user's real config)
        if (fs_1.default.existsSync(braveKeyFile)) {
            return;
        }
        // Create .vector dir and brave_api_key file
        const vectorDirExisted = fs_1.default.existsSync(vectorDir);
        try {
            if (!vectorDirExisted) {
                fs_1.default.mkdirSync(vectorDir, { recursive: true });
            }
            fs_1.default.writeFileSync(braveKeyFile, 'test-key', 'utf-8');
            const result = (0, helpers_cjs_1.runGsdTools)('config-ensure-section', tmpDir);
            node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
            const config = readConfig(tmpDir);
            node_assert_1.default.strictEqual(config.brave_search, true);
        }
        finally {
            // Clean up
            try {
                fs_1.default.unlinkSync(braveKeyFile);
            }
            catch { /* ignore */ }
            if (!vectorDirExisted) {
                try {
                    fs_1.default.rmdirSync(vectorDir);
                }
                catch { /* ignore if not empty */ }
            }
        }
    });
    // NOTE: This test touches ~/.vector/ on the real filesystem. It uses save/restore
    // try/finally and skips if the file already exists to avoid corrupting user config.
    (0, node_test_1.test)('merges user defaults from defaults.json', () => {
        const homedir = os_1.default.homedir();
        const vectorDir = path_1.default.join(homedir, '.vector');
        const defaultsFile = path_1.default.join(vectorDir, 'defaults.json');
        // Save existing defaults if present
        let existingDefaults = null;
        const vectorDirExisted = fs_1.default.existsSync(vectorDir);
        if (fs_1.default.existsSync(defaultsFile)) {
            existingDefaults = fs_1.default.readFileSync(defaultsFile, 'utf-8');
        }
        try {
            if (!vectorDirExisted) {
                fs_1.default.mkdirSync(vectorDir, { recursive: true });
            }
            fs_1.default.writeFileSync(defaultsFile, JSON.stringify({
                model_profile: 'quality',
                commit_docs: false,
            }), 'utf-8');
            const result = (0, helpers_cjs_1.runGsdTools)('config-ensure-section', tmpDir);
            node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
            const config = readConfig(tmpDir);
            node_assert_1.default.strictEqual(config.model_profile, 'quality', 'model_profile should be overridden');
            node_assert_1.default.strictEqual(config.commit_docs, false, 'commit_docs should be overridden');
            node_assert_1.default.strictEqual(typeof config.branching_strategy, 'string', 'branching_strategy should be a string');
        }
        finally {
            // Restore
            if (existingDefaults !== null) {
                fs_1.default.writeFileSync(defaultsFile, existingDefaults, 'utf-8');
            }
            else {
                try {
                    fs_1.default.unlinkSync(defaultsFile);
                }
                catch { /* ignore */ }
            }
            if (!vectorDirExisted) {
                try {
                    fs_1.default.rmdirSync(vectorDir);
                }
                catch { /* ignore */ }
            }
        }
    });
    // NOTE: This test touches ~/.vector/ on the real filesystem. It uses save/restore
    // try/finally and skips if the file already exists to avoid corrupting user config.
    (0, node_test_1.test)('merges nested workflow keys from defaults.json preserving unset keys', () => {
        const homedir = os_1.default.homedir();
        const vectorDir = path_1.default.join(homedir, '.vector');
        const defaultsFile = path_1.default.join(vectorDir, 'defaults.json');
        let existingDefaults = null;
        const vectorDirExisted = fs_1.default.existsSync(vectorDir);
        if (fs_1.default.existsSync(defaultsFile)) {
            existingDefaults = fs_1.default.readFileSync(defaultsFile, 'utf-8');
        }
        try {
            if (!vectorDirExisted) {
                fs_1.default.mkdirSync(vectorDir, { recursive: true });
            }
            fs_1.default.writeFileSync(defaultsFile, JSON.stringify({
                workflow: { research: false },
            }), 'utf-8');
            const result = (0, helpers_cjs_1.runGsdTools)('config-ensure-section', tmpDir);
            node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
            const config = readConfig(tmpDir);
            node_assert_1.default.strictEqual(config.workflow.research, false, 'research should be overridden');
            node_assert_1.default.strictEqual(typeof config.workflow.plan_check, 'boolean', 'plan_check should be a boolean');
            node_assert_1.default.strictEqual(typeof config.workflow.verifier, 'boolean', 'verifier should be a boolean');
        }
        finally {
            if (existingDefaults !== null) {
                fs_1.default.writeFileSync(defaultsFile, existingDefaults, 'utf-8');
            }
            else {
                try {
                    fs_1.default.unlinkSync(defaultsFile);
                }
                catch { /* ignore */ }
            }
            if (!vectorDirExisted) {
                try {
                    fs_1.default.rmdirSync(vectorDir);
                }
                catch { /* ignore */ }
            }
        }
    });
});
// ─── config-set ──────────────────────────────────────────────────────────────
(0, node_test_1.describe)('config-set command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
        // Create initial config
        (0, helpers_cjs_1.runGsdTools)('config-ensure-section', tmpDir);
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('sets a top-level string value', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-set model_profile quality', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output.updated, true);
        node_assert_1.default.strictEqual(output.key, 'model_profile');
        node_assert_1.default.strictEqual(output.value, 'quality');
        const config = readConfig(tmpDir);
        node_assert_1.default.strictEqual(config.model_profile, 'quality');
    });
    (0, node_test_1.test)('coerces true to boolean', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-set commit_docs true', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const config = readConfig(tmpDir);
        node_assert_1.default.strictEqual(config.commit_docs, true);
        node_assert_1.default.strictEqual(typeof config.commit_docs, 'boolean');
    });
    (0, node_test_1.test)('coerces false to boolean', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-set commit_docs false', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const config = readConfig(tmpDir);
        node_assert_1.default.strictEqual(config.commit_docs, false);
        node_assert_1.default.strictEqual(typeof config.commit_docs, 'boolean');
    });
    (0, node_test_1.test)('coerces numeric strings to numbers', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-set granularity 42', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const config = readConfig(tmpDir);
        node_assert_1.default.strictEqual(config.granularity, 42);
        node_assert_1.default.strictEqual(typeof config.granularity, 'number');
    });
    (0, node_test_1.test)('preserves plain strings', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-set model_profile hello', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const config = readConfig(tmpDir);
        node_assert_1.default.strictEqual(config.model_profile, 'hello');
        node_assert_1.default.strictEqual(typeof config.model_profile, 'string');
    });
    (0, node_test_1.test)('sets nested values via dot-notation', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-set workflow.research false', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const config = readConfig(tmpDir);
        node_assert_1.default.strictEqual(config.workflow.research, false);
    });
    (0, node_test_1.test)('auto-creates nested objects for dot-notation', () => {
        // Start with empty config
        writeConfig(tmpDir, {});
        const result = (0, helpers_cjs_1.runGsdTools)('config-set workflow.research false', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const config = readConfig(tmpDir);
        node_assert_1.default.strictEqual(config.workflow.research, false);
        node_assert_1.default.strictEqual(typeof config.workflow, 'object');
    });
    (0, node_test_1.test)('rejects unknown config keys', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-set workflow.nyquist_validation_enabled false', tmpDir);
        node_assert_1.default.strictEqual(result.success, false);
        node_assert_1.default.ok(result.error.includes('Unknown config key'), `Expected "Unknown config key" in error: ${result.error}`);
    });
    (0, node_test_1.test)('errors when no key path provided', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-set', tmpDir);
        node_assert_1.default.strictEqual(result.success, false);
    });
    (0, node_test_1.test)('rejects known invalid nyquist alias keys with a suggestion', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-set workflow.nyquist_validation_enabled false', tmpDir);
        node_assert_1.default.strictEqual(result.success, false);
        node_assert_1.default.match(result.error, /Unknown config key: workflow\.nyquist_validation_enabled/);
        node_assert_1.default.match(result.error, /workflow\.nyquist_validation/);
        const config = readConfig(tmpDir);
        node_assert_1.default.strictEqual(config.workflow.nyquist_validation_enabled, undefined);
        node_assert_1.default.strictEqual(config.workflow.nyquist_validation, true);
    });
});
// ─── config-get ──────────────────────────────────────────────────────────────
(0, node_test_1.describe)('config-get command', () => {
    let tmpDir;
    (0, node_test_1.beforeEach)(() => {
        tmpDir = (0, helpers_cjs_1.createTempProject)();
        // Create config with known values
        (0, helpers_cjs_1.runGsdTools)('config-ensure-section', tmpDir);
    });
    (0, node_test_1.afterEach)(() => {
        (0, helpers_cjs_1.cleanup)(tmpDir);
    });
    (0, node_test_1.test)('gets a top-level value', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-get model_profile', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output, 'balanced');
    });
    (0, node_test_1.test)('gets a nested value via dot-notation', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-get workflow.research', tmpDir);
        node_assert_1.default.ok(result.success, `Command failed: ${result.error}`);
        const output = JSON.parse(result.output);
        node_assert_1.default.strictEqual(output, true);
    });
    (0, node_test_1.test)('errors for nonexistent key', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-get nonexistent_key', tmpDir);
        node_assert_1.default.strictEqual(result.success, false);
        node_assert_1.default.ok(result.error.includes('Key not found'), `Expected "Key not found" in error: ${result.error}`);
    });
    (0, node_test_1.test)('errors for deeply nested nonexistent key', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-get workflow.nonexistent', tmpDir);
        node_assert_1.default.strictEqual(result.success, false);
        node_assert_1.default.ok(result.error.includes('Key not found'), `Expected "Key not found" in error: ${result.error}`);
    });
    (0, node_test_1.test)('errors when config.json does not exist', () => {
        const emptyTmpDir = (0, helpers_cjs_1.createTempProject)();
        try {
            const result = (0, helpers_cjs_1.runGsdTools)('config-get model_profile', emptyTmpDir);
            node_assert_1.default.strictEqual(result.success, false);
            node_assert_1.default.ok(result.error.includes('No config.json'), `Expected "No config.json" in error: ${result.error}`);
        }
        finally {
            (0, helpers_cjs_1.cleanup)(emptyTmpDir);
        }
    });
    (0, node_test_1.test)('errors when no key path provided', () => {
        const result = (0, helpers_cjs_1.runGsdTools)('config-get', tmpDir);
        node_assert_1.default.strictEqual(result.success, false);
    });
});
//# sourceMappingURL=config.test.cjs.map