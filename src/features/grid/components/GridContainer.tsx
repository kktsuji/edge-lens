import { useGridActions } from "../../../hooks/useImageStore";
import { GridCell } from "./GridCell";

export function GridContainer() {
  const { gridState } = useGridActions();
  const { layout, cells, activeCellId } = gridState;

  return (
    <div
      className="grid h-full w-full gap-px bg-gray-700"
      style={{
        gridTemplateColumns: `repeat(${layout.cols}, 1fr)`,
        gridTemplateRows: `repeat(${layout.rows}, 1fr)`,
      }}
    >
      {cells.map((cell, index) => (
        <div
          key={cell.id}
          className={`bg-gray-900 ${index === 0 ? "block" : "hidden md:block"}`}
        >
          <GridCell cellId={cell.id} isActive={cell.id === activeCellId} />
        </div>
      ))}
    </div>
  );
}
