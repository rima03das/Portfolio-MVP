# Quality-check workflow plan

## Files that change

- Root `package.json` and `scripts/run-tests.mjs` for full/quick test paths and
  the check/format scripts.
- `frontend/package.json`, its lockfile, Vitest configuration, ESLint flat
  configuration, and Prettier ignore/configuration as needed.
- `backend/pom.xml` and a Checkstyle configuration for Spotless formatting,
  Checkstyle/CyclomaticComplexity, Java compilation, and JaCoCo coverage.
- `.gitignore` and Gitleaks configuration for an ignored local `.env` and
  repository secret scanning.
- `AGENTS.md` and `docs/status.md` for workflow guidance and results.
- Focused frontend/backend tests where required to meet coverage without
  excluding production code.

## Order of work

1. Add frontend Prettier, ESLint recommended React Hooks/accessibility rules,
   Oxlint TypeScript checks, and complexity maximum 15. Keep TypeScript 7.
2. Add Java formatting, Checkstyle lint and complexity maximum of 15, compiler
   validation, and an 80% line-coverage gate.
3. Configure frontend unit coverage to require at least 80% line coverage.
4. Configure Gitleaks to scan the repository using its default rules while
   allowing only `.env`; ignore `.env` in Git.
5. Add `npm run format`, `npm run check:quick`, and `npm run check`; quick mode
   skips only E2E. Update `AGENTS.md`.
6. Run formatting and quick checks, fix findings without weakening rules, add
   focused tests as necessary, then run and report the full check.

## Risks identified

- Existing source may surface formatting, accessibility, complexity, or
  coverage findings; address the source/test causes rather than relaxing gates.
- Gitleaks must be the official CLI, not an unrelated similarly named npm
  package. The ignored `.env` exception must not suppress other repository
  paths or secret rules.
- Java-native checks must not add Python tooling or implicitly upgrade Spring
  Boot or Java.
- E2E checks require the Playwright browser and the local Java/Node toolchain.

## Work in phases and proof

### Phase 1: Configure format, lint, complexity, and type/compile checks

- Frontend Prettier and ESLint recommended TypeScript, React Hooks, and
  accessibility checks; ESLint complexity maximum 15.
- Java formatting with Google Java Format, Checkstyle with
  `CyclomaticComplexity` maximum 15, and Maven test compilation.
- Proof: frontend format check, ESLint, `tsc`, Spotless check, Checkstyle, and
  Maven test compilation all pass.

### Phase 2: Enforce coverage and secret scanning

- Measure frontend and backend production-code unit-test line coverage, with an
  80% minimum for each.
- Scan repository content/history with official Gitleaks defaults and a
  narrowly scoped `.env` path exception.
- Proof: coverage reports and gates pass; Gitleaks reports no unapproved
  findings.

### Phase 3: Wire npm workflows and verify end-to-end

- `npm run check:quick` runs every non-E2E gate.
- `npm run check` runs all gates and E2E; `npm run format` fixes formatting.
- Proof: run `npm run check:quick` and `npm run check`; report the final output.
