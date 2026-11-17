# Intent: the Portfolio MVP

## Problem

As a small artist, I want a portfolio web portal that lets me showcase my artworks and track how visitors engage with them. The portal needs to support two core experiences: managing my collection as an artist/admin, and letting site visitors browse the public gallery and leave reactions such as views, likes, dislikes, and comments. The goal is to understand which artworks are active, published, and getting attention without requiring any external services or accounts.

## Proposed outcome

The Portfolio is an artwork management and engagement-tracking system that keeps track of:
- how many artworks are uploaded
- how many are published
- how many are unpublished
- how many have received activity such as views, likes, dislikes, or reviews

The viewer side should capture:
- how many times an artwork has been viewed
- how many likes and dislikes it received
- how many reviews/comments were posted

The dashboard creates a summary of the overall engagement across the whole portfolio.

### Five sections

- **Dashboard**: landing page showing the current activity at a glance. It should present summary metrics and allow users to open details for specific artworks or engagement records.
- **Galleries**: separate galleries for different art mediums.
    - Graphite
    - Charcoal
    - Pen and Ink
    - Watercolour and Gouache
    - Colours
- **Viewers**: anonymous public visitors who browse the portfolio and may leave reactions or contact details (email or phone) as part of a viewer record.
- **Artwork management**: every gallery has a search box, a way to add new artwork, and edit/delete actions for each artwork.
- **Review flow**: deleting an artwork should require confirmation and clearly note that related records will be removed as part of that action.

### Four kinds of record

- **Uploaded**: An artwork has been added but has not yet been published or reviewed.
- **Published**: An artwork is visible to the public and ready for review.
- **Activity**: An artwork can be viewed, rated, liked, disliked, or commented on.
- **Unpublished**: An artwork is removed from public viewing without being deleted.

### Sample data

When the portal opens, it displays a curated set of sample artworks from the gallery, including 3 of 5 randomly selected pieces and snippets of representative comments. Clicking a sample or gallery item should open the artwork's own detail page.

### Look and feel

The look follows Portfolio's brand guidelines and takes priority over any general design guidance. The MVP is light mode, optimized for a laptop or desktop screen.

## Affected users and systems

- **Primary user**: one artist/admin managing the portfolio and reviewing engagement data.
- **Secondary users**: anonymous visitors to the public gallery who browse artwork and may like, dislike, view, or comment on it.
- **Systems involved**: no external systems are required for the MVP. The web portal runs locally in the browser and stores its data locally.

## Constraints

- The technology in `docs/TECH_STACK.md`.
- This is a web portal, not a standalone desktop/mobile app. It runs locally in the browser using one documented command on macOS, Linux, and Windows, and does not require internet access to use.
- All changes are persisted: they remain after a browser refresh and reappear every time the portal starts.
- One documented command resets the data to the sample data so the portal can be restarted from a clean baseline.
- This is a prototype MVP, not a multi-user product.
- Not in scope for the MVP: sign-in, user accounts or multiple users; dark mode; mobile layout; AI features; email, calendar, or phone integrations; currencies other than US dollars; custom reports beyond the dashboard; tags or custom fields; changing pipeline stages; importing or exporting data.

## Success criteria

The MVP is successful when all of the following are true:
- A single artist/admin can add, edit, delete, publish, and unpublish artworks in the portfolio.
- Public visitors can browse the gallery, open artwork details, and leave reactions such as views, likes, dislikes, and reviews/comments.
- The dashboard shows accurate counts for uploaded, published, unpublished, liked, disliked, reviewed, and viewed artworks.
- The web portal works fully offline on a desktop/laptop and keeps data saved between visits and browser refreshes.
- The reset command restores the portal to the sample dataset and returns it to a clean starting state.
- The experience is usable as a polished prototype for portfolio presentation and basic engagement tracking, even though advanced features such as user accounts, mobile support, and integrations are intentionally deferred.


