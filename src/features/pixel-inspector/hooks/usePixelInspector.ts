import { useState, useEffect, useCallback, useRef } from "react";
import { useImageStore } from "../../../hooks/useImageStore";
import { screenToImage } from "../../../utils/coordinates";
import { getPixelAt } from "../../../utils/pixel";
import type { PixelInfo } from "../../../types";

export function usePixelInspector(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
): PixelInfo | null {
  const { image, viewport } = useImageStore();
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const imageDataRef = useRef(image.imageData);
  imageDataRef.current = image.imageData;

  const [pixelInfo, setPixelInfo] = useState<PixelInfo | null>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const imageData = imageDataRef.current;
      if (!imageData) {
        setPixelInfo(null);
        return;
      }

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;

      const { x, y } = screenToImage(screenX, screenY, viewportRef.current);
      const info = getPixelAt(imageData, x, y);
      setPixelInfo(info);
    },
    [canvasRef],
  );

  const handleMouseLeave = useCallback(() => {
    setPixelInfo(null);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [canvasRef, handleMouseMove, handleMouseLeave, image.imageBitmap]);

  return pixelInfo;
}
