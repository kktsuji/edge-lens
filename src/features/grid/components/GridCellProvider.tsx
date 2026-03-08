import type { ReactNode } from "react";
import { GridCellContext } from "../../../hooks/useImageStore";
import { useGridCellProvider } from "../hooks/useGridCellProvider";

interface GridCellProviderProps {
  cellId: string;
  children: ReactNode;
}

export function GridCellProvider({ cellId, children }: GridCellProviderProps) {
  const cellValue = useGridCellProvider(cellId);

  return (
    <GridCellContext.Provider value={cellValue}>
      {children}
    </GridCellContext.Provider>
  );
}
