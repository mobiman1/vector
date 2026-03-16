/**
 * Verify — Verification suite, consistency, and health validation
 */
export declare function cmdVerifySummary(cwd: string, summaryPath: string | undefined, checkFileCount: number | undefined, raw: boolean): void;
export declare function cmdVerifyPlanStructure(cwd: string, filePath: string | undefined, raw: boolean): void;
export declare function cmdVerifyPhaseCompleteness(cwd: string, phase: string | undefined, raw: boolean): void;
export declare function cmdVerifyReferences(cwd: string, filePath: string | undefined, raw: boolean): void;
export declare function cmdVerifyCommits(cwd: string, hashes: string[], raw: boolean): void;
export declare function cmdVerifyArtifacts(cwd: string, planFilePath: string | undefined, raw: boolean): void;
export declare function cmdVerifyKeyLinks(cwd: string, planFilePath: string | undefined, raw: boolean): void;
export declare function cmdValidateConsistency(cwd: string, raw: boolean): void;
interface HealthOptions {
    repair?: boolean;
}
export declare function cmdValidateHealth(cwd: string, options: HealthOptions, raw: boolean): void;
export {};
//# sourceMappingURL=verify.d.cts.map