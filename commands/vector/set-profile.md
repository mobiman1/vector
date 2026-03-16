---
name: vector:set-profile
description: Switch model profile for Vector agents (quality/balanced/budget/inherit)
argument-hint: <profile (quality|balanced|budget|inherit)>
model: haiku
allowed-tools:
  - Bash
---

Show the following output to the user verbatim, with no extra commentary:

!`node "$HOME/.claude/core/bin/vector-tools.cjs" config-set-model-profile $ARGUMENTS --raw`
