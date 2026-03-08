import { useEffect, useRef } from "react";
import { useImageStore } from "../../../hooks/useImageStore";
import { screenToImage } from "../../../utils/coordinates";

export function useLineProfile(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const { toolMode, viewport, image, isTouchPinching, setLineProfile } =
    useImageStore();

  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const toolModeRef = useRef(toolMode);
  toolModeRef.current = toolMode;

  const imageRef = useRef(image);
  imageRef.current = image;

  const isTouchPinchingRef = useRef(isTouchPinching);
  isTouchPinchingRef.current = isTouchPinching;

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

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || toolModeRef.current !== "line-profile") return;
      if (isTouchPinchingRef.current) return;
      if (e.pointerType !== "touch" && isSpaceDown) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const imgPos = screenToImage(screenX, screenY, viewportRef.current);
      const img = imageRef.current;
      const x1 = Math.max(0, Math.min(img.width - 1, imgPos.x));
      const y1 = Math.max(0, Math.min(img.height - 1, imgPos.y));

      isDragging = true;
      startImgX = x1;
      startImgY = y1;
      setLineProfile({
        x1,
        y1,
        x2: x1,
        y2: y1,
      });
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const imgPos = screenToImage(screenX, screenY, viewportRef.current);

      const img = imageRef.current;
      const x2 = Math.max(0, Math.min(img.width - 1, imgPos.x));
      const y2 = Math.max(0, Math.min(img.height - 1, imgPos.y));

      setLineProfile({
        x1: startImgX,
        y1: startImgY,
        x2,
        y2,
      });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0 || !isDragging) return;
      isDragging = false;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerup", onPointerUp);
    };
  }, [canvasRef, setLineProfile, image.imageBitmap]);
}
