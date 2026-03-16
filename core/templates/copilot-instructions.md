# Instructions for Vector

- Use the core skill when the user asks for Vector or uses a `vector-*` command.
- Treat `/vector-... or vector-...` as command invocations and load the matching file from `.github/skills/vector-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply Vector workflows unless the user explicitly asks for them.
- After completing any `vector-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.
