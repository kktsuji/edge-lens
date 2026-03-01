# EdgeLens: Frontend Stack (STEP 2)

## Decisions

| Decision             | Choice                            |
| -------------------- | --------------------------------- |
| **Framework**        | React                             |
| **Language**         | TypeScript                        |
| **Build tool**       | Vite + `@vitejs/plugin-react-swc` |
| **CSS approach**     | Tailwind CSS                      |
| **Image processing** | Canvas API                        |
| **EXIF parsing**     | `exifr`                           |
| **Color palette**    | `color-thief`                     |
| **Chart rendering**  | `Chart.js`                        |

## Rationale

- **React**: Best scalability for 10+ features that share state (selected image, current tool, zoom level, ROI selection). Component isolation makes adding post-MVP features straightforward.
- **TypeScript**: Essential for a pixel-math-heavy tool; strong typing catches errors in channel index arithmetic and coordinate math.
- **Vite + SWC**: Fastest dev server and HMR via native ES modules; SWC transforms are faster than Babel for a TS-heavy codebase; pairs naturally with Vitest (STEP 6).
- **Tailwind CSS**: Most popular CSS approach in the React ecosystem; consistent spacing/color system suits a multi-panel tool UI; shadcn/ui can be layered on top later for pre-built primitives (sliders, tabs, dialogs).
- **Canvas API**: Covers all current features natively (`getImageData`, `imageSmoothingEnabled = false`, `drawImage`). No additional image processing library needed for MVP or post-MVP features as currently defined.
- **exifr**: Lightweight (~30 KB), excellent browser support, purpose-built for EXIF parsing.
- **color-thief**: Simple, purpose-built for dominant color extraction.
- **Chart.js**: Simpler API than D3; sufficient for histogram and line profile plots.

## Deferred

- **OpenCV.js**: Not needed for any current feature. Revisit only if advanced processing (edge detection, filtering, feature matching) is added.
- **shadcn/ui**: Can be added on top of Tailwind later without conflict.
