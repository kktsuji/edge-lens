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

We follow [GitHub Flow](https://docs.github.com/en/get-started/using-github/github-flow):

- `main` — always deployable, deployed to `edgelens.tech`
- All branches are created from `main` and PR back into `main`
- Use the following naming convention for branches:

| Prefix      | Use                                         |
| ----------- | ------------------------------------------- |
| `feat/`     | New features                                |
| `fix/`      | Bug fixes                                   |
| `docs/`     | Documentation only                          |
| `refactor/` | Code restructuring without behaviour change |
| `test/`     | Adding or updating tests                    |
| `ci/`       | CI/CD configuration                         |
| `chore/`    | Maintenance tasks                           |

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

## Pull Request Guidelines

- Keep PRs focused on a single concern; split large or unrelated changes into separate PRs
- Do not include unrelated refactors or formatting changes — open a dedicated PR for those instead

## Pull Request Checklist

- [ ] Branch follows the naming convention (e.g. `feat/`, `fix/`)
- [ ] PR is focused on a single concern with no unrelated changes
- [ ] Linked issue or context provided (`closes #N` or explanation in description)
- [ ] `npm run lint` passes (no lint errors)
- [ ] `npm run test` passes (all unit tests pass)
- [ ] `npm run build` succeeds
- [ ] Lighthouse scores not regressed
- [ ] PR description explains the change
- [ ] All AI code review comments are resolved before merging
- [ ] @kktsuji is added as a reviewer
