/**
 * Milestone — Milestone and requirements lifecycle operations
 */
export declare function cmdRequirementsMarkComplete(cwd: string, reqIdsRaw: string[], raw: boolean): void;
interface MilestoneCompleteOptions {
    name?: string;
    archivePhases?: boolean;
}
export declare function cmdMilestoneComplete(cwd: string, version: string | undefined, options: MilestoneCompleteOptions, raw: boolean): void;
export {};
//# sourceMappingURL=milestone.d.cts.map