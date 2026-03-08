import { useEffect, useRef, useState } from "react";
import { computeInitialViewport } from "../utils/viewport";
import { useImageStore } from "./useImageStore";

export function useCanvas(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const { image, viewport, setViewportLocal } = useImageStore();
  const rafRef = useRef<number>(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Track which imageBitmap we last computed the initial viewport for,
  // so we only reset viewport on actual image changes — not container resizes.
  const lastFittedBitmapRef = useRef<ImageBitmap | null>(image.imageBitmap);

  // Track container size via ResizeObserver.
  // Depends on image.imageBitmap so the effect re-runs when the canvas
  // first mounts (it is conditionally rendered only when an image is loaded).
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const container = canvas.parentElement;
    if (!container) return;

    // Read the initial size synchronously so the first render already
    // has the correct dimensions (avoids a blank frame).
    const rect = container.getBoundingClientRect();
    setContainerSize((prev) => {
      if (prev.width === rect.width && prev.height === rect.height) return prev;
      return { width: rect.width, height: rect.height };
    });

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setContainerSize((prev) => {
        if (prev.width === width && prev.height === height) return prev;
        return { width, height };
      });
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, [canvasRef, image.imageBitmap]);

  // Set smart initial viewport when a NEW image is loaded.
  // Only fires when the imageBitmap reference actually changes (not on
  // container resizes), preventing sibling grid cells from resetting
  // each other's viewports.
  useEffect(() => {
    if (!image.imageBitmap) return;
    if (image.imageBitmap === lastFittedBitmapRef.current) return;

    const cw = containerSize.width;
    const ch = containerSize.height;
    if (!cw || !ch) return;

    lastFittedBitmapRef.current = image.imageBitmap;
    setViewportLocal(computeInitialViewport(image.width, image.height, cw, ch));
  }, [
    image.imageBitmap,
    image.width,
    image.height,
    containerSize.width,
    containerSize.height,
    setViewportLocal,
  ]);

  // Render image with zoom/pan transform
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    if (containerSize.width === 0 || containerSize.height === 0) return;

    cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      const dpr = window.devicePixelRatio || 1;

      // Sync canvas buffer with the tracked container size
      const bufW = Math.round(containerSize.width * dpr);
      const bufH = Math.round(containerSize.height * dpr);
      if (canvas.width !== bufW || canvas.height !== bufH) {
        canvas.width = bufW;
        canvas.height = bufH;
        canvas.style.width = `${containerSize.width}px`;
        canvas.style.height = `${containerSize.height}px`;
      }

      ctx.resetTransform();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      ctx.setTransform(
        viewport.zoom * dpr,
        0,
        0,
        viewport.zoom * dpr,
        viewport.panX * dpr,
        viewport.panY * dpr,
      );

      ctx.imageSmoothingEnabled = false;

      if (image.imageBitmap) {
        ctx.drawImage(image.imageBitmap, 0, 0);
      }
    });

    return () => cancelAnimationFrame(rafRef.current);
  }, [canvasRef, image.imageBitmap, viewport, containerSize]);
}
