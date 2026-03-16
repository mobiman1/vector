/**
 * Mapping of Vector agent to model for each profile.
 *
 * Should be in sync with the profiles table in `core/references/model-profiles.md`. But
 * possibly worth making this the single source of truth at some point, and removing the markdown
 * reference table in favor of programmatically determining the model to use for an agent (which
 * would be faster, use fewer tokens, and be less error-prone).
 */

type ModelTier = 'opus' | 'sonnet' | 'haiku';
type ProfileMap = { quality: ModelTier; balanced: ModelTier; budget: ModelTier };
type ModelProfiles = Record<string, ProfileMap>;

export const MODEL_PROFILES: ModelProfiles = {
  'vector-planner': { quality: 'opus', balanced: 'opus', budget: 'sonnet' },
  'vector-roadmapper': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
  'vector-executor': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
  'vector-phase-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
  'vector-project-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
  'vector-research-synthesizer': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'vector-debugger': { quality: 'opus', balanced: 'sonnet', budget: 'sonnet' },
  'vector-codebase-mapper': { quality: 'sonnet', balanced: 'haiku', budget: 'haiku' },
  'vector-verifier': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'vector-plan-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'vector-integration-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'vector-nyquist-auditor': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'vector-ui-researcher': { quality: 'opus', balanced: 'sonnet', budget: 'haiku' },
  'vector-ui-checker': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
  'vector-ui-auditor': { quality: 'sonnet', balanced: 'sonnet', budget: 'haiku' },
};
export const VALID_PROFILES: string[] = Object.keys(MODEL_PROFILES['vector-planner']);

/**
 * Formats the agent-to-model mapping as a human-readable table (in string format).
 *
 * @param agentToModelMap - A mapping from agent to model
 * @returns A formatted table string
 */
export function formatAgentToModelMapAsTable(agentToModelMap: Record<string, string>): string {
  const agentWidth = Math.max('Agent'.length, ...Object.keys(agentToModelMap).map((a) => a.length));
  const modelWidth = Math.max(
    'Model'.length,
    ...Object.values(agentToModelMap).map((m) => m.length)
  );
  const sep = '─'.repeat(agentWidth + 2) + '┼' + '─'.repeat(modelWidth + 2);
  const header = ' ' + 'Agent'.padEnd(agentWidth) + ' │ ' + 'Model'.padEnd(modelWidth);
  let agentToModelTable = header + '\n' + sep + '\n';
  for (const [agent, model] of Object.entries(agentToModelMap)) {
    agentToModelTable += ' ' + agent.padEnd(agentWidth) + ' │ ' + model.padEnd(modelWidth) + '\n';
  }
  return agentToModelTable;
}

/**
 * Returns a mapping from agent to model for the given model profile.
 *
 * @param normalizedProfile - The normalized (lowercase and trimmed) profile name
 * @returns A mapping from agent to model for the given profile
 */
export function getAgentToModelMapForProfile(normalizedProfile: string): Record<string, string> {
  const agentToModelMap: Record<string, string> = {};
  for (const [agent, profileToModelMap] of Object.entries(MODEL_PROFILES)) {
    agentToModelMap[agent] = (profileToModelMap as Record<string, string>)[normalizedProfile];
  }
  return agentToModelMap;
}
