import { useEffect, useRef } from "react";
import { useImageStore } from "../../../hooks/useImageStore";
import { clipLineToRect, screenToImage } from "../../../utils/coordinates";

export function useLineProfile(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const {
    toolMode,
    viewport,
    image,
    isTouchPinching,
    refitKey,
    setLineProfile,
  } = useImageStore();

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
    let rawStartX = 0;
    let rawStartY = 0;
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

      const img = imageRef.current;
      if (img.width <= 0 || img.height <= 0) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const imgPos = screenToImage(screenX, screenY, viewportRef.current);

      isDragging = true;
      rawStartX = imgPos.x;
      rawStartY = imgPos.y;
      // Single point — clip to image bounds for initial display
      const clipped = clipLineToRect(
        imgPos.x,
        imgPos.y,
        imgPos.x,
        imgPos.y,
        0,
        0,
        img.width - 1,
        img.height - 1,
      );
      if (clipped) setLineProfile(clipped);
      canvas.setPointerCapture(e.pointerId);
      e.preventDefault();
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;

      const img = imageRef.current;
      if (img.width <= 0 || img.height <= 0) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const imgPos = screenToImage(screenX, screenY, viewportRef.current);

      const clipped = clipLineToRect(
        rawStartX,
        rawStartY,
        imgPos.x,
        imgPos.y,
        0,
        0,
        img.width - 1,
        img.height - 1,
      );
      if (clipped) setLineProfile(clipped);
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
  }, [
    canvasRef,
    setLineProfile,
    image.imageBitmap,
    image.width,
    image.height,
    refitKey,
  ]);
}
