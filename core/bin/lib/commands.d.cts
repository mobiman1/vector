export declare function cmdGenerateSlug(text: string | undefined, raw: boolean): void;
export declare function cmdCurrentTimestamp(format: string | undefined, raw: boolean): void;
export declare function cmdListTodos(cwd: string, area: string | undefined, raw: boolean): void;
export declare function cmdVerifyPathExists(cwd: string, targetPath: string | undefined, raw: boolean): void;
export declare function cmdHistoryDigest(cwd: string, raw: boolean): void;
export declare function cmdResolveModel(cwd: string, agentType: string | undefined, raw: boolean): void;
export declare function cmdCommit(cwd: string, message: string | undefined, files: string[] | undefined, raw: boolean, amend: boolean | undefined): void;
export declare function cmdSummaryExtract(cwd: string, summaryPath: string | undefined, fields: string[] | undefined, raw: boolean): void;
interface WebsearchOptions {
    limit?: number;
    freshness?: string;
}
export declare function cmdWebsearch(query: string | undefined, options: WebsearchOptions, raw: boolean): Promise<void>;
export declare function cmdProgressRender(cwd: string, format: string | undefined, raw: boolean): void;
export declare function cmdTodoComplete(cwd: string, filename: string | undefined, raw: boolean): void;
interface ScaffoldOptions {
    phase?: string;
    name?: string;
}
export declare function cmdScaffold(cwd: string, type: string, options: ScaffoldOptions, raw: boolean): void;
export declare function cmdStats(cwd: string, format: string | undefined, raw: boolean): void;
export {};
//# sourceMappingURL=commands.d.cts.map