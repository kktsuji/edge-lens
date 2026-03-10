import type { ViewportState } from "../types";

/**
 * Computes the initial viewport when an image is first opened.
 *
 * - If the image fits inside the container, display it at 100% zoom,
 *   centered (equivalent to pressing key `1`).
 * - If the image is larger than the container, scale it down to fit,
 *   centered (equivalent to pressing key `0`).
 */
export function computeInitialViewport(
  imageWidth: number,
  imageHeight: number,
  containerWidth: number,
  containerHeight: number,
): ViewportState {
  if (
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    containerWidth <= 0 ||
    containerHeight <= 0
  ) {
    return { zoom: 1, panX: 0, panY: 0 };
  }

  const fitsInContainer =
    imageWidth <= containerWidth && imageHeight <= containerHeight;

  if (fitsInContainer) {
    return {
      zoom: 1,
      panX: (containerWidth - imageWidth) / 2,
      panY: (containerHeight - imageHeight) / 2,
    };
  }

  const zoom = Math.min(
    containerWidth / imageWidth,
    containerHeight / imageHeight,
  );
  return {
    zoom,
    panX: (containerWidth - imageWidth * zoom) / 2,
    panY: (containerHeight - imageHeight * zoom) / 2,
  };
}
