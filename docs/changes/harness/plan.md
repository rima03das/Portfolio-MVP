# Hook workflow plan

## Files that change

- Root `package.json` and lockfile, plus `.lefthook.yml`, to install Lefthook
  and register the pre-commit hook.
- `scripts/precommit.mjs` to format staged files, run lint/type/compile checks,
  and scan staged content with Gitleaks without tests.
- `.github/hooks/quality-gates.json` and supporting scripts for Copilot
  turn-end validation and `.env` edit protection.
- `AGENTS.md` to document the enforced hook behavior.
- `docs/status.md` to record implementation and verification.

## Order of work

1. Install Lefthook and define the pre-commit workflow.
2. Add the Copilot `agentStop` and `preToolUse` hooks.
3. Format changed documents and update status.
4. Exercise each hook's pass, fail, and bypass behavior, then run quick checks.

## Risk identified

- Formatting Java through Spotless can inspect more source than the staged
  subset; only originally staged paths should be re-staged.
- Gitleaks must be available in the hook process environment.
- Copilot hook files run only in Copilot-harness sessions; other agent
  providers use different hook formats.
- Shell-command inspection for `.env` is intentionally conservative because
  shell syntax can obscure indirect filesystem writes.

## Work in phases and proof

### Phase 1: Configure Lefthook

- Format staged files, then run frontend/backend lint, type/compile validation,
  and staged Gitleaks scanning. Do not invoke tests.
- Proof: exercise pre-commit using a staged formatting fixture and verify the
  staged result is formatted and all test-free checks pass.

### Phase 2: Configure Copilot hooks

- Run the quick quality suite at agent stop and provide failure output as the
  continuation prompt. Allow a subsequent stop when `stop_hook_active` is set.
- Deny write-oriented tool calls targeting `.env`.
- Proof: feed success and simulated-failure event payloads to the stop script,
  verify the one-time bypass, and feed `.env` and ordinary-file payloads to the
  protection script.

### Phase 3: Verify repository

- Run `npm run check:quick` and confirm no tests are wired into the Lefthook
  pre-commit path.
- Proof: inspect Lefthook's configured commands and report each direct hook
  simulation and the repository check result.
