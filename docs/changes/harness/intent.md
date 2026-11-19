# Developer and CI quality-gates intent

## Problem

The repository has comprehensive project checks but does not automatically run
a fast staged-file validation before commits or quick checks when a Copilot
coding-agent turn ends. The repository also needs push-time CI that catches
secrets before installing the rest of the toolchain and runs the full checks.
Agent tools also need an explicit guard against modifying `.env`.

## Goal

Add three safeguards:

- A Lefthook pre-commit hook that formats staged files and runs lint, type
  checks, and Gitleaks without running tests.
- A Copilot `agentStop` hook that runs `npm run check:quick`, returns failures
  to the agent for correction, and allows the next stop attempt so it cannot
  block indefinitely.
- A Copilot `preToolUse` hook that denies tool calls targeting `.env`.
- A GitHub Actions workflow for every branch push that scans the repository
  with Gitleaks first, then installs Java, Node, and uv and runs
  `npm run check`. CI uses the runner's installed Google Chrome and uploads the
  Playwright report if the job fails.

## Constraints

- Keep the existing app stack and quality-check rules unchanged.
- Hook scripts must be cross-platform in the supported Windows and Unix shells.
- Never include `.env` contents in hook output.
- Keep pre-commit checks test-free and scoped to staged formatting.
- Pin `astral-sh/setup-uv` to its full release tag and install the latest uv.
- Do not add workflow secrets.

## Success criteria

- Lefthook is installed by the project package lifecycle and runs its pre-commit
  checks.
- Copilot hook config uses supported `agentStop` and `preToolUse` events.
- A failed end-of-turn check blocks once with useful failure output; a
  subsequent stop with `stop_hook_active` is allowed.
- `.env` edit requests are denied, while unrelated files are unaffected.
- Every branch push runs CI, with Gitleaks first and the full check suite after
  tool setup; failed runs retain any available Playwright report.
- Each hook is exercised with a test that demonstrates its behavior.
