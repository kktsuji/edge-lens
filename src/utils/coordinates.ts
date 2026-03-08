import type { ViewportState } from "../types";

export function screenToImage(
  screenX: number,
  screenY: number,
  viewport: ViewportState,
): { x: number; y: number } {
  const zoom = viewport.zoom || 1;
  return {
    x: (screenX - viewport.panX) / zoom,
    y: (screenY - viewport.panY) / zoom,
  };
}

/**
 * Liang-Barsky line clipping against a rectangle [xmin, xmax] x [ymin, ymax].
 * Returns the clipped segment, or null if the line is entirely outside.
 */
export function clipLineToRect(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  xmin: number,
  ymin: number,
  xmax: number,
  ymax: number,
): { x1: number; y1: number; x2: number; y2: number } | null {
  const dx = x2 - x1;
  const dy = y2 - y1;

  const edges = [
    { p: -dx, q: x1 - xmin },
    { p: dx, q: xmax - x1 },
    { p: -dy, q: y1 - ymin },
    { p: dy, q: ymax - y1 },
  ];

  let t0 = 0;
  let t1 = 1;

  const EPSILON = 1e-10;

  for (const { p, q } of edges) {
    if (Math.abs(p) < EPSILON) {
      if (q < -EPSILON) return null;
    } else {
      const t = q / p;
      if (p < 0) {
        t0 = Math.max(t0, t);
      } else {
        t1 = Math.min(t1, t);
      }
      if (t0 > t1) return null;
    }
  }

  return {
    x1: x1 + t0 * dx,
    y1: y1 + t0 * dy,
    x2: x1 + t1 * dx,
    y2: y1 + t1 * dy,
  };
}
