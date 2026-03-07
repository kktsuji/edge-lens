import { useImageStore } from "../../../hooks/useImageStore";

export function RoiSelectionOverlay() {
  const { roiSelection, viewport } = useImageStore();

  if (!roiSelection) {
    return null;
  }

  const { zoom, panX, panY } = viewport;
  const { x, y, width, height } = roiSelection;

  const normalizedWidth = Math.abs(width);
  const normalizedHeight = Math.abs(height);

  if (normalizedWidth === 0 || normalizedHeight === 0) {
    return null;
  }

  const originX = width >= 0 ? x : x + width;
  const originY = height >= 0 ? y : y + height;

  const screenX = originX * zoom + panX;
  const screenY = originY * zoom + panY;
  const screenW = normalizedWidth * zoom;
  const screenH = normalizedHeight * zoom;

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
