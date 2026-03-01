# EdgeLens: Testing Strategy (STEP 6)

## Decisions

| Decision                | Choice                                           |
| ----------------------- | ------------------------------------------------ |
| **Unit test framework** | Vitest — `src/utils/` only                       |
| **E2E framework**       | Playwright — happy path + edge cases per feature |
| **E2E browser in CI**   | Chromium only                                    |
| **Coverage target**     | 80% on `src/utils/`                              |

## Unit Tests (Vitest)

**Scope**: Pure functions in `src/utils/` (pixel math, color conversions) and logic in `src/hooks/`.

**Out of scope**: Canvas API interactions (mock-heavy, low ROI) and React component rendering (covered by E2E).

## E2E Tests (Playwright)

**Must cover**:

- Drag-drop upload
- File picker upload
- 50 MB guard (reject oversized file)
- Pixel inspector hover showing correct RGBA values and coordinates
- Histogram rendering (R, G, B, luminance channels)
- Zoom in/out with mouse wheel

**Browser matrix**: Chromium only in CI. Firefox/WebKit optional for local checks post-MVP.

## Coverage Target

80% line coverage on `src/utils/`. No coverage requirement on components or features.
