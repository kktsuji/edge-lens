# Contributing to EdgeLens

Thank you for your interest in contributing to EdgeLens!

## Prerequisites

- **Node.js** ≥ 20
- **npm** ≥ 10

## Local Development Setup

```bash
git clone https://github.com/kktsuji/edge-lens.git
cd edge-lens
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`.

## Running Tests

```bash
npm run test          # Unit tests (single run)
npm run test:watch    # Unit tests (watch mode)
npm run test:coverage # Unit tests with coverage report
npm run test:e2e      # Playwright end-to-end tests
```

## Linting & Formatting

```bash
npm run lint    # ESLint + Prettier check
npm run format  # Auto-format with Prettier
```

## Branch Strategy

- `main` — production branch, deployed to `edgelens.tech`
- `develop` — staging branch, deployed to `dev.edgelens.tech`
- Feature branches branch off `develop` and PR back into `develop`

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<optional scope>): <description>
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `ci`

**Examples:**

- `feat(histogram): add log scale toggle`
- `fix(pixel-inspector): correct color value at canvas edge`
- `docs: update CONTRIBUTING with commit convention`

## Pull Request Checklist

- [ ] `npm run lint` passes
- [ ] `npm run test` passes
- [ ] Lighthouse scores not regressed
- [ ] PR description explains the change
