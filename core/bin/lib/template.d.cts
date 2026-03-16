/**
 * Template — Template selection and fill operations
 */
export declare function cmdTemplateSelect(cwd: string, planPath: string | undefined, raw: boolean): void;
interface TemplateFillOptions {
    phase: string | null;
    plan?: string | null;
    name?: string | null;
    type?: string | null;
    wave?: string | null;
    fields?: Record<string, unknown>;
}
export declare function cmdTemplateFill(cwd: string, templateType: string | undefined, options: TemplateFillOptions, raw: boolean): void;
export {};
//# sourceMappingURL=template.d.cts.map