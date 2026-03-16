/**
 * Vector Tools Test Helpers
 */
export declare const TOOLS_PATH: string;
/**
 * Run vector-tools command.
 *
 * @param args - Command string (shell-interpreted) or array
 *   of arguments (shell-bypassed via execFileSync, safe for JSON and dollar signs).
 * @param cwd - Working directory.
 */
export declare function runGsdTools(args: string | string[], cwd?: string): {
    success: boolean;
    output: string;
    error?: undefined;
} | {
    success: boolean;
    output: string;
    error: string;
};
export declare const runVectorTools: typeof runGsdTools;
export declare function createTempProject(): string;
export declare function createTempGitProject(): string;
export declare function cleanup(tmpDir: string): void;
//# sourceMappingURL=helpers.d.cts.map