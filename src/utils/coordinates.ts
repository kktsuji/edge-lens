import type { ViewportState } from "../types";

export function screenToImage(
  screenX: number,
  screenY: number,
  viewport: ViewportState,
): { x: number; y: number } {
  return {
    x: (screenX - viewport.panX) / viewport.zoom,
    y: (screenY - viewport.panY) / viewport.zoom,
  };
}
