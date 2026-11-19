# Portfolio product specification

This is the authoritative description of the Portfolio product and its current behavior. Change-specific intent and plan documents are historical working records; they do not override this specification.

## 1. Problem and product purpose

A small artist needs a straightforward way to present a portfolio online, manage which artworks are visible, and understand how visitors engage with individual pieces. The artist also needs to keep the portfolio data local and avoid relying on hosted services. Visitors should be able to explore the public collection without creating an account, and may sign in when they want to react or leave a comment.

Portfolio is a locally hosted web portal that combines a public art gallery with an authenticated artist workspace. It stores artwork and engagement data in a local relational database, serves the interface and artwork assets locally, and provides a documented startup and sample-reset workflow.

## 2. Users and access

### Artist

There is one artist/admin account. The first-run setup creates it; the setup endpoint is unavailable once an admin exists. The artist can manage the full collection, view dashboard metrics, and moderate visitor comments.

### Viewer

Viewers can register with a unique username and password. They can browse public artwork anonymously; an account is required to like, dislike, or comment. Admin and viewer roles are distinct, and admin routes are not available to viewer accounts.

### Anonymous visitor

An anonymous visitor can browse published work and have artwork detail views counted. Anonymous visitors cannot create reactions or comments.

## 3. Product experience

### 3.1 Public landing page

- Presents the public collection and links to gallery browsing.
- Selects three distinct artworks at random from the five seeded sample artworks.
- Stores the selected IDs in browser `sessionStorage`, so they remain selected on refresh in that tab. Selection is tab-scoped, not shared between tabs.
- Shows a representative recent comment snippet on sample cards when one is available.
- Provides navigation by medium and a prompt to sign in or register before interacting.

### 3.2 Public gallery

- Shows published artworks only.
- Supports filtering by medium, searching title and description, and sorting by recently added, title, or view count.
- Artwork cards show a local thumbnail, title, medium, description, view count, and a recent comment snippet when available.
- Visitors can browse without an account.

### 3.3 Artwork detail

- Shows the artwork title, medium, description, local image, view/like/dislike/comment totals, and recent comments.
- Displays up to the 20 most recent comments on an artwork; the total comment count is not capped.
- Records an anonymous view when the detail page opens.
- Signed-out visitors who try to react or comment are directed to sign-in. After authentication, they return to the artwork they were viewing.
- Signed-in visitors can like, dislike, and comment on published artworks.

### 3.4 Artist dashboard

The admin dashboard shows portfolio totals for Uploaded, Published, Unpublished, views, likes, dislikes, and comments. It also provides:

- A summary of counts and engagement by each medium.
- A six-calendar-month views-and-likes trend, including the current month.
- Up to five top works, ordered by view count.
- Quick actions for artwork management, adding a work, and comment moderation.
- Links from metric and medium summaries to relevant admin lists.

Counts are derived from persisted artwork, reaction, comment, and view records.

### 3.5 Artwork management

The artist can list all artworks, search title or description, filter by medium and status, sort by recent, title, or view count, and create, edit, publish, unpublish, or delete an artwork.

An artwork has a title, one of the supported mediums, a description, a local image reference, a status, and creation/update timestamps. The current form selects from the five artwork images bundled with the project; image-file upload and arbitrary image-path entry are not supported.

Artwork statuses are:

- **Uploaded** — stored but not published.
- **Published** — visible in the public gallery.
- **Unpublished** — retained in the artist workspace but hidden from public browsing.

Deleting artwork requires confirmation and explains that related comments and engagement records are also removed. Artwork deletion removes its comments, reactions, and view events.

### 3.6 Comment moderation

The artist can view up to the 200 most recent comments across the portfolio and remove a comment. A removed comment no longer appears in public detail views or counts.

## 4. Mediums and bundled artwork

The product supports exactly these five mediums:

1. Graphite
2. Charcoal
3. Pen and Ink
4. Watercolour and Gouache
5. Colours

Five local image assets are bundled and used by the seeded examples and artwork form: `face.jpg`, `IMG-20211204-WA0017.jpg`, `IMG-20211204-WA0027.jpg`, `IMG-20211204-WA0031.jpg`, and `armour.jpg`.

## 5. Engagement rules

### Views

- A view is recorded when a visitor opens a published artwork's detail page.
- Views do not require authentication.
- A separate HTTP-only browser-session cookie identifies a visitor session. At most one view per artwork is recorded for that session; viewing a different artwork in the same session records a separate view.
- The view cookie is separate from the authenticated login session.

### Reactions

- A signed-in account has at most one reaction per artwork.
- Choosing the same reaction again removes it.
- Choosing the opposite reaction replaces the existing reaction.
- Likes and dislikes are counted separately.

### Comments

- A signed-in account can add a non-empty comment of up to 1,000 characters to a published artwork.
- Comments are associated with their author and artwork and include a creation timestamp.
- Recent comments are visible publicly on artwork detail pages. The artist can remove comments through comment moderation.

## 6. Accounts and security behavior

- First-run setup creates the only admin account; viewer registration remains available afterward.
- Usernames are 3–40 characters and accept letters, digits, underscores, periods, and hyphens. They are trimmed, normalized to lowercase, and unique without regard to case.
- Passwords are 12–128 characters. Passwords are stored as PBKDF2 hashes, never as plaintext.
- There is no password recovery flow in the current product.
- Authentication uses a server-side browser session with an HTTP-only, SameSite=Lax cookie and a 30-minute idle timeout.
- State-changing API requests are protected by CSRF tokens.
- Admin APIs require the ADMIN role. Viewer interactions require an authenticated account; public reads and view recording are available without signing in.
- The web application is intended for local use and does not use an external identity provider.

## 7. Data model

The relational model contains:

- **Artwork** — ID, title, medium, description, local image path, status, creation timestamp, and update timestamp.
- **Account** — ID, unique username, password hash, role (ADMIN or VIEWER), and creation timestamp.
- **Comment** — ID, artwork, author account, content, and creation timestamp.
- **Reaction** — ID, artwork, account, type (LIKE or DISLIKE), and creation timestamp. The artwork/account pair is unique.
- **View event** — ID, artwork, browser-session key, and creation timestamp. The artwork/session pair is unique.

Artwork engagement totals are derived from their related records. Relationships are enforced in the relational database and related records are removed when artwork is deleted.

## 8. Architecture and local operation

- **Frontend:** React, TypeScript, and Vite. In normal use, the production build is served by Spring Boot from the same local origin.
- **Backend:** Java 21 and Spring Boot 3.5.16, exposing REST APIs and serving the single-page application.
- **Database:** file-backed H2 relational database at `data/portfolio` by default.
- **Default port:** the combined application is available at `http://localhost:8080`. Vite's development server uses its default port, 5173.
- **Images:** bundled project files are served locally; the UI has no remote image or font dependency.
- **Startup:** `npm start` builds the frontend and starts Spring Boot. Java 21 and Node.js are required; the Maven wrapper supplies the pinned Maven distribution.
- **Reset:** `npm run reset` destructively restores the sample dataset, removing all accounts and engagement activity before reseeding.
- **Tests:** `npm test` runs frontend tests, backend tests, and Playwright browser workflows.

The application does not need external APIs or hosted services at runtime. Installing Node dependencies, Maven dependencies, and the Playwright browser may require network access unless they are already cached.

## 9. Sample data and reset behavior

On an empty database, the application seeds five published sample artworks—one for each medium—with two representative comments per artwork. The reset command restores that baseline and resets database identity sequences. It also deletes every account, reaction, and view event; because the admin account is removed, first-run artist setup must be completed again after a reset.

The sample reset is a development/demo workflow, not an account-preserving maintenance operation. Do not run it where the database contains data that must be retained.

## 10. User-facing routes and API boundaries

The browser application provides routes for the landing page, gallery, sign-in, sign-up, first-run setup, artwork detail, admin dashboard, admin artwork list/create/edit, and admin comment moderation.

The REST API provides:

- Setup status and initial admin creation.
- Viewer registration, sign-in, sign-out, current-account lookup, and CSRF token retrieval.
- Public artwork listing/detail and anonymous view recording.
- Authenticated artwork reactions and comments.
- Admin artwork listing/detail/create/update/status changes/deletion.
- Admin dashboard metrics and comment listing/removal.

Public artwork endpoints expose only published work. Admin endpoints are role-protected independently of frontend route handling.

## 11. Product constraints and exclusions

- This is a local web portal, not a standalone desktop or mobile app.
- The product supports one admin; viewer accounts are permitted.
- The interface is light-mode and desktop/laptop-oriented. A mobile-first layout and dark mode are not current goals.
- Artwork images come from the bundled local asset list; upload management is not included.
- There is no email, calendar, CRM, social login, AI, marketplace, commerce, custom reporting/export, tagging, or pipeline workflow.
- Account recovery is not available.
- No numeric performance acceptance threshold is defined.

## 12. Current verification and known limitations

- Frontend unit/component tests, backend tests, and Playwright end-to-end workflows pass on the development Windows environment.
- Windows startup, reset, local image serving, and file-database persistence across an application restart have been checked.
- Linux/macOS operation and fully disconnected runtime use have not been independently verified.
- Landing sample selection is scoped to a tab because it uses `sessionStorage`.
- The artwork-detail mockup remains pending review; the accepted dashboard and public-gallery mockups are visual references, not a substitute for the behavior specified here.
