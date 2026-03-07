# Step 7 — Non-Functional Requirements

## Performance

- **Lighthouse target**: ≥90 on all four categories — Performance, Accessibility, Best Practices, SEO
- Measured on production build via Lighthouse CI or manual audit in Chrome DevTools

## Browser Support

- **Target**: Latest 2 versions of evergreen browsers — Chrome, Firefox, Safari, Edge
- No IE, no legacy mobile browsers
- Browserslist entry: `"last 2 Chrome versions, last 2 Firefox versions, last 2 Safari versions, last 2 Edge versions"`

## Accessibility

- **Target**: WCAG 2.1 AA compliance
- Enforced by: axe-core in E2E tests (Playwright `@axe-core/playwright`), manual keyboard-navigation review, Lighthouse Accessibility score ≥90

## Analytics

- **Tool**: Google Analytics 4 (GA4)
- **Implication**: GA4 uses cookies → a cookie consent banner is required for GDPR compliance
- Consent banner should load GA4 only after user accepts; no tracking before consent

## SEO

- **Scope**: Basic meta tags + Open Graph tags
  - `<title>`, `<meta name="description">`, `og:title`, `og:description`, `og:image`, `og:url`
- No sitemap or structured data at launch

## i18n

- **Now**: English only — all UI strings hardcoded in English
- **Structure**: Use `i18next` + `react-i18next` from day one so adding languages later requires no refactor
- Translation files live in `src/locales/{lang}/translation.json`
- Default locale: `en`; no locale switching UI at launch (infrastructure only)
