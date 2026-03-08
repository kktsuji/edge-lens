import { useState, useEffect, useCallback, useRef } from "react";
import { useImageStore } from "../../../hooks/useImageStore";
import { screenToImage } from "../../../utils/coordinates";
import { getPixelAt } from "../../../utils/pixel";
import type { PixelInfo } from "../../../types";

const TAP_DISTANCE_THRESHOLD = 5;

export function usePixelInspector(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
): PixelInfo | null {
  const { image, viewport } = useImageStore();
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const imageDataRef = useRef(image.imageData);
  imageDataRef.current = image.imageData;

  const [pixelInfo, setPixelInfo] = useState<PixelInfo | null>(null);

  // Track touch start position for tap-to-inspect
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const readPixel = useCallback(
    (clientX: number, clientY: number) => {
      const imageData = imageDataRef.current;
      if (!imageData) {
        setPixelInfo(null);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = clientX - rect.left;
      const screenY = clientY - rect.top;
      const { x, y } = screenToImage(screenX, screenY, viewportRef.current);
      const info = getPixelAt(imageData, x, y);
      setPixelInfo(info);
    },
    [canvasRef],
  );

  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      // Only update on hover for non-touch (mouse/pen)
      if (e.pointerType === "touch") return;
      readPixel(e.clientX, e.clientY);
    },
    [readPixel],
  );

  const handlePointerLeave = useCallback(() => {
    setPixelInfo(null);
  }, []);

  const handlePointerDown = useCallback((e: PointerEvent) => {
    if (e.pointerType === "touch") {
      touchStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (e.pointerType !== "touch" || !touchStartRef.current) return;
      const dx = e.clientX - touchStartRef.current.x;
      const dy = e.clientY - touchStartRef.current.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      touchStartRef.current = null;

      if (dist < TAP_DISTANCE_THRESHOLD) {
        readPixel(e.clientX, e.clientY);
      }
    },
    [readPixel],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("pointerdown", handlePointerDown);
    canvas.addEventListener("pointerup", handlePointerUp);

    return () => {
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      canvas.removeEventListener("pointerup", handlePointerUp);
    };
  }, [
    canvasRef,
    handlePointerMove,
    handlePointerLeave,
    handlePointerDown,
    handlePointerUp,
    image.imageBitmap,
  ]);

  return pixelInfo;
}
