import { useEffect, useRef } from "react";
import { useImageStore } from "../../../hooks/useImageStore";
import { screenToImage } from "../../../utils/coordinates";

export function useRoiSelection(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
) {
  const {
    toolMode,
    viewport,
    image,
    isTouchPinching,
    refitKey,
    setRoiSelection,
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
    let startImgX = 0;
    let startImgY = 0;
    let isSpaceDown = false;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === " ") isSpaceDown = true;
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === " ") isSpaceDown = false;
    };

    const onWindowBlur = () => {
      isSpaceDown = false;
      isDragging = false;
    };

    const onPointerCancel = () => {
      isDragging = false;
    };

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0 || toolModeRef.current !== "roi") return;
      if (isTouchPinchingRef.current) return;
      // For mouse, require no space key; for touch, skip space check
      if (e.pointerType !== "touch" && isSpaceDown) return;

      const img = imageRef.current;
      if (img.width <= 0 || img.height <= 0) return;

      const rect = canvas.getBoundingClientRect();
      const screenX = e.clientX - rect.left;
      const screenY = e.clientY - rect.top;
      const imgPos = screenToImage(screenX, screenY, viewportRef.current);

      isDragging = true;
      startImgX = Math.max(0, Math.min(img.width, imgPos.x));
      startImgY = Math.max(0, Math.min(img.height, imgPos.y));
      setRoiSelection({ x: startImgX, y: startImgY, width: 0, height: 0 });
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
      const x = Math.max(0, Math.min(startImgX, imgPos.x));
      const y = Math.max(0, Math.min(startImgY, imgPos.y));
      const x2 = Math.max(
        0,
        Math.min(img.width, Math.max(startImgX, imgPos.x)),
      );
      const y2 = Math.max(
        0,
        Math.min(img.height, Math.max(startImgY, imgPos.y)),
      );

      setRoiSelection({ x, y, width: x2 - x, height: y2 - y });
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button !== 0 || !isDragging) return;
      isDragging = false;
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
    };
  }, [
    canvasRef,
    setRoiSelection,
    image.imageBitmap,
    // refitKey forces listener re-registration when the canvas DOM element
    // changes (e.g. grid↔single transitions). canvasRef identity is stable so
    // it alone cannot trigger re-attachment.
    refitKey,
  ]);
}
