/**
 * Config — Planning config CRUD operations
 */
/**
 * Ensures the config file exists (creates it if needed).
 *
 * Does not call `output()`, so can be used as one step in a command without triggering `exit(0)` in
 * the happy path. But note that `error()` will still `exit(1)` out of the process.
 */
export declare function ensureConfigFile(cwd: string): {
    created: boolean;
    reason?: string;
    path?: string;
};
/**
 * Command to ensure the config file exists (creates it if needed).
 *
 * Note that this exits the process (via `output()`) even in the happy path; use
 * `ensureConfigFile()` directly if you need to avoid this.
 */
export declare function cmdConfigEnsureSection(cwd: string, raw: boolean): void;
/**
 * Sets a value in the config file, allowing nested values via dot notation (e.g.,
 * "workflow.research").
 *
 * Does not call `output()`, so can be used as one step in a command without triggering `exit(0)` in
 * the happy path. But note that `error()` will still `exit(1)` out of the process.
 */
export declare function setConfigValue(cwd: string, keyPath: string, parsedValue: unknown): {
    updated: boolean;
    key: string;
    value: unknown;
    previousValue: unknown;
};
/**
 * Command to set a value in the config file, allowing nested values via dot notation (e.g.,
 * "workflow.research").
 *
 * Note that this exits the process (via `output()`) even in the happy path; use `setConfigValue()`
 * directly if you need to avoid this.
 */
export declare function cmdConfigSet(cwd: string, keyPath: string | undefined, value: string | undefined, raw: boolean): void;
export declare function cmdConfigGet(cwd: string, keyPath: string | undefined, raw: boolean): void;
/**
 * Command to set the model profile in the config file.
 *
 * Note that this exits the process (via `output()`) even in the happy path.
 */
export declare function cmdConfigSetModelProfile(cwd: string, profile: string | undefined, raw: boolean): void;
//# sourceMappingURL=config.d.cts.map