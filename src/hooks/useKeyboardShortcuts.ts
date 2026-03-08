import { useEffect, useRef } from "react";
import { MIN_ZOOM, MAX_ZOOM, ZOOM_FACTOR } from "../features/zoom/constants";
import type { ViewportState } from "../types";
import { useImageStore, useGridActions } from "./useImageStore";

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
  const {
    gridState,
    setGridEnabled,
    setGridPositionLocked,
    updateCellViewport,
    updateAllCellViewports,
    updateCellViewportsBatch,
    setCellRoiSelection,
    setCellLineProfile,
    setAllCellsRoiSelection,
    setAllCellsLineProfile,
  } = useGridActions();
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

  // Clear draw order when switching between single/grid mode
  const prevGridEnabled = useRef(gridState.enabled);
  if (prevGridEnabled.current !== gridState.enabled) {
    drawOrderRef.current = [];
    prevGridEnabled.current = gridState.enabled;
  }

  const gridStateRef = useRef(gridState);
  gridStateRef.current = gridState;

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
        } else if (gridStateRef.current.enabled) {
          // Fix #5: In grid mode, check active cell's ROI/line-profile
          const gs = gridStateRef.current;
          const activeCell = gs.activeCellId
            ? gs.cells.find((c) => c.id === gs.activeCellId)
            : null;
          if (gs.activeCellId && activeCell?.lineProfile) {
            if (gs.positionLocked) {
              setAllCellsLineProfile(null);
            } else {
              setCellLineProfile(gs.activeCellId, null);
            }
          } else if (gs.activeCellId && activeCell?.roiSelection) {
            if (gs.positionLocked) {
              setAllCellsRoiSelection(null);
            } else {
              setCellRoiSelection(gs.activeCellId, null);
            }
          } else if (toolModeRef.current !== "navigate") {
            setToolMode("navigate");
          } else {
            setGridEnabled(false);
          }
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

      const hasContent = img.imageData || gridStateRef.current.enabled;

      if (
        (e.key === "r" || e.key === "R") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        if (hasContent) {
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
        if (hasContent) {
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
        if (hasContent) {
          e.preventDefault();
          setToolMode("navigate");
        }
        return;
      }

      if (
        (e.key === "g" || e.key === "G") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        // Only toggle grid on md+ screens
        if (window.innerWidth >= 768) {
          e.preventDefault();
          setGridEnabled(!gridStateRef.current.enabled);
        }
        return;
      }

      if (
        (e.key === "k" || e.key === "K") &&
        !e.ctrlKey &&
        !e.metaKey &&
        !e.altKey
      ) {
        if (gridStateRef.current.enabled) {
          e.preventDefault();
          setGridPositionLocked(!gridStateRef.current.positionLocked);
        }
        return;
      }

      // --- Zoom / fit shortcuts ---
      // In grid mode, apply to all cells (locked) or active cell (unlocked).
      // In single mode, apply to the single canvas.
      const gs = gridStateRef.current;
      if (gs.enabled) {
        // Find the active cell's canvas by querying the DOM
        const activeCell = gs.activeCellId
          ? gs.cells.find((c) => c.id === gs.activeCellId)
          : null;
        if (!activeCell?.image.imageData) return;

        if (!gs.activeCellId) return;
        const activeCellEl = document.querySelector(
          `[data-cell-id="${gs.activeCellId}"] canvas`,
        ) as HTMLCanvasElement | null;
        if (!activeCellEl) return;

        const cw = activeCellEl.clientWidth;
        const ch = activeCellEl.clientHeight;
        const cellVp = activeCell.viewport;
        const cellImg = activeCell.image;

        const applyZoom = (
          newVp: (
            prev: typeof cellVp,
            pcw: number,
            pch: number,
          ) => typeof cellVp,
        ) => {
          if (gs.positionLocked) {
            updateAllCellViewports((prev) => newVp(prev, cw, ch));
          } else {
            updateCellViewport(gs.activeCellId!, newVp(cellVp, cw, ch));
          }
        };

        if (e.key === "+" || e.key === "=") {
          e.preventDefault();
          applyZoom((prev, pcw, pch) => {
            const cx = pcw / 2;
            const cy = pch / 2;
            const nz = Math.min(MAX_ZOOM, prev.zoom * ZOOM_FACTOR);
            return {
              zoom: nz,
              panX: cx - (cx - prev.panX) * (nz / prev.zoom),
              panY: cy - (cy - prev.panY) * (nz / prev.zoom),
            };
          });
          return;
        }

        if (e.key === "-") {
          e.preventDefault();
          applyZoom((prev, pcw, pch) => {
            const cx = pcw / 2;
            const cy = pch / 2;
            const nz = Math.max(MIN_ZOOM, prev.zoom / ZOOM_FACTOR);
            return {
              zoom: nz,
              panX: cx - (cx - prev.panX) * (nz / prev.zoom),
              panY: cy - (cy - prev.panY) * (nz / prev.zoom),
            };
          });
          return;
        }

        if (e.key === "0") {
          e.preventDefault();
          if (gs.positionLocked) {
            // Fit each cell's image to its own container independently
            const updates = new Map<string, ViewportState>();
            for (const c of gs.cells) {
              if (!c.image.imageData) continue;
              const el = document.querySelector(
                `[data-cell-id="${c.id}"] canvas`,
              ) as HTMLCanvasElement | null;
              if (!el) continue;
              const w = el.clientWidth;
              const h = el.clientHeight;
              const zoom = Math.min(w / c.image.width, h / c.image.height);
              updates.set(c.id, {
                zoom,
                panX: (w - c.image.width * zoom) / 2,
                panY: (h - c.image.height * zoom) / 2,
              });
            }
            updateCellViewportsBatch(updates);
          } else {
            const zoom = Math.min(cw / cellImg.width, ch / cellImg.height);
            updateCellViewport(gs.activeCellId!, {
              zoom,
              panX: (cw - cellImg.width * zoom) / 2,
              panY: (ch - cellImg.height * zoom) / 2,
            });
          }
          return;
        }

        if (e.key === "1") {
          e.preventDefault();
          if (gs.positionLocked) {
            // Show each cell's image at 100% centered independently
            const updates = new Map<string, ViewportState>();
            for (const c of gs.cells) {
              if (!c.image.imageData) continue;
              const el = document.querySelector(
                `[data-cell-id="${c.id}"] canvas`,
              ) as HTMLCanvasElement | null;
              if (!el) continue;
              const w = el.clientWidth;
              const h = el.clientHeight;
              updates.set(c.id, {
                zoom: 1,
                panX: (w - c.image.width) / 2,
                panY: (h - c.image.height) / 2,
              });
            }
            updateCellViewportsBatch(updates);
          } else {
            updateCellViewport(gs.activeCellId!, {
              zoom: 1,
              panX: (cw - cellImg.width) / 2,
              panY: (ch - cellImg.height) / 2,
            });
          }
          return;
        }

        return;
      }

      // Single-view mode
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
  }, [
    canvasRef,
    setViewport,
    setToolMode,
    setRoiSelection,
    setLineProfile,
    setGridEnabled,
    setGridPositionLocked,
    updateCellViewport,
    updateAllCellViewports,
    updateCellViewportsBatch,
    setCellRoiSelection,
    setCellLineProfile,
    setAllCellsRoiSelection,
    setAllCellsLineProfile,
  ]);
}
