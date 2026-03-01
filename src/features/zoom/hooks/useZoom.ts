import { useEffect, useRef, useCallback } from "react";
import { useImageStore } from "../../../hooks/useImageStore";

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 50;
const ZOOM_FACTOR = 1.1;

export function useZoom(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const { image, viewport, setViewport } = useImageStore();
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  // Wheel zoom — cursor-anchored
  const handleWheel = useCallback(
    (e: WheelEvent) => {
      e.preventDefault();
      const v = viewportRef.current;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;

      const direction = e.deltaY < 0 ? 1 : -1;
      const factor = direction > 0 ? ZOOM_FACTOR : 1 / ZOOM_FACTOR;
      const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, v.zoom * factor));

      // Keep the pixel under cursor fixed
      const panX = cx - (cx - v.panX) * (newZoom / v.zoom);
      const panY = cy - (cy - v.panY) * (newZoom / v.zoom);

      setViewport({ zoom: newZoom, panX, panY });
    },
    [setViewport],
  );

  // Middle-button pan
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isPanning = false;
    let lastX = 0;
    let lastY = 0;

    const onMouseDown = (e: MouseEvent) => {
      // Middle button
      if (e.button === 1) {
        e.preventDefault();
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
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
      if (e.button === 1) {
        isPanning = false;
      }
    };

    // Prevent autoscroll icon on middle-click
    const onAuxClick = (e: MouseEvent) => {
      if (e.button === 1) e.preventDefault();
    };

    canvas.addEventListener("mousedown", onMouseDown);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    canvas.addEventListener("auxclick", onAuxClick);

    return () => {
      canvas.removeEventListener("mousedown", onMouseDown);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      canvas.removeEventListener("auxclick", onAuxClick);
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
