# Portfolio MVP Implementation Plan

This plan records the MVP implementation work described in [intent.md](intent.md), against the product baseline in [spec.md](../../spec.md). Implementation is complete; see the [status tracker](../../status.md).

## Files that change

The original workspace contained planning documents, mockups, and artwork images. The MVP implementation added the following projects and supporting files:

- `frontend/`
  - `package.json`, `vite.config.ts`, `tsconfig.json`, and `index.html`
  - `src/` for the React + TypeScript application: routes/pages, shared components, API client, types, and styles
  - `src/**/*.test.ts(x)` for focused component and client tests
  - `e2e/` and test-runner configuration for full browser workflows
- `backend/`
  - `pom.xml` and Spring Boot application configuration
  - `src/main/java/` for API controllers, services, entities, repositories, validation, and security configuration
  - `src/main/resources/` for database configuration, schema/migrations, and deterministic sample data
  - `src/test/java/` for service, repository, API, and security tests
- Root-level scripts/configuration for one-command startup and sample-data reset on Windows, macOS, and Linux.
- Maven wrapper files to pin the backend build tool across supported platforms.
- `README.md` for prerequisites, one-command startup, local account setup, reset instructions, and test commands.
- `docs/status.md` to track implementation progress and verification results.

The current product requirements are documented in [spec.md](../../spec.md). This plan is retained as the implementation record for the MVP change.

## Order of work

1. **Resolved with the product owner:** viewers self-register with unique usernames/passwords; a one-time first-run page provisions the sole admin; no account recovery is in the MVP; auth uses an HTTP-only browser-session cookie; same-reaction clicks remove a reaction and opposite clicks replace it; anonymous views count once per artwork per browser session; three of the five curated samples are randomized once per browser session.
2. Set up the React/Vite frontend and Java 21/Spring Boot backend, H2 file database, environment configuration, and frontend, backend, and end-to-end test runners.
3. Define and persist the relational model for artworks, the five galleries/media, accounts, reactions, comments, and views. Add a curated five-artwork sample pool with representative comments and a deterministic reset workflow.
4. Implement backend validation, artwork management and search/filtering, status transitions, public queries, engagement operations, dashboard aggregates and drill-down data, and local authentication/authorization.
5. Implement the admin dashboard and artwork-management flows, matching the accepted admin mockup; then implement the public landing/gallery and detail flows, matching the accepted public mockup.
6. Connect the UI to the API, including sign-in prompts and return-to-artwork behavior for unauthenticated interactions. Show three distinct sample artworks selected from the curated pool with representative comment snippets. Confirm the artwork-detail mockup before treating its design as accepted.
7. Add cross-platform startup/reset scripts and documentation. Run focused unit and integration checks, then end-to-end workflows, offline/persistence checks, and desktop usability/performance validation.
8. Update the status document with completed scope, known limitations, and test evidence.

### Specification :: implementation plan mapping

| Specification | Implementation plan | Verification proof |
|---|---|---|
| Local-first web portal; React + TypeScript + Vite, Java 21 + Spring Boot 3, H2 file-based RDBMS | Create the frontend and backend projects with H2 persistence; serve the built SPA locally through the packaged app or documented local setup | Build/start checks confirm the selected stack starts without external services |
| One artist/admin; authenticated viewers; no external identity provider | Provision one admin locally; implement viewer authentication and role-based authorization without an external identity provider; settle registration, recovery, and session behavior before coding auth | Security/API tests exercise anonymous, viewer, and admin roles; verify no external identity provider is required |
| Five galleries: Graphite, Charcoal, Pen and Ink, Watercolour and Gouache, Colours | Seed and validate the five supported medium values; expose gallery navigation and per-gallery listing | Tests verify all five values, gallery filtering, and artwork membership |
| Dashboard totals for uploaded, published, unpublished, comments/reviews, likes, dislikes, and views; summary by medium | Implement persisted-data aggregates and dashboard links to artwork and relevant engagement details | Service/API tests compare aggregate totals and per-medium totals to fixture records; UI test verifies drill-down navigation |
| Admin search, sorting/filtering, add, edit, publish, unpublish, and delete | Implement admin gallery management and validated artwork forms with status controls and search/filter/sort | Backend tests cover CRUD and status rules; UI/E2E tests cover search/filter/sort and each admin action |
| Artwork fields: ID, title, medium, description, image reference, status, timestamps, engagement counts | Persist these fields with relational constraints; serve image references and related counts to the UI | Repository/API tests verify stored fields, timestamps, and derived engagement counts |
| Public gallery only shows published work; cards include thumbnail and summary; visitors can browse anonymously | Implement public gallery and per-medium sections that expose published records only | API and E2E tests verify anonymous browsing, card content, and exclusion of uploaded/unpublished work |
| Detail page shows title, medium, description, image, engagement totals, and comments | Implement public artwork-detail route and load its artwork and engagement data | E2E test checks all required detail fields, counts, and visible comments |
| Anonymous views; authenticated likes, dislikes, and comments; signed-out users return to their artwork after sign-in | Record anonymous view events; associate reactions/comments with an authenticated viewer; preserve the intended detail destination through sign-in | Tests verify event identity and authorization; E2E test completes sign-in and the deferred interaction on the original artwork |
| Delete confirmation clearly warns that related engagement and comments are removed | Show an explicit confirmation message; delete dependent records transactionally or by database cascade | UI/E2E test checks confirmation text and cancellation/confirmation; backend test verifies no related records remain |
| Curated initial sample: three of five randomly selected pieces with representative comment snippets | Seed five curated sample artworks and comments; select and display three distinct samples on the landing view, each linking to its detail page | Seed/reset test verifies the exact five-piece baseline; UI/E2E test verifies three distinct samples, snippets, and working detail links |
| Deterministic reset restores sample data; one startup command; persistence across refreshes and restarts | Provide documented startup and reset commands; make reset explicit and repeatable; store core data in the H2 file database | Repeated reset tests restore the same baseline; E2E verifies refresh persistence; a local runtime check verifies file-database persistence across app restart |
| Offline use on Windows, macOS, and Linux; no external services | Package local assets and avoid runtime CDN/API dependencies; provide platform-appropriate command wrappers for the same documented workflow | Verify core workflows with network disconnected and run startup/reset checks on each supported OS |
| Polished, light-mode, desktop/laptop-first UI following Portfolio brand guidance | Apply the accepted dashboard and public-gallery mockups and brand guidance; keep mobile-first and dark-mode work out of scope | Desktop visual/usability checklist covers light mode, laptop layout, key mockup elements, and error/empty/loading states |
| Typical portfolio feels immediate; moderate portfolio size; dashboard updates quickly | Check representative list/detail and aggregate requests with a moderate seeded dataset; record timings and identify any blocking delay | Performance validation records measured page/API timings; the numeric acceptance threshold remains to be agreed because the spec does not define one |
| Explicit non-goals: multiple admins, mobile-first design, dark mode, integrations, AI, custom reports/export, tags/custom fields, pipeline stages, marketplace/commerce | Keep these outside implementation and acceptance scope; do not add dependencies on external services | Scope review confirms no non-goal has entered the MVP |

## Risk identified

- **Authentication decisions resolved:** implement self-service viewer registration, one-time first-run admin setup, no recovery flow, and session-only HTTP-only authentication cookies. Store only password hashes and protect admin operations separately from viewer interactions.
- **Engagement semantics resolved:** one reaction per viewer/artwork toggles off on the same reaction and changes on the opposite reaction; count one view per artwork/browser session. Cover repeat and boundary behavior with service and API tests.
- **Record terminology resolved:** Uploaded, Published, and Unpublished are artwork statuses; views, likes, dislikes, and comments are separate engagement records and dashboard metrics.
- **Random sample selection versus deterministic reset:** keep the five-artwork seed baseline deterministic and select three distinct pieces once per browser session; test both the exact reset baseline and selection distinctness.
- **Deletion and reset can lose data:** artwork deletion must remove or otherwise resolve related comments and events, and reset must be explicit, deterministic, and documented as destructive.
- **Local images and offline operation:** image references must resolve from a local installation without remote assets or external services. Validate startup and browsing with network access unavailable.
- **Single-command launch across operating systems:** frontend build, backend startup, and reset scripting may differ across Windows, macOS, and Linux. Verify each supported platform rather than assuming portability.
- **Dashboard consistency:** concurrent or recently recorded activity can leave aggregates stale. Derive counts from persisted data and test refresh behavior after interactions.
- **Performance target is qualitative:** “immediate” and “moderate portfolio size” have no numeric threshold in the spec. Measure a representative dataset and agree on a threshold before claiming a performance pass.
- **Brand guidance may be unavailable:** use the accepted mockups as the visual baseline and record any missing brand assets or unresolved guidance rather than inventing brand rules.
- **Mockup coverage is incomplete:** Mockups 1 and 2 are accepted, but Mockup 3 is pending. Avoid treating its details as a finalized requirement until reviewed.

## Work in phases

### Phase 1 — Decisions and foundation

Confirm the open authentication and engagement rules, establish the frontend/backend project structure, configure H2 persistence, and create the test harnesses.

**Exit proof:** both applications build and run locally; a backend test can initialize an isolated H2 database; frontend and backend test commands are documented.

### Phase 2 — Data and backend workflows

Implement schema, sample data, reset, artwork CRUD and publication rules, public read APIs, authenticated reactions/comments, anonymous views, and dashboard aggregates.

**Unit-test proof:**

- `PortfolioWorkflowTest`: verifies the five-piece reset baseline, search and status filtering across all five mediums, publication transitions, reaction toggling/replacement, per-session view deduplication, dashboard metrics/empty state, deletion integrity, and account uniqueness.
- `PortfolioApiIntegrationTest`: verifies anonymous access boundaries, one-time admin setup, viewer registration/login, session authorization, anonymous view cookies, admin CRUD, and invalid input handling.
- `PortfolioApplicationTests`: verifies application context startup with an isolated relational database.

**Integration-test proof:** repository/API tests against H2 verify persistence across application contexts, relational integrity, all medium values, public visibility, role-based access, delete behavior, and repeatable reset behavior.

### Phase 3 — Frontend experiences

Build admin dashboard and management screens, public gallery and artwork detail, authentication prompts, and API error/loading/empty states, using the accepted mockups as guidance.

**Unit-test proof:**

- `api.test.ts`: verifies request parameters, credentials, and visible HTTP/network errors.
- `PublicPages.test.tsx`: verifies gallery rendering, medium filtering, search, and the signed-out reaction prompt's artwork return destination.
- `sample-selection.test.ts`: verifies three distinct samples remain selected in the browser session.
- `AuthPages.test.tsx`: verifies sign-in returns a viewer to the requested artwork.
- `AdminPages.test.tsx`: verifies dashboard metrics/drill-downs and that canceling deletion preserves the artwork after showing the related-data warning.
- Artwork create/edit/status transitions, public detail, and engagement are additionally covered in `portfolio.spec.ts`.

### Phase 4 — End-to-end verification and handoff

Verify complete user workflows, offline operation, persistence across refresh/restart, sample reset, and platform-specific startup. Record results in the status document.

**End-to-end-test proof:**

- `portfolio.spec.ts` — one-time admin setup, create/edit/publish/unpublish/delete with confirmation, admin search/filter/sort, viewer registration from the sign-in prompt, return to the original artwork, reaction/comment, and dashboard totals.
- `portfolio.spec.ts` — verify three distinct sample artworks with comment snippets, unpublished-work exclusion, and no external network requests.
- `persistence.spec.ts` — verify a browser-session view is counted once across a page refresh.
- Backend sample-data tests — verify repeatable reset to the five-artwork baseline; `npm run reset` runs the explicit local reset command.
- Portal launches and supports core workflows without internet access on Windows, macOS, and Linux.
- Desktop review confirms the light-mode layout follows the accepted mockups and available brand guidance; performance measurements are recorded against an agreed moderate sample size and threshold.

**Completion proof:** all required unit, integration, and end-to-end tests pass; startup/reset/test instructions are documented; unresolved limitations are recorded.
