# EdgeLens: Requirements & Architecture Decision Guide

## Context

EdgeLens is a privacy-first, browser-based image analysis tool (client-side only, no backend).
See the [project README](../../README.md) for features, privacy policy, and analytics details.
The goal of this session is to define all decisions needed before writing a single line of code,
organized as a sequential TODO list. Hosting target: AWS S3 + CloudFront static site.

---

## Step-by-Step TODO

### STEP 1 — Define MVP Scope

Decide which features ship in v1 vs later phases. The [README](../../README.md) lists 10 features; building all at once is risky.

> Decision recorded in [20260301_step1_mvp_scope.md](./20260301_step1_mvp_scope.md)

- [x] Pick MVP features (e.g., Pixel Inspector + Zoom + Histogram as a core set)
- [x] Define "done" for each feature (acceptance criteria)
- [x] Decide image format support: JPEG, PNG only? Add WebP, TIFF, RAW?
- [x] Decide max image size to support (e.g., up to 50 MB?)
- [x] Decide mobile support level: full responsive, tablet only, or desktop-first?

---

### STEP 2 — Choose Frontend Stack

Impacts every file in the project. Decide once.

- [x] **Framework**: React
- [x] **Language**: TypeScript
- [x] **Build tool**: Vite + `@vitejs/plugin-react-swc`
- [x] **CSS approach**: Tailwind CSS (shadcn/ui optional later)
- [x] **Image processing libraries**: Canvas API + `exifr` + `color-thief` + `Chart.js`

> Decision recorded in [20260301_step2_frontend_stack.md](./20260301_step2_frontend_stack.md)

---

### STEP 3 — Define Project Structure

Decide folder layout and module boundaries before creating files.

> Decision recorded in [20260301_step3_project_structure.md](./20260301_step3_project_structure.md)

- [x] Decide entry point: single `index.html` with JS modules, or multi-page?
- [x] Define folder structure (e.g., `src/features/`, `src/components/`, `src/utils/`)
- [x] Decide how features are loaded: all upfront, or lazy-loaded per feature tab?

---

### STEP 4 — Define Infrastructure Architecture

AWS decisions that affect cost, security, and deployment.

> Decision recorded in [20260301_step4_infrastructure_architecture.md](./20260301_step4_infrastructure_architecture.md)

- [x] **Domain name**: `edgelens.tech` (custom domain via AWS Amplify)
- [x] **SSL/TLS**: ACM certificate auto-provisioned by Amplify in `us-east-1`
- [x] **S3 bucket policy**: Managed by Amplify (private bucket + CloudFront OAC, no manual setup)
- [x] **CloudFront settings**: Managed by Amplify; cache invalidation triggered automatically on deploy
- [x] **IaC tool**: AWS Amplify — replaces CDK/Terraform; GitHub webhook deploys `main` on push

---

### STEP 5 — Define CI/CD Pipeline

Automate build and deploy from day one.

- [x] **CI/CD platform**: AWS Amplify built-in CI/CD (no GitHub Actions needed)
- [x] **Pipeline steps**: Amplify build → lint → test → build → deploy (configured via `amplify.yml`)
- [x] **Branch strategy**: `main` → production environment; `develop` → staging environment (both managed in Amplify console)
- [x] **AWS credentials in CI**: Managed by Amplify (no OIDC or IAM user secrets required)

> Decision recorded in [20260301_step5_cicd_pipeline.md](./20260301_step5_cicd_pipeline.md)

---

### STEP 6 — Decide Testing Strategy

> Decision recorded in [20260301_step6_testing_strategy.md](./20260301_step6_testing_strategy.md)

- [x] **Unit tests**: Vitest — `src/utils/` only (pixel math, color conversions, hooks)
- [x] **E2E tests**: Playwright — happy path + edge cases per feature; Chromium only in CI
- [x] **Coverage target**: 80% on `src/utils/`; no requirement on components or features

---

### STEP 7 — Define Non-Functional Requirements

- [ ] **Performance**: Target Lighthouse score (e.g., ≥90 Performance, ≥90 Accessibility)
- [ ] **Browser support**: Modern evergreen only (Chrome, Firefox, Safari, Edge latest 2)?
- [ ] **Accessibility**: WCAG 2.1 AA compliance target?
- [ ] **Analytics**: Privacy-friendly option (Plausible, Fathom) or none?
- [ ] **SEO**: Basic meta tags + Open Graph? Sitemap?
- [ ] **i18n**: English only for now, or structure for future localization?

---

### STEP 8 — Repository & Project Hygiene

- [ ] **License**: Already MIT — confirm it stays
- [ ] **Contributing guide**: Add `CONTRIBUTING.md`?
- [ ] **Issue templates**: Bug report / feature request templates in `.github/`?
- [ ] **Commit convention**: Conventional Commits (already in use from git log) — document it

---

## Recommended Decision Order

```
MVP scope → Stack → Project structure → Infra → CI/CD → Testing → NFRs → Repo hygiene
```

Decisions in the first half (steps 1–3) block everything else.
Decisions in steps 4–8 can be made in parallel once the stack is chosen.

---

## Key Files to Create (after decisions)

| File                           | Purpose                     |
| ------------------------------ | --------------------------- |
| `index.html`                   | App entry point             |
| `src/main.ts`                  | JS entry                    |
| `vite.config.ts`               | Build config                |
| `tsconfig.json`                | TS config                   |
| `package.json`                 | Dependencies                |
| `infra/`                       | CDK stack (S3 + CloudFront) |
| `.github/workflows/deploy.yml` | CI/CD pipeline              |
| `vitest.config.ts`             | Test config                 |
