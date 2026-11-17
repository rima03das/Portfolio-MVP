# MVP Specification: Portfolio Web Portal

This document defines the requirements and design for the Portfolio MVP based on the product intent and chosen technology stack.

## 1. Product summary

The Portfolio MVP is a local-first web portal for a small artist to manage a portfolio of artworks and track visitor engagement. It supports two primary experiences:

- Artist/admin workflow: add, edit, publish, unpublish, and delete artworks; review gallery performance and engagement totals.
- Public gallery workflow: visitors browse artwork and open detail pages without signing in. They authenticate when they want to like, dislike, or comment; page views may be recorded anonymously.

The portal is browser-based, runs locally without internet access, and stores data in a local relational database so changes persist across refreshes and restarts.

## 2. Goals and non-goals

### Goals

- Let one artist manage artwork records for multiple mediums.
- Show a polished public gallery that works well on laptop and desktop screens.
- Track engagement at the artwork and portfolio level.
- Keep the system fully local/offline and easy to reset to sample data.
- Deliver a working prototype for portfolio presentation and basic engagement reporting.

### Non-goals for MVP

- Multiple artist/admin accounts
- External identity providers or sign-in services
- Mobile-first design
- Dark mode
- AI features
- Email, calendar, or CRM integrations
- Advanced reporting or custom export
- Tags/custom fields or pipeline stages
- Global marketplace or commerce features
- External service dependencies

## 3. Target users

### Primary user: artist/admin

The artist is the main operator of the system. They need to:

- add and manage artwork
- review engagement metrics
- publish or unpublish artwork
- manage portfolio visibility
- maintain a clean, polished presentation

### Secondary user: public viewer

The viewer can browse the public site without authentication. They can:

- browse the gallery by medium
- view artwork detail pages
- trigger anonymous view events
- see public portfolio content only

To like, dislike, or comment, a viewer must authenticate. Local authentication must not depend on an external identity provider.

## 4. Functional requirements

### 4.1 Admin dashboard

The dashboard is the landing page for the artist/admin and must show:

- total uploaded artworks
- total published artworks
- total unpublished artworks
- total comments/reviews
- total likes
- total dislikes
- total views
- a quick summary by medium or gallery

The admin should be able to:

- open artwork details
- sort/filter artworks by status and gallery
- search artworks by title or relevant metadata
- add a new artwork
- edit existing artwork
- publish or unpublish artwork
- delete artwork with confirmation

### 4.2 Gallery management

The system supports galleries for these art mediums:

- Graphite
- Charcoal
- Pen and Ink
- Watercolour and Gouache
- Colours

Each artwork belongs to a gallery/medium and carries a status:

- Uploaded
- Published
- Unpublished

Gallery behavior:

- public gallery views show only published artworks
- admin views show all artworks including unpublished or uploaded ones
- artwork search and listing must work within a selected gallery

### 4.3 Artwork management

An artwork record must include:

- unique ID
- title
- gallery/medium
- description or summary
- image reference/path
- status
- create/update timestamps
- related engagement counts

Supported admin actions:

- add artwork
- edit artwork details
- delete artwork
- publish artwork
- unpublish artwork

Delete behavior:

- deletion must require confirmation
- deletion should clearly state that related engagement data and comments will be removed

### 4.4 Public gallery and artwork detail

The public site must include:

- a browseable gallery view
- per-medium gallery sections
- artwork cards with thumbnail and summary
- detail page for each artwork

The artwork detail page should show:

- title
- medium
- description
- image
- engagement totals
- comments/reviews

Public visitors can browse and view artwork without signing in. To interact, they must sign in:

- like or dislike an artwork
- add a review/comment

If an unauthenticated visitor tries to interact, prompt them to sign in and return them to the artwork after authentication.

### 4.5 Viewer engagement tracking

The system tracks these engagement types:

- view
- like
- dislike
- review/comment

The following rules apply:

- a view is counted when an artwork detail page is opened or a public view event is recorded
- view events may be recorded without an account
- likes and dislikes must be associated with an authenticated viewer and a specific artwork
- comments must be linked to an authenticated viewer and specific artwork, and remain visible in the public detail view
- engagement totals should be available to the admin dashboard and detail pages

### 4.6 Reset / sample data workflow

The system must support a documented reset command that restores the portal to a clean sample dataset. The sample dataset should contain a curated set of representative artworks and comments.

Requirements:

- the app should start in a known state with sample data
- one command resets local database content to baseline sample data
- reset behavior should be deterministic and documented

## 5. Non-functional requirements

### 5.1 Local/offline operation

- The portal runs locally in the browser
- No internet connection is required for standard use
- The app must work on Windows, macOS, and Linux
- One startup command launches the system locally

### 5.2 Persistence

- All artwork and engagement changes persist between page refreshes and application restarts
- Data persists in a local relational database file, not transient memory

### 5.3 Performance

- Page loads for a typical portfolio should feel immediate on a laptop/desktop
- The app should support a moderate portfolio size without significant delay
- Dashboard counts must update quickly after new activity

### 5.4 Usability

- Interface should be polished enough for a portfolio presentation prototype
- Light mode only
- Desktop-first layout preferred
- Forms should be clear and low-friction for the artist/admin

### 5.5 Security and trust

- Admin functions require artist/admin authentication
- Public viewing and view tracking do not require authentication
- Likes, dislikes, and comments require viewer authentication
- Authentication must operate locally without an external identity provider
- The system should not expose anything beyond the intended portfolio view
- Data integrity should be enforced at the database layer where possible
- The authentication mechanism, account creation, and account recovery flow remain implementation decisions

## 6. Proposed design

### 6.1 Architecture

Recommended MVP architecture:

- Frontend: React + TypeScript + Vite
- Backend: Java 21 + Spring Boot 3
- Database: H2 embedded file-based RDBMS

High-level flow:

- React SPA provides the admin dashboard, gallery, detail view, and forms
- Spring Boot REST API exposes endpoints for artworks, gallery data, and engagement events
- Spring Security protects admin operations and authenticated visitor interactions
- H2 stores artwork records, viewer accounts, viewer activity, comments, and status values
- A single local startup command runs the app and serves the built frontend locally

### 6.2 System components

#### Frontend

Responsibilities:

- render the dashboard and public gallery
- manage user interactions and forms
- call REST APIs to load and update records
- show summary metrics and user feedback

#### Backend

Responsibilities:

- validate artwork and engagement input
- expose CRUD and query endpoints
- enforce status rules
- coordinate database writes
- support backup/reset operations and sample-data seeding

#### Database

Expected core tables:

- artworks
  - id
  - title
  - gallery
  - status
  - description
  - image_path
  - created_at
  - updated_at

- comments
  - id
  - artwork_id
  - account_id
  - content
  - created_at

- engagement_events
  - id
  - artwork_id
  - account_id (nullable for anonymous views)
  - event_type (view, like, dislike, review)
  - created_at

- accounts
  - id
  - login identifier
  - password hash (never plaintext)
  - role (ADMIN or VIEWER)
  - created_at

- gallery_categories
  - id
  - name

The DB should enforce relational integrity so artworks and comments are not orphaned, and delete actions should cascade appropriately when required.

### 6.3 Core workflows

#### Workflow A: Add artwork

1. Admin opens artwork form.
2. Admin enters title, description, medium, image path, and status.
3. Client submits to backend.
4. Backend validates data.
5. Database persists record.
6. Dashboard and gallery reload updated data.

#### Workflow B: Publish/unpublish artwork

1. Admin selects artwork.
2. Admin changes status to published or unpublished.
3. Backend updates the record.
4. Public gallery shows or hides the item accordingly.

#### Workflow C: View artwork

1. Visitor opens a public artwork detail page.
2. Frontend loads artwork details and counts.
3. Backend records a view event without requiring sign-in.
4. Dashboard totals refresh on the next data load.

#### Workflow D: Like/dislike/comment

1. Visitor chooses a reaction or comment on an artwork detail page.
2. If signed out, the visitor signs in and returns to that artwork.
3. Frontend sends the authenticated interaction to the backend.
4. Backend saves the engagement record with the viewer identity.
5. Client refreshes artwork metrics and comment list.

#### Workflow E: Reset sample data

1. Admin or developer runs documented reset command.
2. Script clears local database state.
3. Script repopulates sample artworks and comments.
4. App restarts in known, clean baseline state.

## 7. User stories

- As an artist, I want to add a new artwork so I can publish my portfolio pieces.
- As an artist, I want to edit an artwork so I can fix inaccuracies or update descriptions.
- As an artist, I want to publish or unpublish work so I can control public visibility.
- As an artist, I want dashboard totals so I can see which works are performing well.
- As a visitor, I want to browse by medium so I can explore the gallery easily.
- As a visitor, I want to open artwork detail pages so I can read more about a work.
- As a visitor, I want to browse without signing in and authenticate only when I want to react or comment.

## 8. Success criteria

The MVP is successful when:

- the artist can manage artworks from the admin flow
- public visitors can browse anonymously and authenticate to react or comment
- the artist/admin can authenticate to access management features
- dashboard metrics are accurate and update after activity
- the portal works offline in a local browser environment
- changes remain saved across refreshes and restarts
- reset command restores the known sample state
- the prototype is polished enough for presentation and demo use

## 9. Problems and risks to anticipate

The following issues are likely to arise during implementation and should be addressed early:

- Duplicate view counting: the same visitor may trigger multiple view events for the same artwork in a short period, causing inflated totals.
- Like/dislike consistency: authenticated viewers may click multiple times; rules must define whether a second click cancels or replaces the prior reaction.
- Comment moderation: authenticated visitors can post irrelevant content; the MVP may require basic validation and sanitization.
- Authentication scope: local accounts, sign-in, and account recovery must be designed without external providers; credential storage and session handling need careful implementation.
- Data integrity on delete: deleting an artwork must also remove related comments and engagement events, or the DB will retain stale references.
- Reset reliability: a local database reset must be deterministic and safe, especially if the app is being used during development.
- Offline persistence complexity: browser storage and local app state can drift from the backend database if UI caching and server-side state get out of sync.
- H2 sizing and compatibility: H2 is a good MVP choice, but long-term usage or production-style migration may require schema changes and data-porting work later.
- UI state mismatch: dashboard counters and public page counts may temporarily disagree if API calls are not synchronized or refreshed correctly.
- Startup complexity: a single command must launch the backend and frontend cleanly across Windows, macOS, and Linux without extra manual steps.
- Limited scope creep: features like visitor accounts, analytics filters, or a richer review system may tempt the team beyond the MVP and delay delivery.
- Sample dataset realism: the demo portfolio must feel credible and not artificially simplistic, or the prototype loses persuasive value.

## 10. Recommended implementation priority

1. Set up the Java + Spring Boot backend, local authentication, and H2 database.
2. Build the artwork CRUD API and data model.
3. Create the React admin dashboard and artwork form.
4. Implement the public gallery, artwork detail, and visitor sign-in flow.
5. Add authenticated engagement tracking and comment storage.
6. Add reset logic and sample seed data.
7. Validate dashboard metrics and fix edge cases.

This staged approach keeps the MVP focused while ensuring the critical user workflows work before polishing the front-end experience.
