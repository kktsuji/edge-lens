# EdgeLens: MVP Scope (v1)

## Features

| Feature         | Acceptance Criteria                                                                       |
| --------------- | ----------------------------------------------------------------------------------------- |
| Image Loading   | Open via file picker or drag-and-drop (JPEG, PNG); close the image; max 50 MB per file    |
| Zoom            | Mouse wheel to zoom; middle mouse button drag to pan _(desktop/mouse only)_               |
| Histogram       | Always show all four channels (R, G, B, luminance); channel selection is post-MVP         |
| Pixel Inspector | Hover to display actual image pixel coordinates and RGBA values, regardless of zoom level |

## Out of Scope (post-MVP)

- Grid View
- Line Profile
- ROI Statistics
- EXIF Metadata Viewer
- Color Palette Extraction
- Image Stats (mean, median, std dev)
- Histogram channel selection checkbox

## Open Items

- Image format support beyond JPEG and PNG (WebP, TIFF, RAW) — post-MVP
- Maximum supported image size — 50 MB (pixel count limit to be defined if needed post-MVP)
- Mobile / trackpad support for pan — post-MVP (middle mouse button only in v1)
