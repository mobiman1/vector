/**
 * State — STATE.md operations and progression engine
 */
export declare function stateExtractField(content: string, fieldName: string): string | null;
export declare function cmdStateLoad(cwd: string, raw: boolean): void;
export declare function cmdStateGet(cwd: string, section: string | undefined, raw: boolean): void;
export declare function cmdStatePatch(cwd: string, patches: Record<string, string>, raw: boolean): void;
export declare function cmdStateUpdate(cwd: string, field: string | undefined, value: string | undefined): void;
export declare function stateReplaceField(content: string, fieldName: string, newValue: string): string | null;
export declare function cmdStateAdvancePlan(cwd: string, raw: boolean): void;
interface RecordMetricOptions {
    phase: string | null;
    plan: string | null;
    duration: string | null;
    tasks?: string | null;
    files?: string | null;
}
export declare function cmdStateRecordMetric(cwd: string, options: RecordMetricOptions, raw: boolean): void;
export declare function cmdStateUpdateProgress(cwd: string, raw: boolean): void;
interface AddDecisionOptions {
    phase?: string | null;
    summary?: string | null;
    summary_file?: string | null;
    rationale?: string | null;
    rationale_file?: string | null;
}
export declare function cmdStateAddDecision(cwd: string, options: AddDecisionOptions, raw: boolean): void;
interface AddBlockerOptions {
    text?: string | null;
    text_file?: string | null;
}
export declare function cmdStateAddBlocker(cwd: string, text: string | AddBlockerOptions, raw: boolean): void;
export declare function cmdStateResolveBlocker(cwd: string, text: string | null | undefined, raw: boolean): void;
interface RecordSessionOptions {
    stopped_at?: string | null;
    resume_file?: string | null;
}
export declare function cmdStateRecordSession(cwd: string, options: RecordSessionOptions, raw: boolean): void;
export declare function cmdStateSnapshot(cwd: string, raw: boolean): void;
/**
 * Write STATE.md with synchronized YAML frontmatter.
 * All STATE.md writes should use this instead of raw writeFileSync.
 */
export declare function writeStateMd(statePath: string, content: string, cwd: string): void;
export declare function cmdStateJson(cwd: string, raw: boolean): void;
export {};
//# sourceMappingURL=state.d.cts.map