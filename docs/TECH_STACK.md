# Tech Stack

## Recommended stack for this MVP

### Frontend
- React + TypeScript + Vite
- Why: strong ecosystem for interactive dashboards, gallery pages, and forms; fast local development; easy to build a polished web portal with search, filtering, CRUD flows, and analytics views.
- Fit: very good for a desktop-first portfolio web portal with a rich admin dashboard and public gallery experience.

### Backend
- Java 21
- Spring Boot 3
- Why: Java is already required; Spring Boot gives fast REST API development, validation, security hooks, and easy persistence integration for a local web portal.
- Suggested modules: Spring Web, Spring Data JPA, Validation, and optionally Spring DevTools for local iteration.

### Database
- H2 Database (embedded file-based RDBMS) for the MVP
- Why: it is a true relational database, works locally without external setup, works across macOS/Linux/Windows, and supports the requirement for a single command and no internet dependency.
- Long-term option: PostgreSQL if the project grows and needs a more production-like database.

## Recommended architecture

- Frontend SPA served locally or via a Spring Boot static build
- Java backend exposes REST APIs for artworks, gallery data, viewer activity, and dashboard totals
- RDBMS stores artwork records, viewer engagements, comments, and status values
- Browser persists UI state as needed, but core data is stored in the backend database

## Local development setup

- Use Vite for the React frontend
- Use Spring Boot for the Java backend API
- Use one startup command that launches the backend and serves the frontend build locally
- For the MVP, use H2 with a local file database so there is no separate database installation step

## Why this fits the project

This stack balances:
- rich user experience for a portfolio portal
- strong Java backend for business logic and persistence
- reliable relational data model for artworks, engagement events, and viewer records
- offline/local-friendly implementation with one simple startup command

## Default choice

Use:
- Frontend: React + TypeScript + Vite
- Backend: Java + Spring Boot
- Database: H2 (embedded RDBMS) for local MVP; PostgreSQL as a future upgrade path
