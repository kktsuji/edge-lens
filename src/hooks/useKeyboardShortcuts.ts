import { useEffect, useRef } from "react";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_FACTOR } from "../features/zoom/constants";
import { useImageStore } from "./useImageStore";

export function useKeyboardShortcuts(
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  options: {
    onOpenFile: () => void;
    onCloseImage: () => void;
    isHelpOpen: boolean;
    onToggleHelp: () => void;
  },
) {
  const {
    image,
    viewport,
    toolMode,
    roiSelection,
    lineProfile,
    setViewport,
    setToolMode,
    setRoiSelection,
    setLineProfile,
  } = useImageStore();
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const imageRef = useRef(image);
  imageRef.current = image;

  const toolModeRef = useRef(toolMode);
  toolModeRef.current = toolMode;

  const drawOrderRef = useRef<Array<"roi" | "line-profile">>([]);

  useEffect(() => {
    if (roiSelection) {
      drawOrderRef.current = [
        ...drawOrderRef.current.filter((x) => x !== "roi"),
        "roi",
      ];
    } else {
      drawOrderRef.current = drawOrderRef.current.filter((x) => x !== "roi");
    }
  }, [roiSelection]);

  useEffect(() => {
    if (lineProfile) {
      drawOrderRef.current = [
        ...drawOrderRef.current.filter((x) => x !== "line-profile"),
        "line-profile",
      ];
    } else {
      drawOrderRef.current = drawOrderRef.current.filter(
        (x) => x !== "line-profile",
      );
    }
  }, [lineProfile]);

  const optionsRef = useRef(options);
  optionsRef.current = options;

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return;

      const opts = optionsRef.current;
      const canvas = canvasRef.current;
      const v = viewportRef.current;
      const img = imageRef.current;

      if (e.key === "?" && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        opts.onToggleHelp();
        return;
      }

      if (e.key === "Escape") {
        e.preventDefault();
        if (opts.isHelpOpen) {
          opts.onToggleHelp();
        } else if (drawOrderRef.current.length > 0) {
          const last = drawOrderRef.current.pop();
          if (!last) {
            return;
          }
          if (last === "roi") setRoiSelection(null);
          else setLineProfile(null);
        } else if (toolModeRef.current !== "navigate") {
          setToolMode("navigate");
        } else if (img.imageData) {
          opts.onCloseImage();
        }
        return;
      }

      if (e.ctrlKey && e.key === "o") {
        e.preventDefault();
        opts.onOpenFile();
        return;
      }

      if (
        (e.key === "r" || e.key === "R") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        if (img.imageData) {
          e.preventDefault();
          setToolMode("roi");
        }
        return;
      }

      if (
        (e.key === "l" || e.key === "L") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        if (img.imageData) {
          e.preventDefault();
          setToolMode("line-profile");
        }
        return;
      }

      if (
        (e.key === "n" || e.key === "N") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        if (img.imageData) {
          e.preventDefault();
          setToolMode("navigate");
        }
        return;
      }

      if (!canvas || !img.imageData) return;

      const cw = canvas.clientWidth;
      const ch = canvas.clientHeight;

      if (e.key === "+" || e.key === "=") {
        e.preventDefault();
        const cx = cw / 2;
        const cy = ch / 2;
        const newZoom = Math.min(MAX_ZOOM, v.zoom * ZOOM_FACTOR);
        setViewport({
          zoom: newZoom,
          panX: cx - (cx - v.panX) * (newZoom / v.zoom),
          panY: cy - (cy - v.panY) * (newZoom / v.zoom),
        });
        return;
      }

      if (e.key === "-") {
        e.preventDefault();
        const cx = cw / 2;
        const cy = ch / 2;
        const newZoom = Math.max(MIN_ZOOM, v.zoom / ZOOM_FACTOR);
        setViewport({
          zoom: newZoom,
          panX: cx - (cx - v.panX) * (newZoom / v.zoom),
          panY: cy - (cy - v.panY) * (newZoom / v.zoom),
        });
        return;
      }

      if (e.key === "0") {
        e.preventDefault();
        const zoom = Math.min(cw / img.width, ch / img.height);
        setViewport({
          zoom,
          panX: (cw - img.width * zoom) / 2,
          panY: (ch - img.height * zoom) / 2,
        });
        return;
      }

      if (e.key === "1") {
        e.preventDefault();
        setViewport({
          zoom: 1,
          panX: (cw - img.width) / 2,
          panY: (ch - img.height) / 2,
        });
        return;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [canvasRef, setViewport, setToolMode, setRoiSelection, setLineProfile]);
}
