<div align="center">

# Vector
**A meta-prompting and context engineering development system**

[![npm](https://img.shields.io/npm/v/@mobiman/vector)](https://www.npmjs.com/package/@mobiman/vector)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Discord](https://img.shields.io/discord/rkU8UTu7dY?label=Discord&logo=discord&logoColor=white)](https://discord.gg/rkU8UTu7dY)

---

## Getting Started

```bash
npx @mobiman/vector
```

<br>

![Vector Install](assets/terminal.svg)

Vector is designed for speed and automation. Run Claude Code with:

```bash
claude --dangerously-skip-permissions
```

## Already have a codebase?

> Run `/vector:map-codebase` first. It spawns parallel agents to analyze your stack, architecture, conventions, and concerns. Then `/vector:new-project` knows your codebase — questions focus on what you're adding, and planning automatically loads your patterns.

## New Project

```
/vector:new-project
```

## Orchestration

Every stage uses the same pattern: a thin orchestrator spawns specialized agents, collects results, and routes to the next step

| Stage | Orchestrator does | Agents do |
|-------|------------------|-----------|
| Research | Coordinates, presents findings | 4 parallel researchers investigate stack, features, architecture, pitfalls |
| Planning | Validates, manages iteration | Planner creates plans, checker verifies, loop until pass |
| Execution | Groups into waves, tracks progress | Executors implement in parallel, each with fresh 200k context |
| Verification | Presents results, routes next | Verifier checks codebase against goals, debuggers diagnose failures |

The orchestrator never does heavy lifting. It spawns agents, waits, integrates results.

**The result:** You can run an entire phase — deep research, multiple plans created and verified, thousands of lines of code written across parallel executors, automated verification against goals — and your main context window stays at 30-40%. The work happens in fresh subagent contexts. Your session stays fast and responsive.

## Commands

### Core Workflow

| Command | What it does |
|---------|--------------|
| `/vector:new-project [--auto]` | Full initialization: questions → research → requirements → roadmap |
| `/vector:discuss-phase [N] [--auto]` | Capture implementation decisions before planning |
| `/vector:plan-phase [N] [--auto]` | Research + plan + verify for a phase |
| `/vector:execute-phase <N>` | Execute all plans in parallel waves, verify when complete |
| `/vector:verify-work [N]` | Manual user acceptance testing ¹ |
| `/vector:audit-milestone` | Verify milestone achieved its definition of done |
| `/vector:complete-milestone` | Archive milestone, tag release |
| `/vector:new-milestone [name]` | Start next version: questions → research → requirements → roadmap |

### UI Design

| Command | What it does |
|---------|--------------|
| `/vector:ui-phase [N]` | Generate UI design contract (UI-SPEC.md) for frontend phases |
| `/vector:ui-review [N]` | Retroactive 6-pillar visual audit of implemented frontend code |

### Navigation

| Command | What it does |
|---------|--------------|
| `/vector:progress` | Where am I? What's next? |
| `/vector:help` | Show all commands and usage guide |
| `/vector:update` | Update Vector with changelog preview |
| `/vector:join-discord` | Join the Vector Discord community |

### Brownfield

| Command | What it does |
|---------|--------------|
| `/vector:map-codebase [area]` | Analyze existing codebase before new-project |

### Phase Management

| Command | What it does |
|---------|--------------|
| `/vector:add-phase` | Append phase to roadmap |
| `/vector:insert-phase [N]` | Insert urgent work between phases |
| `/vector:remove-phase [N]` | Remove future phase, renumber |
| `/vector:list-phase-assumptions [N]` | See Claude's intended approach before planning |
| `/vector:plan-milestone-gaps` | Create phases to close gaps from audit |

### Session

| Command | What it does |
|---------|--------------|
| `/vector:pause-work` | Create handoff when stopping mid-phase |
| `/vector:resume-work` | Restore from last session |

### Utilities

| Command | What it does |
|---------|--------------|
| `/vector:settings` | Configure model profile and workflow agents |
| `/vector:set-profile <profile>` | Switch model profile (quality/balanced/budget/inherit) |
| `/vector:add-todo [desc]` | Capture idea for later |
| `/vector:check-todos` | List pending todos |
| `/vector:debug [desc]` | Systematic debugging with persistent state |
| `/vector:quick [--full] [--discuss] [--research]` | Execute ad-hoc task with Vector guarantees (`--full` adds plan-checking and verification, `--discuss` gathers context first, `--research` investigates approaches before planning) |
| `/vector:health [--repair]` | Validate `.planning/` directory integrity, auto-repair with `--repair` |
| `/vector:stats` | Display project statistics — phases, plans, requirements, git metrics |

## Community

- [Discord](https://discord.gg/rkU8UTu7dY) — get help, share what you're building, give feedback
- [Issues](https://github.com/mobiman1/vector/issues) — bug reports and feature requests

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on submitting bug reports, feature requests, and pull requests.

## License

MIT — see [LICENSE](LICENSE) for details.
