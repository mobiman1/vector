# Contributing to Vector

Thanks for your interest in contributing! Vector is a meta-prompting and context engineering system built on top of Claude Code.

## Ways to Contribute

- **Bug reports** — use the [bug report template](.github/ISSUE_TEMPLATE/bug_report.yml)
- **Feature requests** — use the [feature request template](.github/ISSUE_TEMPLATE/feature_request.yml)
- **Pull requests** — fixes, improvements, and new commands
- **Community** — help others in [Discord](https://discord.gg/rkU8UTu7dY)

## Before You Start

For anything beyond a small bug fix, open an issue first to discuss the approach. This avoids wasted effort if the direction doesn't fit the project.

## Development Setup

```bash
git clone https://github.com/mobiman1/vector
cd vector
npm install
```

Run tests:

```bash
npm test
```

## Pull Request Guidelines

- One thing per PR — keep scope tight
- Update `CHANGELOG.md` for any user-facing changes
- Follow existing code style — no enterprise patterns, no unnecessary abstractions
- Test on macOS at minimum; Windows and Linux welcome
- Fill out the PR template

## Code Style

- No filler code or speculative abstractions
- No docstrings on code you didn't change
- Trust framework guarantees — don't add redundant validation
- Three similar lines of code is better than a premature abstraction

## Commit Messages

Follow conventional commits:

```
feat: add new command
fix: correct phase numbering on insert
docs: update README install instructions
chore: bump dependency versions
```

## Community

Join the [Mobiman Discord](https://discord.gg/rkU8UTu7dY) — `#help` for questions, `#feedback` for ideas.
