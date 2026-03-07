import { useEffect, useRef } from "react";
import { useImageStore } from "../../../hooks/useImageStore";
import { screenToImage } from "../../../utils/coordinates";

export function useLineProfile(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const { toolMode, viewport, image, setLineProfile } = useImageStore();

  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const toolModeRef = useRef(toolMode);
  toolModeRef.current = toolMode;

  const imageRef = useRef(image);
  imageRef.current = image;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let isDragging = false;
    let startImgX = 0;
    let startImgY = 0;
    let isSpaceDown = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") isSpaceDown = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") isSpaceDown = false;
    };

    const onMouseDown = (e: MouseEvent) => {
      if (
        e.button !== 0 ||
        toolModeRef.current !== "line-profile" ||
        isSpaceDown
      )
        return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const imgPos = screenToImage(screenX, screenY, viewportRef.current);

      isDragging = true;
      startImgX = imgPos.x;
      startImgY = imgPos.y;
      setLineProfile({
        x1: imgPos.x,
        y1: imgPos.y,
        x2: imgPos.x,
        y2: imgPos.y,
      });
      e.preventDefault();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const imgPos = screenToImage(screenX, screenY, viewportRef.current);

      const img = imageRef.current;
      const x2 = Math.max(0, Math.min(img.width, imgPos.x));
      const y2 = Math.max(0, Math.min(img.height, imgPos.y));

      setLineProfile({
        x1: startImgX,
        y1: startImgY,
        x2,
        y2,
      });
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button !== 0 || !isDragging) return;
      isDragging = false;
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
    };
  }, [canvasRef, setLineProfile, image.imageBitmap]);
}
