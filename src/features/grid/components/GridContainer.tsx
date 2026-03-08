import { useGridActions } from "../../../hooks/useImageStore";
import { useMediaQuery } from "../../../hooks/useMediaQuery";
import { GridCell } from "./GridCell";

export function GridContainer() {
  const { gridState } = useGridActions();
  const { layout, cells, activeCellId } = gridState;
  const isMd = useMediaQuery("(min-width: 768px)");

  const visibleCells = isMd ? cells : cells.slice(0, 1);

  return (
    <div
      className="grid h-full w-full gap-px bg-gray-700"
      style={{
        gridTemplateColumns: `repeat(${isMd ? layout.cols : 1}, 1fr)`,
        gridTemplateRows: `repeat(${isMd ? layout.rows : 1}, 1fr)`,
      }}
    >
      {visibleCells.map((cell) => (
        <div key={cell.id} className="min-h-0 min-w-0 bg-gray-900">
          <GridCell cellId={cell.id} isActive={cell.id === activeCellId} />
        </div>
      ))}
    </div>
  );
}
