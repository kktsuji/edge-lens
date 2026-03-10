import { useCallback, useContext, useMemo, useRef } from "react";
import type { ImageStoreContextValue } from "../../../hooks/useImageStore";
import {
  ImageStoreContext,
  useGridActions,
} from "../../../hooks/useImageStore";
import type {
  ImageState,
  LineProfile,
  RoiSelection,
  ViewportState,
} from "../../../types";
import { clipLineToRect } from "../../../utils/coordinates";

const emptyImage: ImageState = {
  file: null,
  name: "",
  width: 0,
  height: 0,
  imageData: null,
  imageBitmap: null,
};

const emptyViewport: ViewportState = { zoom: 1, panX: 0, panY: 0 };

export function useGridCellProvider(cellId: string): ImageStoreContextValue {
  const globalStore = useContext(ImageStoreContext);
  if (!globalStore) {
    throw new Error(
      "useGridCellProvider must be used within ImageStoreProvider",
    );
  }
  const {
    gridState,
    updateCellViewport,
    updateAllCellViewports,
    loadImageToCell,
    closeCellImage,
    setCellRoiSelection,
    setCellLineProfile,
    setAllCellsRoiSelection,
    setAllCellsLineProfile,
  } = useGridActions();

  const cell = gridState.cells.find((c) => c.id === cellId);

  const image = useMemo(() => cell?.image ?? emptyImage, [cell?.image]);

  const viewport = useMemo(
    () => cell?.viewport ?? emptyViewport,
    [cell?.viewport],
  );

  const roiSelection = cell?.roiSelection ?? null;
  const lineProfile = cell?.lineProfile ?? null;

  // Use refs so callbacks have stable references and don't cause
  // useCanvas / useZoom effects to re-run on every grid state change.
  const gridStateRef = useRef(gridState);
  gridStateRef.current = gridState;

  // Fix #4: ref for viewport so setZoom/setPan always read latest value
  const viewportRef = useRef(viewport);
  viewportRef.current = viewport;

  const setViewport = useCallback(
    (vp: ViewportState) => {
      const gs = gridStateRef.current;
      if (gs.positionLocked) {
        const currentVp = gs.cells.find((c) => c.id === cellId)?.viewport;
        if (currentVp) {
          const zoomRatio = vp.zoom / (currentVp.zoom || 1);
          const panDeltaX = vp.panX - currentVp.panX;
          const panDeltaY = vp.panY - currentVp.panY;
          updateAllCellViewports((prev) => ({
            zoom: prev.zoom * zoomRatio,
            panX: prev.panX + panDeltaX,
            panY: prev.panY + panDeltaY,
          }));
          return;
        }
      }
      updateCellViewport(cellId, vp);
    },
    [cellId, updateCellViewport, updateAllCellViewports],
  );

  // setViewportLocal always targets only this cell, bypassing lock mode.
  // Used by useCanvas for initial fit-to-screen so loading an image in
  // one cell doesn't reset other cells' viewports.
  const setViewportLocal = useCallback(
    (vp: ViewportState) => {
      updateCellViewport(cellId, vp);
    },
    [cellId, updateCellViewport],
  );

  const setZoom = useCallback(
    (zoom: number) => {
      setViewport({ ...viewportRef.current, zoom });
    },
    [setViewport],
  );

  const setPan = useCallback(
    (panX: number, panY: number) => {
      setViewport({ ...viewportRef.current, panX, panY });
    },
    [setViewport],
  );

  const loadImage = useCallback(
    async (file: File) => {
      await loadImageToCell(cellId, file);
    },
    [cellId, loadImageToCell],
  );

  const closeImage = useCallback(() => {
    closeCellImage(cellId);
  }, [cellId, closeCellImage]);

  const setRoiSelection = useCallback(
    (roi: RoiSelection | null) => {
      const gs = gridStateRef.current;
      if (gs.positionLocked) {
        if (roi === null) {
          setAllCellsRoiSelection(null);
          return;
        }
        // Convert ROI from source cell's image coords to screen coords,
        // then map to each cell's image coords so overlays appear at the
        // same screen position across all cells.
        const sourceCell = gs.cells.find((c) => c.id === cellId);
        const sourceVp = sourceCell?.viewport;
        if (
          !sourceVp ||
          !sourceCell?.image.width ||
          !sourceCell?.image.height
        ) {
          setCellRoiSelection(cellId, roi);
          return;
        }
        const sx = roi.x * sourceVp.zoom + sourceVp.panX;
        const sy = roi.y * sourceVp.zoom + sourceVp.panY;
        const sw = roi.width * sourceVp.zoom;
        const sh = roi.height * sourceVp.zoom;
        setAllCellsRoiSelection((c) => {
          const imgW = c.image.width;
          const imgH = c.image.height;
          if (!imgW || !imgH) return null;

          const rawX = (sx - c.viewport.panX) / c.viewport.zoom;
          const rawY = (sy - c.viewport.panY) / c.viewport.zoom;
          const rawW = sw / c.viewport.zoom;
          const rawH = sh / c.viewport.zoom;

          const x1 = Math.max(0, Math.min(imgW, rawX));
          const y1 = Math.max(0, Math.min(imgH, rawY));
          const x2 = Math.max(0, Math.min(imgW, rawX + rawW));
          const y2 = Math.max(0, Math.min(imgH, rawY + rawH));

          const w = x2 - x1;
          const h = y2 - y1;
          if (w <= 0 || h <= 0) return null;

          return { x: x1, y: y1, width: w, height: h };
        });
      } else {
        setCellRoiSelection(cellId, roi);
      }
    },
    [cellId, setCellRoiSelection, setAllCellsRoiSelection],
  );

  const setLineProfile = useCallback(
    (lp: LineProfile | null) => {
      const gs = gridStateRef.current;
      if (gs.positionLocked) {
        if (lp === null) {
          setAllCellsLineProfile(null);
          return;
        }
        const sourceCell = gs.cells.find((c) => c.id === cellId);
        const sourceVp = sourceCell?.viewport;
        if (
          !sourceVp ||
          !sourceCell?.image.width ||
          !sourceCell?.image.height
        ) {
          setCellLineProfile(cellId, lp);
          return;
        }
        // Convert line endpoints to screen coords, then to each cell's image coords
        const sx1 = lp.x1 * sourceVp.zoom + sourceVp.panX;
        const sy1 = lp.y1 * sourceVp.zoom + sourceVp.panY;
        const sx2 = lp.x2 * sourceVp.zoom + sourceVp.panX;
        const sy2 = lp.y2 * sourceVp.zoom + sourceVp.panY;
        setAllCellsLineProfile((c) => {
          const imgW = c.image.width;
          const imgH = c.image.height;
          if (!imgW || !imgH) return null;

          const rawX1 = (sx1 - c.viewport.panX) / c.viewport.zoom;
          const rawY1 = (sy1 - c.viewport.panY) / c.viewport.zoom;
          const rawX2 = (sx2 - c.viewport.panX) / c.viewport.zoom;
          const rawY2 = (sy2 - c.viewport.panY) / c.viewport.zoom;

          return clipLineToRect(
            rawX1,
            rawY1,
            rawX2,
            rawY2,
            0,
            0,
            imgW - 1,
            imgH - 1,
          );
        });
      } else {
        setCellLineProfile(cellId, lp);
      }
    },
    [cellId, setCellLineProfile, setAllCellsLineProfile],
  );

  return {
    image,
    viewport,
    toolMode: globalStore.toolMode,
    roiSelection,
    lineProfile,
    isTouchPinching: globalStore.isTouchPinching,
    refitKey: gridState.layoutVersion,
    loadImage,
    closeImage,
    setZoom,
    setPan,
    setViewport,
    setViewportLocal,
    setToolMode: globalStore.setToolMode,
    setRoiSelection,
    setLineProfile,
    setIsTouchPinching: globalStore.setIsTouchPinching,
  };
}
