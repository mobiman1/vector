/**
 * Mapping of Vector agent to model for each profile.
 *
 * Should be in sync with the profiles table in `core/references/model-profiles.md`. But
 * possibly worth making this the single source of truth at some point, and removing the markdown
 * reference table in favor of programmatically determining the model to use for an agent (which
 * would be faster, use fewer tokens, and be less error-prone).
 */
type ModelTier = 'opus' | 'sonnet' | 'haiku';
type ProfileMap = {
    quality: ModelTier;
    balanced: ModelTier;
    budget: ModelTier;
};
type ModelProfiles = Record<string, ProfileMap>;
export declare const MODEL_PROFILES: ModelProfiles;
export declare const VALID_PROFILES: string[];
/**
 * Formats the agent-to-model mapping as a human-readable table (in string format).
 *
 * @param agentToModelMap - A mapping from agent to model
 * @returns A formatted table string
 */
export declare function formatAgentToModelMapAsTable(agentToModelMap: Record<string, string>): string;
/**
 * Returns a mapping from agent to model for the given model profile.
 *
 * @param normalizedProfile - The normalized (lowercase and trimmed) profile name
 * @returns A mapping from agent to model for the given profile
 */
export declare function getAgentToModelMapForProfile(normalizedProfile: string): Record<string, string>;
export {};
//# sourceMappingURL=model-profiles.d.cts.map