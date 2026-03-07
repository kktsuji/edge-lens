import { useImageStore } from "../../../hooks/useImageStore";

export function RoiSelectionOverlay() {
  const { roiSelection, viewport } = useImageStore();

  if (!roiSelection || roiSelection.width === 0 || roiSelection.height === 0) {
    return null;
  }

  const { zoom, panX, panY } = viewport;
  const { x, y, width, height } = roiSelection;

  const screenX = x * zoom + panX;
  const screenY = y * zoom + panY;
  const screenW = width * zoom;
  const screenH = height * zoom;

  return (
    <svg className="pointer-events-none absolute inset-0 h-full w-full">
      <rect
        x={screenX}
        y={screenY}
        width={screenW}
        height={screenH}
        fill="rgba(59, 130, 246, 0.1)"
        stroke="white"
        strokeWidth={2}
      />
      <rect
        x={screenX}
        y={screenY}
        width={screenW}
        height={screenH}
        fill="none"
        stroke="#3b82f6"
        strokeWidth={1.5}
        strokeDasharray="6 3"
      />
    </svg>
  );
}
