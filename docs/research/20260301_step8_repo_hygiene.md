# Step 8 — Repository & Project Hygiene

## License

- **License**: MIT — no change
- `LICENSE` file already present in the repository root

## Contributing Guide

- **Add `CONTRIBUTING.md`** to the repository root
- Contents to cover:
  - Prerequisites (Node.js version, package manager)
  - Local dev setup (`npm install`, `npm run dev`)
  - Running tests (`npm run test`, `npm run test:e2e`)
  - Branch strategy: work on `develop`, PRs target `main`
  - Commit convention (see below)
  - PR checklist (lint, tests pass, Lighthouse not regressed)

## GitHub Issue Templates

- **Add both templates** under `.github/ISSUE_TEMPLATE/`
  - `bug_report.md` — steps to reproduce, expected vs actual behavior, browser/OS, screenshot
  - `feature_request.md` — problem statement, proposed solution, alternatives considered

## Commit Convention

- **Convention**: Conventional Commits (already in use)
- **Documentation location**: `CONTRIBUTING.md` only — no separate file, no tooling enforcement
- Types in use: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`
- Format: `<type>(<optional scope>): <description>`
- Examples:
  - `feat(histogram): add log scale toggle`
  - `fix(pixel-inspector): correct color value at canvas edge`
  - `docs: update CONTRIBUTING with commit convention`
