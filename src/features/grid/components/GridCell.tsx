import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type DragEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useGridActions } from "../../../hooks/useImageStore";
import { useCanvas } from "../../../hooks/useCanvas";
import { useImageStore } from "../../../hooks/useImageStore";
import { useZoom } from "../../zoom/hooks/useZoom";
import { useRoiSelection } from "../../roi/hooks/useRoiSelection";
import { useLineProfile } from "../../line-profile/hooks/useLineProfile";
import { usePixelInspector } from "../../pixel-inspector/hooks/usePixelInspector";
import { RoiSelectionOverlay } from "../../roi/components/RoiSelectionOverlay";
import { LineProfileOverlay } from "../../line-profile/components/LineProfileOverlay";
import { validateImageFile } from "../../../utils/validation";
import { GridCellProvider } from "./GridCellProvider";
import { GridCellDropZone } from "./GridCellDropZone";

interface GridCellProps {
  cellId: string;
  isActive: boolean;
}

function GridCellContent({ cellId, isActive }: GridCellProps) {
  const { t } = useTranslation();
  const { image, viewport, toolMode } = useImageStore();
  const { setActiveCellId, setCellPixelInfo, loadImageToCell } =
    useGridActions();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const hasImage = !!image.imageData;
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const dragDepthRef = useRef(0);

  useCanvas(canvasRef);
  useZoom(canvasRef);
  useRoiSelection(canvasRef);
  useLineProfile(canvasRef);
  const pixelInfo = usePixelInspector(canvasRef);

  // Sync pixel info to grid state so the sidebar can read it
  useEffect(() => {
    setCellPixelInfo(cellId, pixelInfo);
  }, [cellId, pixelInfo, setCellPixelInfo]);

  const handleActivate = useCallback(() => {
    setActiveCellId(cellId);
  }, [cellId, setActiveCellId]);

  const handleDrop = useCallback(
    async (e: DragEvent<HTMLElement>) => {
      e.preventDefault();
      dragDepthRef.current = 0;
      setIsDraggingOver(false);
      const file = e.dataTransfer.files[0];
      if (!file) return;
      const result = validateImageFile(file);
      if (!result.valid) return;
      try {
        await loadImageToCell(cellId, file);
      } catch (err) {
        console.error("Failed to load image into grid cell:", err);
      }
    },
    [cellId, loadImageToCell],
  );

  const handleDragEnter = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingOver(true);
  }, []);

  const handleDragOver = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
  }, []);

  const handleDragLeave = useCallback((e: DragEvent<HTMLElement>) => {
    e.preventDefault();
    dragDepthRef.current -= 1;
    if (dragDepthRef.current <= 0) {
      dragDepthRef.current = 0;
      setIsDraggingOver(false);
    }
  }, []);

  return (
    <div
      data-cell-id={cellId}
      data-zoom={Math.round(viewport.zoom * 100)}
      className={`relative h-full w-full overflow-hidden ${
        isActive ? "ring-2 ring-blue-500" : ""
      }`}
      onMouseEnter={handleActivate}
      onPointerDown={handleActivate}
    >
      {hasImage ? (
        <div
          className="relative h-full w-full"
          onDrop={handleDrop}
          onDragEnter={handleDragEnter}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <canvas
            ref={canvasRef}
            className={`h-full w-full ${toolMode === "roi" || toolMode === "line-profile" ? "cursor-crosshair" : ""}`}
          />
          <RoiSelectionOverlay />
          <LineProfileOverlay />
          {isDraggingOver && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center border-2 border-dashed border-blue-400 bg-blue-400/20">
              <p className="text-sm font-medium text-blue-300">
                {t("grid.dropToReplace")}
              </p>
            </div>
          )}
        </div>
      ) : (
        <GridCellDropZone cellId={cellId} />
      )}
    </div>
  );
}

export function GridCell({ cellId, isActive }: GridCellProps) {
  return (
    <GridCellProvider cellId={cellId}>
      <GridCellContent cellId={cellId} isActive={isActive} />
    </GridCellProvider>
  );
}
