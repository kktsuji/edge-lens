import { useImageStore } from "../../../hooks/useImageStore";

export function LineProfileOverlay() {
  const { lineProfile, viewport } = useImageStore();

  if (!lineProfile) return null;

  const { zoom, panX, panY } = viewport;
  const { x1, y1, x2, y2 } = lineProfile;

  const sx1 = x1 * zoom + panX;
  const sy1 = y1 * zoom + panY;
  const sx2 = x2 * zoom + panX;
  const sy2 = y2 * zoom + panY;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      <line
        x1={sx1}
        y1={sy1}
        x2={sx2}
        y2={sy2}
        stroke="white"
        strokeWidth={2}
      />
      <line
        x1={sx1}
        y1={sy1}
        x2={sx2}
        y2={sy2}
        stroke="#f59e0b"
        strokeWidth={1.5}
      />
      <circle
        cx={sx1}
        cy={sy1}
        r={4}
        fill="#f59e0b"
        stroke="white"
        strokeWidth={1.5}
      />
      <circle
        cx={sx2}
        cy={sy2}
        r={4}
        fill="#f59e0b"
        stroke="white"
        strokeWidth={1.5}
      />
    </svg>
  );
}
