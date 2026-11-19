# Quality-check workflow intent

## Problem

The project has frontend and Java backend test suites, but no single enforced
workflow for formatting, linting, complexity limits, type/compile validation,
secret scanning, or minimum unit-test coverage.

## Goal

Provide reliable npm commands for formatting and comprehensive/quick checks.
The checks must preserve the existing React/TypeScript and Java/Spring Boot
stack, use recommended frontend TypeScript, React Hooks, and accessibility
linting, enforce cyclomatic complexity no greater than 15, detect secrets
across the repository while permitting a git-ignored `.env`, and require at
least 80% unit-test line coverage.

## Users

Contributors need one documented command to validate the full project and a
faster variant that omits browser end-to-end tests.

## Constraints

- Keep the existing Java backend; use Java-native formatting, linting,
  complexity, and compilation checks rather than Python tools.
- Keep TypeScript 7; use Oxlint's TypeScript checks because typescript-eslint
  does not support the installed compiler version.
- Do not weaken rules to accommodate existing findings.
- Keep `docs/STANDARDS.MD` unchanged.
- Full checks include all existing test layers; quick checks omit only E2E.

## Success criteria

- `npm run format` applies frontend and Java formatting.
- `npm run check:quick` passes formatting checks, lint, complexity, type and
  compile checks, secret scanning, unit tests, and the 80% coverage gates.
- `npm run check` runs the same gates plus E2E and succeeds.
- `AGENTS.md` documents `npm run check`, and status documentation records the
  final verification results.
