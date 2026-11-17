# Portfolio MVP Status

## Status: Planning — dashboard and public gallery mockups accepted

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
- [intent.md](intent.md)
- [TECH_STACK.md](TECH_STACK.md)
- [spec.md](spec.md)
- [mockups/mockup-01-dashboard.html](../mockups/mockup-01-dashboard.html) — accepted
- [mockups/mockup-02-gallery.html](../mockups/mockup-02-gallery.html) — accepted
- [mockups/mockup-03-artwork-detail.html](../mockups/mockup-03-artwork-detail.html) — pending review

## Open questions
- Final data model for artworks, viewer records, and engagement events
- Local authentication, visitor registration, and account recovery flow
- Exact workflow for likes/dislikes and reviews
- Reset-to-sample-data command and sample content list

## Next steps
1. Review the artwork detail mockup.
2. Finalize authentication and the data model.
3. Prepare the project structure and startup workflow.
4. Build the first working version with sample data.

## Definition of done
The MVP is done when:
- the artist can manage artworks end-to-end
- visitors can browse and engage with the gallery
- the dashboard reflects key counts accurately
- the portal runs locally with one documented startup command
- sample data can be reset with one documented command
- the project meets the approved scope and constraints in [intent.md](intent.md)
