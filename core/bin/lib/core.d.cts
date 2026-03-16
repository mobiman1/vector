/**
 * Core — Shared utilities, constants, and internal helpers
 */
export interface PhaseFilter {
    (dirName: string): boolean;
    phaseCount: number;
}
export interface VectorConfig {
    model_profile: string;
    commit_docs: boolean;
    search_gitignored: boolean;
    branching_strategy: string;
    phase_branch_template: string;
    milestone_branch_template: string;
    research: boolean;
    plan_checker: boolean;
    verifier: boolean;
    nyquist_validation: boolean;
    parallelization: boolean;
    brave_search: boolean;
    model_overrides: Record<string, string> | null;
}
/** Normalize a relative path to always use forward slashes (cross-platform). */
export declare function toPosixPath(p: string): string;
export declare function output(result: unknown, raw?: boolean, rawValue?: unknown): void;
export declare function error(message: string): never;
export declare function safeReadFile(filePath: string): string | null;
export declare function loadConfig(cwd: string): VectorConfig;
export declare function isGitIgnored(cwd: string, targetPath: string): boolean;
export declare function execGit(cwd: string, args: string[]): {
    exitCode: number;
    stdout: string;
    stderr: string;
};
export declare function escapeRegex(value: unknown): string;
export declare function normalizePhaseName(phase: unknown): string;
export declare function comparePhaseNum(a: unknown, b: unknown): number;
export interface PhaseInfo {
    found: boolean;
    directory: string | null;
    phase_number: string;
    phase_name: string | null;
    phase_slug: string | null;
    plans: string[];
    summaries: string[];
    incomplete_plans: string[];
    has_research: boolean;
    has_context: boolean;
    has_verification: boolean;
    archived?: string;
}
export declare function searchPhaseInDir(baseDir: string, relBase: string, normalized: string): PhaseInfo | null;
export declare function findPhaseInternal(cwd: string, phase: unknown): PhaseInfo | null;
export interface ArchivedPhaseDir {
    name: string;
    milestone: string;
    basePath: string;
    fullPath: string;
}
export declare function getArchivedPhaseDirs(cwd: string): ArchivedPhaseDir[];
/**
 * Strip shipped milestone content wrapped in <details> blocks.
 * Used to isolate current milestone phases when searching ROADMAP.md
 * for phase headings or checkboxes — prevents matching archived milestone
 * phases that share the same numbers as current milestone phases.
 */
export declare function stripShippedMilestones(content: string): string;
/**
 * Replace a pattern only in the current milestone section of ROADMAP.md
 * (everything after the last </details> close tag). Used for write operations
 * that must not accidentally modify archived milestone checkboxes/tables.
 */
export declare function replaceInCurrentMilestone(content: string, pattern: RegExp, replacement: string): string;
export interface RoadmapPhaseInfo {
    found: boolean;
    phase_number: string;
    phase_name: string;
    goal: string | null;
    section: string;
}
export declare function getRoadmapPhaseInternal(cwd: string, phaseNum: unknown): RoadmapPhaseInfo | null;
export declare function resolveModelInternal(cwd: string, agentType: string): string;
export declare function pathExistsInternal(cwd: string, targetPath: string): boolean;
export declare function generateSlugInternal(text: unknown): string | null;
export interface MilestoneInfo {
    version: string;
    name: string;
}
export declare function getMilestoneInfo(cwd: string): MilestoneInfo;
/**
 * Returns a filter function that checks whether a phase directory belongs
 * to the current milestone based on ROADMAP.md phase headings.
 * If no ROADMAP exists or no phases are listed, returns a pass-all filter.
 */
export declare function getMilestonePhaseFilter(cwd: string): PhaseFilter;
//# sourceMappingURL=core.d.cts.map