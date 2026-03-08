import { useGridActions } from "../../../hooks/useImageStore";
import type { GridCellState } from "../../../types";

export function useActiveCellData(): GridCellState | null {
  const { gridState } = useGridActions();
  if (!gridState.enabled || !gridState.activeCellId) return null;
  return gridState.cells.find((c) => c.id === gridState.activeCellId) ?? null;
}
