/**
 * Phase — Phase CRUD, query, and lifecycle operations
 */
interface PhasesListOptions {
    type?: string | null;
    phase?: string | null;
    includeArchived?: boolean;
}
export declare function cmdPhasesList(cwd: string, options: PhasesListOptions, raw: boolean): void;
export declare function cmdPhaseNextDecimal(cwd: string, basePhase: string, raw: boolean): void;
export declare function cmdFindPhase(cwd: string, phase: string | undefined, raw: boolean): void;
export declare function cmdPhasePlanIndex(cwd: string, phase: string | undefined, raw: boolean): void;
export declare function cmdPhaseAdd(cwd: string, description: string, raw: boolean): void;
export declare function cmdPhaseInsert(cwd: string, afterPhase: string, description: string, raw: boolean): void;
interface PhaseRemoveOptions {
    force?: boolean;
}
export declare function cmdPhaseRemove(cwd: string, targetPhase: string | undefined, options: PhaseRemoveOptions, raw: boolean): void;
export declare function cmdPhaseComplete(cwd: string, phaseNum: string | undefined, raw: boolean): void;
export {};
//# sourceMappingURL=phase.d.cts.map