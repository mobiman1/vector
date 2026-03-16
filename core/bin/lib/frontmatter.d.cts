/**
 * Frontmatter — YAML frontmatter parsing, serialization, and CRUD commands
 */
type FrontmatterValue = string | string[] | Record<string, unknown> | boolean | number | null;
type FrontmatterObject = Record<string, FrontmatterValue>;
export declare function extractFrontmatter(content: string): FrontmatterObject;
export declare function reconstructFrontmatter(obj: Record<string, unknown>): string;
export declare function spliceFrontmatter(content: string, newObj: Record<string, unknown>): string;
export declare function parseMustHavesBlock(content: string, blockName: string): unknown[];
export declare const FRONTMATTER_SCHEMAS: Record<string, {
    required: string[];
}>;
export declare function cmdFrontmatterGet(cwd: string, filePath: string | null, field: string | null, raw: boolean): void;
export declare function cmdFrontmatterSet(cwd: string, filePath: string | null, field: string | null, value: string | undefined, raw: boolean): void;
export declare function cmdFrontmatterMerge(cwd: string, filePath: string | null, data: string | null, raw: boolean): void;
export declare function cmdFrontmatterValidate(cwd: string, filePath: string | null, schemaName: string | null, raw: boolean): void;
export {};
//# sourceMappingURL=frontmatter.d.cts.map