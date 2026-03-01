# EdgeLens: Requirements & Architecture Decision Guide

## Context

EdgeLens is a privacy-first, browser-based image analysis tool (client-side only, no backend).
The goal of this session is to define all decisions needed before writing a single line of code,
organized as a sequential TODO list. Hosting target: AWS S3 + CloudFront static site.

---

## Step-by-Step TODO

### STEP 1 — Define MVP Scope

Decide which features ship in v1 vs later phases. The README lists 10 features; building all at once is risky.

> Decision recorded in [20260301_step1_mvp_scope.md](./20260301_step1_mvp_scope.md)

- [x] Pick MVP features (e.g., Pixel Inspector + Zoom + Histogram as a core set)
- [x] Define "done" for each feature (acceptance criteria)
- [x] Decide image format support: JPEG, PNG only? Add WebP, TIFF, RAW?
- [x] Decide max image size to support (e.g., up to 50 MB?)
- [x] Decide mobile support level: full responsive, tablet only, or desktop-first?

---

### STEP 2 — Choose Frontend Stack

Impacts every file in the project. Decide once.

- [ ] **Framework**: Vanilla JS/TS vs React vs Vue vs Svelte
  - Vanilla is simplest for a tool app with no routing
  - React/Vue add DX ergonomics but bundle overhead
- [ ] **Language**: JavaScript vs TypeScript (TS recommended for a pixel-math-heavy tool)
- [ ] **Build tool**: Vite (recommended, fast, no config) vs webpack vs Parcel
- [ ] **CSS approach**: Plain CSS / CSS modules / Tailwind / a component library (e.g., shadcn)
- [ ] **Image processing libraries**:
  - Canvas API (built-in, zero dependency)
  - `exifr` for EXIF parsing
  - `quantize` or `color-thief` for palette extraction
  - Chart.js or D3 for histogram/line profile plots

---

### STEP 3 — Define Project Structure

Decide folder layout and module boundaries before creating files.

- [ ] Decide entry point: single `index.html` with JS modules, or multi-page?
- [ ] Define folder structure (e.g., `src/features/`, `src/components/`, `src/utils/`)
- [ ] Decide how features are loaded: all upfront, or lazy-loaded per feature tab?

---

### STEP 4 — Define Infrastructure Architecture

AWS decisions that affect cost, security, and deployment.

- [ ] **Domain name**: Choose a custom domain (e.g., `edge-lens.app`) or use CloudFront default URL?
- [ ] **SSL/TLS**: ACM certificate in `us-east-1` (required for CloudFront)
- [ ] **S3 bucket policy**: Block public access, use CloudFront OAC (Origin Access Control) — recommended
- [ ] **CloudFront settings**:
  - Cache policy: cache HTML short (e.g., 5 min), assets long (1 year with hash in filename)
  - Price class: All edges vs US/Europe only
  - Custom error responses: 404 → `/index.html` (needed for SPA routing if used)
- [ ] **IaC tool**: AWS CDK (TypeScript, recommended) vs Terraform vs manual Console

---

### STEP 5 — Define CI/CD Pipeline

Automate build and deploy from day one.

- [ ] **CI/CD platform**: GitHub Actions (already on GitHub, free for public repos)
- [ ] **Pipeline steps**: lint → test → build → deploy to S3 → invalidate CloudFront cache
- [ ] **Branch strategy**: deploy `main` to production, `develop` to staging (separate S3/CF stack)?
- [ ] **AWS credentials in CI**: Use OIDC (no long-lived keys) or IAM user + GitHub Secrets

---

### STEP 6 — Decide Testing Strategy

- [ ] **Unit tests**: Vitest (pairs with Vite) for pixel math / util functions
- [ ] **E2E tests**: Playwright for drag-drop upload and feature interactions
- [ ] **Coverage target**: Define a minimum threshold (e.g., 80% for core utils)

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
