import { useEffect, useRef, useCallback } from "react";
import { useImageStore } from "../../../hooks/useImageStore";
import {
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_FACTOR,
  PINCH_SENSITIVITY,
} from "../constants";

export function useZoom(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const { image, viewport, setViewport } = useImageStore();
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  // Wheel/trackpad handler — cursor-anchored zoom and two-finger pan
  //
  // WheelEvent detection strategy for Mac trackpad vs mouse wheel:
  //
  // 1. ctrlKey === true  → pinch-to-zoom gesture (macOS fires ctrlKey on pinch).
  //    Uses continuous Math.exp scaling instead of fixed steps for smooth feel.
  //
  // 2. ctrlKey === false && |deltaX| > 1  → trackpad two-finger scroll with a
  //    horizontal component. Standard mouse wheels rarely produce deltaX, though
  //    tilt wheels and Shift+scroll can. We use a small threshold to filter
  //    noise and accept this as a known tradeoff for reliable trackpad panning.
  //
  // 3. ctrlKey === false && deltaX === 0  → traditional mouse wheel (or pure
  //    vertical trackpad scroll, which is treated the same). Keeps existing
  //    step-based zoom behavior unchanged.
  //
  // Deliberate tradeoff: pure vertical trackpad scroll (deltaX === 0) zooms
  // instead of panning. Using a deltaY magnitude threshold to detect trackpad
  // would risk breaking high-resolution mice; we prefer safety.
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const v = viewportRef.current;

      // Normalize deltas to pixels based on deltaMode
      const modeScale =
        e.deltaMode === WheelEvent.DOM_DELTA_LINE
          ? 16
          : e.deltaMode === WheelEvent.DOM_DELTA_PAGE
            ? 100
            : 1;
      const deltaX = e.deltaX * modeScale;
      const deltaY = e.deltaY * modeScale;

      if (e.ctrlKey) {
        // Case 1: Pinch-to-zoom — smooth continuous scaling
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        const factor = Math.exp(-deltaY * PINCH_SENSITIVITY);
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor));

        // Keep the pixel under cursor fixed
        const panX = cx - (cx - v.panX) * (newZoom / v.zoom);
        const panY = cy - (cy - v.panY) * (newZoom / v.zoom);

        setViewport({ zoom: newZoom, panX, panY });
      } else if (Math.abs(deltaX) > 1) {
        // Case 2: Trackpad two-finger scroll with horizontal component — pan
        setViewport({
          zoom: v.zoom,
          panX: v.panX - deltaX,
          panY: v.panY - deltaY,
        });
      } else {
        // Case 3: Mouse wheel (or pure vertical trackpad scroll) — step zoom
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const cx = e.clientX - rect.left;
        const cy = e.clientY - rect.top;

        const direction = deltaY < 0 ? 1 : -1;
        const factor = direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor));

        // Keep the pixel under cursor fixed
        const panX = cx - (cx - v.panX) * (newZoom / v.zoom);
        const panY = cy - (cy - v.panY) * (newZoom / v.zoom);

        setViewport({ zoom: newZoom, panX, panY });
      }
    },
    [setViewport],
  );

  // Space+left drag pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isSpaceDown = false;
    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== " ") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;
      e.preventDefault();
      isSpaceDown = true;
      canvas.style.cursor = "grab";
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key !== " ") return;
      isSpaceDown = false;
      if (isPanning) isPanning = false;
      canvas.style.cursor = "";
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button === 0 && isSpaceDown) {
        e.preventDefault();
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        canvas.style.cursor = "grabbing";
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isPanning) return;
      const v = viewportRef.current;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      setViewport({ zoom: v.zoom, panX: v.panX + dx, panY: v.panY + dy });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0 && isPanning) {
        isPanning = false;
        canvas.style.cursor = isSpaceDown ? "grab" : "";
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.style.cursor = "";
    };
  }, [canvasRef, setViewport, image.imageBitmap]);

  // Attach wheel listener (must use { passive: false } to preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [canvasRef, handleWheel, image.imageBitmap]);
}
