"use strict";
/**
 * Config — Planning config CRUD operations
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureConfigFile = ensureConfigFile;
exports.cmdConfigEnsureSection = cmdConfigEnsureSection;
exports.setConfigValue = setConfigValue;
exports.cmdConfigSet = cmdConfigSet;
exports.cmdConfigGet = cmdConfigGet;
exports.cmdConfigSetModelProfile = cmdConfigSetModelProfile;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const core_cjs_1 = require("./core.cjs");
const model_profiles_cjs_1 = require("./model-profiles.cjs");
const VALID_CONFIG_KEYS = new Set([
    'mode', 'granularity', 'parallelization', 'commit_docs', 'model_profile',
    'search_gitignored', 'brave_search',
    'workflow.research', 'workflow.plan_check', 'workflow.verifier',
    'workflow.nyquist_validation', 'workflow.ui_phase', 'workflow.ui_safety_gate',
    'workflow._auto_chain_active',
    'git.branching_strategy', 'git.phase_branch_template', 'git.milestone_branch_template',
    'planning.commit_docs', 'planning.search_gitignored',
]);
const CONFIG_KEY_SUGGESTIONS = {
    'workflow.nyquist_validation_enabled': 'workflow.nyquist_validation',
    'agents.nyquist_validation_enabled': 'workflow.nyquist_validation',
    'nyquist.validation_enabled': 'workflow.nyquist_validation',
};
function validateKnownConfigKeyPath(keyPath) {
    const suggested = CONFIG_KEY_SUGGESTIONS[keyPath];
    if (suggested) {
        (0, core_cjs_1.error)(`Unknown config key: ${keyPath}. Did you mean ${suggested}?`);
    }
}
/**
 * Ensures the config file exists (creates it if needed).
 *
 * Does not call `output()`, so can be used as one step in a command without triggering `exit(0)` in
 * the happy path. But note that `error()` will still `exit(1)` out of the process.
 */
function ensureConfigFile(cwd) {
    const configPath = path_1.default.join(cwd, '.planning', 'config.json');
    const planningDir = path_1.default.join(cwd, '.planning');
    // Ensure .planning directory exists
    try {
        if (!fs_1.default.existsSync(planningDir)) {
            fs_1.default.mkdirSync(planningDir, { recursive: true });
        }
    }
    catch (err) {
        (0, core_cjs_1.error)('Failed to create .planning directory: ' + err.message);
    }
    // Check if config already exists
    if (fs_1.default.existsSync(configPath)) {
        return { created: false, reason: 'already_exists' };
    }
    // Detect Brave Search API key availability
    const homedir = os_1.default.homedir();
    const braveKeyFile = path_1.default.join(homedir, '.vector', 'brave_api_key');
    const hasBraveSearch = !!(process.env.BRAVE_API_KEY || fs_1.default.existsSync(braveKeyFile));
    // Load user-level defaults from ~/.vector/defaults.json if available
    const globalDefaultsPath = path_1.default.join(homedir, '.vector', 'defaults.json');
    let userDefaults = {};
    try {
        if (fs_1.default.existsSync(globalDefaultsPath)) {
            userDefaults = JSON.parse(fs_1.default.readFileSync(globalDefaultsPath, 'utf-8'));
            // Migrate deprecated "depth" key to "granularity"
            if ('depth' in userDefaults && !('granularity' in userDefaults)) {
                const depthToGranularity = { quick: 'coarse', standard: 'standard', comprehensive: 'fine' };
                userDefaults.granularity = depthToGranularity[userDefaults.depth] || userDefaults.depth;
                delete userDefaults.depth;
                try {
                    fs_1.default.writeFileSync(globalDefaultsPath, JSON.stringify(userDefaults, null, 2), 'utf-8');
                }
                catch { }
            }
        }
    }
    catch (_err) {
        // Ignore malformed global defaults, fall back to hardcoded
    }
    // Create default config (user-level defaults override hardcoded defaults)
    const hardcoded = {
        model_profile: 'balanced',
        commit_docs: true,
        search_gitignored: false,
        branching_strategy: 'none',
        phase_branch_template: 'vector/phase-{phase}-{slug}',
        milestone_branch_template: 'vector/{milestone}-{slug}',
        workflow: {
            research: true,
            plan_check: true,
            verifier: true,
            nyquist_validation: true,
        },
        parallelization: true,
        brave_search: hasBraveSearch,
    };
    const defaults = {
        ...hardcoded,
        ...userDefaults,
        workflow: { ...hardcoded.workflow, ...(userDefaults.workflow || {}) },
    };
    try {
        fs_1.default.writeFileSync(configPath, JSON.stringify(defaults, null, 2), 'utf-8');
        return { created: true, path: '.planning/config.json' };
    }
    catch (err) {
        (0, core_cjs_1.error)('Failed to create config.json: ' + err.message);
    }
}
/**
 * Command to ensure the config file exists (creates it if needed).
 *
 * Note that this exits the process (via `output()`) even in the happy path; use
 * `ensureConfigFile()` directly if you need to avoid this.
 */
function cmdConfigEnsureSection(cwd, raw) {
    const ensureConfigFileResult = ensureConfigFile(cwd);
    if (ensureConfigFileResult.created) {
        (0, core_cjs_1.output)(ensureConfigFileResult, raw, 'created');
    }
    else {
        (0, core_cjs_1.output)(ensureConfigFileResult, raw, 'exists');
    }
}
/**
 * Sets a value in the config file, allowing nested values via dot notation (e.g.,
 * "workflow.research").
 *
 * Does not call `output()`, so can be used as one step in a command without triggering `exit(0)` in
 * the happy path. But note that `error()` will still `exit(1)` out of the process.
 */
function setConfigValue(cwd, keyPath, parsedValue) {
    const configPath = path_1.default.join(cwd, '.planning', 'config.json');
    // Load existing config or start with empty object
    let config = {};
    try {
        if (fs_1.default.existsSync(configPath)) {
            config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
        }
    }
    catch (err) {
        (0, core_cjs_1.error)('Failed to read config.json: ' + err.message);
    }
    // Set nested value using dot notation (e.g., "workflow.research")
    const keys = keyPath.split('.');
    let current = config;
    for (let i = 0; i < keys.length - 1; i++) {
        const key = keys[i];
        if (current[key] === undefined || typeof current[key] !== 'object') {
            current[key] = {};
        }
        current = current[key];
    }
    const previousValue = current[keys[keys.length - 1]]; // Capture previous value before overwriting
    current[keys[keys.length - 1]] = parsedValue;
    // Write back
    try {
        fs_1.default.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
        return { updated: true, key: keyPath, value: parsedValue, previousValue };
    }
    catch (err) {
        (0, core_cjs_1.error)('Failed to write config.json: ' + err.message);
    }
}
/**
 * Command to set a value in the config file, allowing nested values via dot notation (e.g.,
 * "workflow.research").
 *
 * Note that this exits the process (via `output()`) even in the happy path; use `setConfigValue()`
 * directly if you need to avoid this.
 */
function cmdConfigSet(cwd, keyPath, value, raw) {
    if (!keyPath) {
        (0, core_cjs_1.error)('Usage: config-set <key.path> <value>');
    }
    validateKnownConfigKeyPath(keyPath);
    if (!VALID_CONFIG_KEYS.has(keyPath)) {
        (0, core_cjs_1.error)(`Unknown config key: "${keyPath}". Valid keys: ${[...VALID_CONFIG_KEYS].sort().join(', ')}`);
    }
    // Parse value (handle booleans and numbers)
    let parsedValue = value;
    if (value === 'true')
        parsedValue = true;
    else if (value === 'false')
        parsedValue = false;
    else if (value !== undefined && !isNaN(Number(value)) && value !== '')
        parsedValue = Number(value);
    const setConfigValueResult = setConfigValue(cwd, keyPath, parsedValue);
    (0, core_cjs_1.output)(setConfigValueResult, raw, `${keyPath}=${parsedValue}`);
}
function cmdConfigGet(cwd, keyPath, raw) {
    const configPath = path_1.default.join(cwd, '.planning', 'config.json');
    if (!keyPath) {
        (0, core_cjs_1.error)('Usage: config-get <key.path>');
    }
    let config = {};
    try {
        if (fs_1.default.existsSync(configPath)) {
            config = JSON.parse(fs_1.default.readFileSync(configPath, 'utf-8'));
        }
        else {
            (0, core_cjs_1.error)('No config.json found at ' + configPath);
        }
    }
    catch (err) {
        if (err.message.startsWith('No config.json'))
            throw err;
        (0, core_cjs_1.error)('Failed to read config.json: ' + err.message);
    }
    // Traverse dot-notation path (e.g., "workflow.auto_advance")
    const keys = keyPath.split('.');
    let current = config;
    for (const key of keys) {
        if (current === undefined || current === null || typeof current !== 'object') {
            (0, core_cjs_1.error)(`Key not found: ${keyPath}`);
        }
        current = current[key];
    }
    if (current === undefined) {
        (0, core_cjs_1.error)(`Key not found: ${keyPath}`);
    }
    (0, core_cjs_1.output)(current, raw, String(current));
}
/**
 * Command to set the model profile in the config file.
 *
 * Note that this exits the process (via `output()`) even in the happy path.
 */
function cmdConfigSetModelProfile(cwd, profile, raw) {
    if (!profile) {
        (0, core_cjs_1.error)(`Usage: config-set-model-profile <${model_profiles_cjs_1.VALID_PROFILES.join('|')}>`);
    }
    const normalizedProfile = profile.toLowerCase().trim();
    if (!model_profiles_cjs_1.VALID_PROFILES.includes(normalizedProfile)) {
        (0, core_cjs_1.error)(`Invalid profile '${profile}'. Valid profiles: ${model_profiles_cjs_1.VALID_PROFILES.join(', ')}`);
    }
    // Ensure config exists (create if needed)
    ensureConfigFile(cwd);
    // Set the model profile in the config
    const { previousValue } = setConfigValue(cwd, 'model_profile', normalizedProfile);
    const previousProfile = previousValue || 'balanced';
    // Build result value / message and return
    const agentToModelMap = (0, model_profiles_cjs_1.getAgentToModelMapForProfile)(normalizedProfile);
    const result = {
        updated: true,
        profile: normalizedProfile,
        previousProfile,
        agentToModelMap,
    };
    const rawValue = getCmdConfigSetModelProfileResultMessage(normalizedProfile, previousProfile, agentToModelMap);
    (0, core_cjs_1.output)(result, raw, rawValue);
}
/**
 * Returns the message to display for the result of the `config-set-model-profile` command when
 * displaying raw output.
 */
function getCmdConfigSetModelProfileResultMessage(normalizedProfile, previousProfile, agentToModelMap) {
    const agentToModelTable = (0, model_profiles_cjs_1.formatAgentToModelMapAsTable)(agentToModelMap);
    const didChange = previousProfile !== normalizedProfile;
    const paragraphs = didChange
        ? [
            `✓ Model profile set to: ${normalizedProfile} (was: ${previousProfile})`,
            'Agents will now use:',
            agentToModelTable,
            'Next spawned agents will use the new profile.',
        ]
        : [
            `✓ Model profile is already set to: ${normalizedProfile}`,
            'Agents are using:',
            agentToModelTable,
        ];
    return paragraphs.join('\n\n');
}
//# sourceMappingURL=config.cjs.map