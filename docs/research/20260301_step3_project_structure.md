# EdgeLens: Project Structure (STEP 3)

## Decisions

| Decision            | Choice                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **Entry point**     | Single `index.html` (SPA)                                                                  |
| **Folder layout**   | Feature-first: `src/features/<name>/` + shared `components/`, `hooks/`, `utils/`, `types/` |
| **Feature loading** | Eager for always-visible tools; `React.lazy` + `Suspense` for panel-based features         |

## Folder Structure

```
edge-lens/
├── index.html
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── vitest.config.ts
├── package.json
└── src/
    ├── main.tsx              # Vite entry
    ├── App.tsx               # Root layout, feature tabs
    ├── features/
    │   ├── image-loader/     # drag-drop, file picker, 50 MB guard
    │   ├── zoom/             # wheel zoom, middle-mouse pan
    │   ├── pixel-inspector/  # hover → RGBA + coordinates
    │   └── histogram/        # Chart.js R/G/B/luminance
    ├── components/           # shared UI (toolbar, panel wrappers)
    ├── hooks/                # shared hooks (useCanvas, useImageStore)
    ├── utils/                # pure functions (pixel math, color convert)
    └── types/                # shared TS interfaces (ImageState, etc.)
```

## Rationale

- **Single `index.html`**: All features share the same loaded image and state (zoom level, pixel coordinates, ROI). A multi-page app would require re-loading the image on every navigation.
- **Feature-first folders**: Each `features/<name>/` owns its own components, hooks, and types. Adding post-MVP features (EXIF, Color Palette, etc.) means adding a new folder — no restructuring required.
- **Lazy loading**: `Chart.js`, `exifr`, and `color-thief` are non-trivial bundles. Loading them only when the user opens that panel keeps initial paint fast. `image-loader` and `pixel-inspector` load eagerly as they are always visible.
