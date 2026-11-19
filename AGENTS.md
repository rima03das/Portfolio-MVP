# Portfolio repository guidance

- Before starting any change, read `docs/spec.md` first. It is the authoritative description of the product as it exists.
- Create a folder for each change at `docs/changes/<current branch name>/` with that change's `intent.md` and `plan.md`.
- Read only the current change's folder. Do not read other change folders unless the user explicitly asks.
- `docs/TECH_STACK.md` records the technology stack; `docs/status.md` tracks implementation and verification.
- Follow `docs/STANDARDS.md` when making changes.
- Review `docs/REVIEW.md` for review criteria, including code behavior not described by the product specification.
- Run `npm run check` before completing changes; use `npm run check:quick` for all checks except end-to-end tests, and `npm run format` to apply formatting.

Update `docs/status.md` when work changes implementation progress or verification results.
