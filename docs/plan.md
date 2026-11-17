# Portfolio MVP Implementation Plan

This plan is based on [docs/intent.md](docs/intent.md) and [docs/spec.md](docs/spec.md). It describes proposed implementation work only; no application code has been written.

## Files that change

The workspace currently contains planning documents, mockups, and artwork images, but no application source or test projects. The following files and folders are expected to be created:

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
- `README.md` for prerequisites, one-command startup, local account setup, reset instructions, and test commands.
- `docs/status.md` to track implementation progress and verification results.

Existing product intent, specification, stack guidance, mockups, and image assets are reference material and should not be changed unless implementation uncovers a requirement that needs clarification.

## Order of work

1. Resolve local authentication decisions that affect data and workflows: viewer registration, provisioning exactly one admin, account recovery expectations, and session behavior. Define the reaction rule (replace, cancel, or prevent duplicate like/dislike) and view-count deduplication policy.
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
| Deterministic reset restores sample data; one startup command; persistence across refreshes and restarts | Provide documented startup and reset commands; make reset explicit and repeatable; store core data in the H2 file database | Repeated reset tests restore the same baseline; E2E test verifies persistence after refresh/restart and reset recovery |
| Offline use on Windows, macOS, and Linux; no external services | Package local assets and avoid runtime CDN/API dependencies; provide platform-appropriate command wrappers for the same documented workflow | Verify core workflows with network disconnected and run startup/reset checks on each supported OS |
| Polished, light-mode, desktop/laptop-first UI following Portfolio brand guidance | Apply the accepted dashboard and public-gallery mockups and brand guidance; keep mobile-first and dark-mode work out of scope | Desktop visual/usability checklist covers light mode, laptop layout, key mockup elements, and error/empty/loading states |
| Typical portfolio feels immediate; moderate portfolio size; dashboard updates quickly | Check representative list/detail and aggregate requests with a moderate seeded dataset; record timings and identify any blocking delay | Performance validation records measured page/API timings; the numeric acceptance threshold remains to be agreed because the spec does not define one |
| Explicit non-goals: multiple admins, mobile-first design, dark mode, integrations, AI, custom reports/export, tags/custom fields, pipeline stages, marketplace/commerce | Keep these outside implementation and acceptance scope; do not add dependencies on external services | Scope review confirms no non-goal has entered the MVP |

## Risk identified

- **Authentication decisions remain open:** registration and recovery are undecided. Settle them before implementing account flows; store only password hashes and protect admin operations separately from viewer interactions.
- **Engagement semantics are underspecified:** duplicate view counting and repeated like/dislike behavior can make dashboard totals misleading. Define and test the policies before building the metrics.
- **Record terminology differs:** intent mentions Uploaded, Published, Activity, and Unpublished, while the spec models Activity as engagement and artwork status as Uploaded, Published, or Unpublished. Keep status and engagement as separate concepts; confirm if the dashboard should show a separate “Activity” record category.
- **Random sample selection versus deterministic reset:** keep the five-artwork seed baseline deterministic while selecting three distinct pieces for the landing view; settle whether selection changes on each visit or remains stable for a session.
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

- Artwork validation rejects missing/invalid required fields and accepts valid records.
- The five supported mediums are represented; gallery queries, search, sorting, and status filters return the expected records.
- Status operations publish and unpublish correctly; public queries exclude non-published artworks.
- Engagement policy prevents or handles repeated reactions according to the agreed rule.
- View tracking follows the agreed deduplication policy, including repeated requests at its boundary.
- Dashboard aggregation returns correct portfolio and per-medium counts for uploaded, published, unpublished, views, likes, dislikes, and comments, including empty data.
- Artwork deletion removes associated engagement and comments; reset restores the exact sample baseline on repeated runs.
- Authorization rules allow anonymous public reads/views, require the single admin role for management, and require a signed-in viewer for reactions/comments without relying on an external identity provider.

**Integration-test proof:** repository/API tests against H2 verify persistence across application contexts, relational integrity, all medium values, public visibility, role-based access, delete behavior, and repeatable reset behavior.

### Phase 3 — Frontend experiences

Build admin dashboard and management screens, public gallery and artwork detail, authentication prompts, and API error/loading/empty states, using the accepted mockups as guidance.

**Unit-test proof:**

- API client sends the expected requests and reports failures instead of showing success-shaped fallbacks.
- Gallery/dashboard components render the expected records and counts for loading, empty, and populated responses; gallery search/filter/sort and per-medium summaries behave correctly.
- Public landing view shows exactly three distinct pieces from the five seeded samples with representative comment snippets and links to their detail pages.
- Artwork detail renders title, medium, description, image, engagement totals, and comments.
- Admin actions reflect successful changes and surface failed saves/deletes.
- Signed-out interaction attempts lead to sign-in while preserving the selected artwork destination.
- Delete confirmation clearly explains that associated comments and engagement records will be removed; cancel leaves the artwork intact.

### Phase 4 — End-to-end verification and handoff

Verify complete user workflows, offline operation, persistence across refresh/restart, sample reset, and platform-specific startup. Record results in the status document.

**End-to-end-test proof:**

- Admin signs in, creates an artwork, edits it, publishes it, unpublishes it, and deletes it with confirmation.
- Admin searches, sorts, and filters within each medium and follows a dashboard summary to its artwork or engagement detail.
- Anonymous visitor browses published works, opens a detail page, and records a view; unpublished works remain unavailable publicly.
- Visitor is prompted to sign in before reacting or commenting, then can complete the action and see updated engagement.
- Dashboard portfolio and medium totals match persisted sample and newly created activity after refresh; public detail shows the corresponding image, description, counts, and comments.
- Landing view presents three distinct sampled artworks and comment snippets from the curated five-artwork pool.
- Data survives browser refresh and application restart; the reset command restores the known sample dataset.
- Portal launches and supports core workflows without internet access on Windows, macOS, and Linux.
- Desktop review confirms the light-mode layout follows the accepted mockups and available brand guidance; performance measurements are recorded against an agreed moderate sample size and threshold.

**Completion proof:** all required unit, integration, and end-to-end tests pass; startup/reset/test instructions are documented; unresolved limitations are recorded.
