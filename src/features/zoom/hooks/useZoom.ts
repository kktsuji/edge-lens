import { useEffect, useRef, useCallback } from "react";
import { useImageStore } from "../../../hooks/useImageStore";
import {
  MIN_ZOOM,
  MAX_ZOOM,
  ZOOM_FACTOR,
  PINCH_SENSITIVITY,
} from "../constants";
import { getTouchDistance, getTouchMidpoint } from "../utils/touchGeometry";

export function useZoom(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const {
    image,
    viewport,
    toolMode,
    setViewport,
    setIsTouchPinching,
    refitKey,
  } = useImageStore();
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const toolModeRef = useRef(toolMode);
  toolModeRef.current = toolMode;

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
        const safeZoom = v.zoom || 1;
        const panX = cx - (cx - v.panX) * (newZoom / safeZoom);
        const panY = cy - (cy - v.panY) * (newZoom / safeZoom);

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
        const safeZoom = v.zoom || 1;
        const panX = cx - (cx - v.panX) * (newZoom / safeZoom);
        const panY = cy - (cy - v.panY) * (newZoom / safeZoom);

        setViewport({ zoom: newZoom, panX, panY });
      }
    },
    [setViewport],
  );

  // Pointer-based pan:
  // - Navigate mode: click-drag pans (mouse & touch)
  // - Any mode: Space+drag pans (keyboard shortcut override)
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
      isPanning = false;
      canvas.style.cursor = "";
    };

    const onWindowBlur = () => {
      isSpaceDown = false;
      isPanning = false;
      canvas.style.cursor = "";
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;

      const shouldPan = isSpaceDown || toolModeRef.current === "navigate";

      if (!shouldPan) return;

      // preventDefault suppresses text selection during drag. This is safe
      // because the pixel inspector reads from pointermove (hover), not from
      // pointerdown defaults.
      e.preventDefault();
      canvas.setPointerCapture(e.pointerId);
      isPanning = true;
      lastX = e.clientX;
      lastY = e.clientY;
      canvas.style.cursor = "grabbing";
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isPanning) return;
      const v = viewportRef.current;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      setViewport({ zoom: v.zoom, panX: v.panX + dx, panY: v.panY + dy });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0 || !isPanning) return;
      isPanning = false;
      canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = isSpaceDown ? "grab" : "";
    };

    const onPointerCancel = (e: PointerEvent) => {
      isPanning = false;
      canvas.releasePointerCapture(e.pointerId);
      canvas.style.cursor = isSpaceDown ? "grab" : "";
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onWindowBlur);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerCancel);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onWindowBlur);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerCancel);
      canvas.style.cursor = "";
    };
  }, [canvasRef, setViewport, image.imageBitmap, refitKey]);

  // Attach wheel listener (must use { passive: false } to preventDefault)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("wheel", handleWheel, { passive: false });
    return () => canvas.removeEventListener("wheel", handleWheel);
  }, [canvasRef, handleWheel, image.imageBitmap, refitKey]);

  // Touch pinch-to-zoom (two-finger gesture)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isPinching = false;
    let initialDistance = 0;
    let initialZoom = 1;
    let lastMidpoint = { x: 0, y: 0 };

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        isPinching = true;
        setIsTouchPinching(true);
        const t1 = e.touches[0]!;
        const t2 = e.touches[1]!;
        initialDistance = getTouchDistance(t1, t2);
        initialZoom = viewportRef.current.zoom;
        const rect = canvas.getBoundingClientRect();
        const mid = getTouchMidpoint(t1, t2);
        lastMidpoint = { x: mid.x - rect.left, y: mid.y - rect.top };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!isPinching || e.touches.length < 2) return;
      e.preventDefault();

      const t1 = e.touches[0]!;
      const t2 = e.touches[1]!;
      const newDistance = getTouchDistance(t1, t2);
      if (initialDistance === 0) return;
      const scaleFactor = newDistance / initialDistance;
      const newZoom = Math.min(
        MAX_ZOOM,
        Math.max(MIN_ZOOM, initialZoom * scaleFactor),
      );

      const rect = canvas.getBoundingClientRect();
      const mid = getTouchMidpoint(t1, t2);
      const cx = mid.x - rect.left;
      const cy = mid.y - rect.top;

      const v = viewportRef.current;

      // Zoom anchored at midpoint
      const safeZoom = v.zoom || 1;
      const panX = cx - (lastMidpoint.x - v.panX) * (newZoom / safeZoom);
      const panY = cy - (lastMidpoint.y - v.panY) * (newZoom / safeZoom);

      lastMidpoint = { x: cx, y: cy };
      setViewport({ zoom: newZoom, panX, panY });
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (isPinching && e.touches.length < 2) {
        isPinching = false;
        setIsTouchPinching(false);
      }
    };

    const onTouchCancel = () => {
      isPinching = false;
      setIsTouchPinching(false);
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", onTouchCancel);

    return () => {
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchCancel);
      setIsTouchPinching(false);
    };
  }, [canvasRef, setViewport, setIsTouchPinching, image.imageBitmap, refitKey]);
}
