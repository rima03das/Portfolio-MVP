# Portfolio MVP

A local-first portfolio web portal for managing artwork and sharing a public gallery. The built React application is served by Spring Boot; artwork images and data stay on the local machine.

## Requirements

- Node.js 20.19+ or 22.12+
- Java 21 JDK

Set `JAVA_HOME` to the JDK, or make its `java` executable available on `PATH`. The Maven wrapper downloads the pinned Maven distribution and Java dependencies on the first backend build. No Maven installation, hosted service, or external identity provider is required.

## First run

Install the frontend dependencies once:

```sh
npm --prefix frontend install
```

Start the portal:

```sh
npm start
```

Open [http://localhost:8080](http://localhost:8080). On first run, choose **Set up artist account** to create the sole local artist/admin account. Visitors can browse without an account and can register to like, dislike, or comment.

The application stores its H2 database in `data/portfolio` relative to the project directory. Keep the project directory and database file local to preserve the portfolio.

## Reset sample data

```sh
npm run reset
```

Reset is destructive: it restores the five curated sample artworks and their comments and deletes all accounts, visitor reactions, and view records. After resetting, create the artist/admin account again.

## Tests

Run frontend unit/component tests, backend tests, and browser end-to-end workflows:

```sh
npm test
```

The end-to-end tests use Playwright. Install its Chromium browser once if it is not already available:

```sh
npm --prefix frontend exec -- playwright install chromium
```

To run only the browser workflows:

```sh
npm run test:e2e
```

## Quality checks

Install the official [Gitleaks CLI](https://github.com/gitleaks/gitleaks/releases)
and make it available on `PATH`. Then run:

```sh
npm run check:quick
npm run check
npm run format
```

ESLint applies the recommended React Hooks and accessibility rules and the
complexity limit; Oxlint supplies TypeScript rules compatible with the project's
TypeScript 7 compiler. The quick check runs formatting, lint, complexity,
type/compile, secret scanning, unit-test, and 80% line-coverage gates without
browser end-to-end tests. The full check includes the end-to-end workflows.

## Local and offline use

After Node dependencies, Maven dependencies, and the Playwright browser are installed, the application and its artwork images are served locally. The runtime does not call external APIs or load remote fonts/images. Initial dependency installation may require internet access; preinstall dependencies before using the machine offline.

The main startup and reset scripts use Node and the Maven wrapper, so the documented commands are the same on Windows, macOS, and Linux. Platform-specific validation is still in progress.
