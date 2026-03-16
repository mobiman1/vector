/**
 * OpenCode Agent Frontmatter Conversion Tests
 *
 * Validates that convertClaudeToOpencodeFrontmatter correctly converts
 * agent frontmatter for OpenCode compatibility when isAgent: true.
 *
 * Bug: Without isAgent flag, the function strips name: (agents need it),
 * keeps color:/skills:/tools: record (should strip), and doesn't add
 * model: inherit / mode: subagent (required by OpenCode agents).
 */
export {};
//# sourceMappingURL=opencode-agent-conversion.test.d.cts.map