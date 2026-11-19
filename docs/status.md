# Portfolio MVP Status

## Status: Core MVP implemented — automated checks and Windows smoke tests pass; cross-platform/performance checks pending

## Goal
Build a local portfolio web portal for a small artist to showcase artworks, manage gallery content, and review engagement metrics from public visitors.

## Current scope
- Web portal, not a standalone app
- Artist/admin dashboard and public gallery experience
- Artwork management: add, edit, delete, publish, unpublish
- Viewer engagement tracking: view, like, dislike, review/comment counts
- Dashboard summary of engagement metrics
- Authentication required for admin access and for visitor likes, dislikes, and comments; public browsing and views remain anonymous
- Local/offline use with persistent data
- Desktop/laptop focus
- No multiple admin accounts, AI, mobile layout, or external integrations in MVP

## Tech stack
- Frontend: React + TypeScript + Vite
- Backend: Java + Spring Boot
- Database: H2 (embedded RDBMS) for MVP

## Current artifact set
- [MVP intent](changes/mvp/intent.md)
- [MVP implementation plan](changes/mvp/plan.md)
- [TECH_STACK.md](TECH_STACK.md)
- [spec.md](spec.md)
- [mockups/mockup-01-dashboard.html](../mockups/mockup-01-dashboard.html) — accepted
- [mockups/mockup-02-gallery.html](../mockups/mockup-02-gallery.html) — accepted
- [mockups/mockup-03-artwork-detail.html](../mockups/mockup-03-artwork-detail.html) — pending review

## Implemented
- React + TypeScript + Vite frontend and Java 21 + Spring Boot + H2 backend
- Public landing page, artwork gallery and detail view; local artwork images
- One-time artist/admin setup and viewer registration/sign-in with role-based access
- Artwork create/edit/search/filter/sort/publish/unpublish/delete workflows
- Likes/dislikes, comments, one view per artwork per browser session, and dashboard metrics
- Five sample artworks with comments and three distinct session-selected landing samples
- Focused frontend/backend tests and Playwright browser workflows
- Cross-platform Node startup/reset/test scripts and Maven wrapper
- Java-home discovery for the wrapper, using `JAVA_HOME` or a Java executable on `PATH`

## Decisions and known limitations
- Viewer registration is open; password recovery is out of MVP scope.
- Authentication uses an HTTP-only browser-session cookie. Repeating a reaction removes it; choosing the opposite replaces it.
- The reset command is destructive: it also deletes all accounts and engagement records.
- Landing sample selection currently uses `sessionStorage` and is scoped to a browser tab.
- Mockup 3 remains pending acceptance; its details are not treated as finalized requirements.
- The spec has no numeric performance target; performance observations and agreement on a threshold remain outstanding.
- Automated suites and Windows runtime verification are complete. macOS/Linux behavior, disconnected-network operation, and quantitative performance are not yet independently validated.

## Verification
- Frontend: 11 unit/component tests pass; production build/type-check passes.
- Backend: 14 unit and API integration tests pass.
- Playwright: 2 browser E2E tests pass, covering the admin/viewer workflow, filtering/sorting, delete confirmation, session samples, refresh behavior, local image loading, and absence of external requests.
- Windows runtime checks pass: `npm start` serves the SPA/API and local images, a published artwork survives a real application restart with the file-backed H2 database, and `npm run reset` restores the sample baseline.
- Full `npm test` passes all frontend, backend, and E2E suites.
- Linux/macOS startup and reset, true disconnected-network operation, and quantified performance remain unverified.

## Definition of done
The MVP is done when:
- the artist can manage artworks end-to-end
- visitors can browse and engage with the gallery
- the dashboard reflects key counts accurately
- the portal runs locally with one documented startup command
- sample data can be reset with one documented command
- the project meets the product requirements documented in [spec.md](spec.md)
- frontend, backend, and end-to-end test suites pass; supported platform and offline checks are recorded
