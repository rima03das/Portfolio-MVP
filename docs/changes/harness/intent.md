# Hook workflow intent

## Problem

The repository has comprehensive project checks but does not automatically run
a fast staged-file validation before commits or quick checks when a Copilot
coding-agent turn ends. Agent tools also need an explicit guard against
modifying `.env`.

## Goal

Add three safeguards:

- A Lefthook pre-commit hook that formats staged files and runs lint, type
  checks, and Gitleaks without running tests.
- A Copilot `agentStop` hook that runs `npm run check:quick`, returns failures
  to the agent for correction, and allows the next stop attempt so it cannot
  block indefinitely.
- A Copilot `preToolUse` hook that denies tool calls targeting `.env`.

## Constraints

- Keep the existing app stack and quality-check rules unchanged.
- Hook scripts must be cross-platform in the supported Windows and Unix shells.
- Never include `.env` contents in hook output.
- Keep pre-commit checks test-free and scoped to staged formatting.

## Success criteria

- Lefthook is installed by the project package lifecycle and runs its pre-commit
  checks.
- Copilot hook config uses supported `agentStop` and `preToolUse` events.
- A failed end-of-turn check blocks once with useful failure output; a
  subsequent stop with `stop_hook_active` is allowed.
- `.env` edit requests are denied, while unrelated files are unaffected.
- Each hook is exercised with a test that demonstrates its behavior.
