import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useGridActions } from "../../../hooks/useImageStore";

interface GridLayoutSelectorProps {
  onClose: () => void;
}

const PRESETS = [
  { rows: 1, cols: 1, label: "1 x 1" },
  { rows: 1, cols: 2, label: "1 x 2" },
  { rows: 2, cols: 1, label: "2 x 1" },
  { rows: 2, cols: 2, label: "2 x 2" },
  { rows: 3, cols: 2, label: "3 x 2" },
  { rows: 2, cols: 3, label: "2 x 3" },
] as const;

export function GridLayoutSelector({ onClose }: GridLayoutSelectorProps) {
  const { t } = useTranslation();
  const { gridState, setGridLayout } = useGridActions();
  const [customRows, setCustomRows] = useState(gridState.layout.rows);
  const [customCols, setCustomCols] = useState(gridState.layout.cols);

  const handlePreset = (rows: number, cols: number) => {
    setGridLayout({ rows, cols });
    onClose();
  };

  const handleCustomApply = () => {
    if (
      !Number.isFinite(customRows) ||
      !Number.isInteger(customRows) ||
      !Number.isFinite(customCols) ||
      !Number.isInteger(customCols)
    ) {
      return;
    }
    setGridLayout({ rows: customRows, cols: customCols });
    onClose();
  };

  return (
    <div className="min-w-40 rounded border border-gray-600 bg-gray-800 p-2 shadow-lg">
      <p className="mb-1 text-xs font-medium text-gray-400">
        {t("grid.layout")}
      </p>
      {PRESETS.map(({ rows, cols, label }) => {
        const isActive = gridState.enabled
          ? gridState.layout.rows === rows && gridState.layout.cols === cols
          : rows === 1 && cols === 1;
        return (
          <button
            key={label}
            onClick={() => handlePreset(rows, cols)}
            className={`block w-full rounded px-2 py-1 text-left text-sm ${
              isActive
                ? "bg-blue-600 text-white"
                : "text-gray-200 hover:bg-gray-700"
            }`}
          >
            {label}
          </button>
        );
      })}
      <div className="mt-2 border-t border-gray-600 pt-2">
        <p className="mb-1 text-xs font-medium text-gray-400">
          {t("grid.customLayout")}
        </p>
        <div className="flex items-center gap-1">
          <input
            type="number"
            min={1}
            max={4}
            step={1}
            value={customRows}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) return;
              setCustomRows(Math.max(1, Math.min(4, n)));
            }}
            className="w-12 rounded border border-gray-600 bg-gray-700 px-1 py-0.5 text-center text-sm text-white"
            aria-label={t("grid.rows")}
          />
          <span className="text-xs text-gray-400">x</span>
          <input
            type="number"
            min={1}
            max={4}
            step={1}
            value={customCols}
            onChange={(e) => {
              const n = Number(e.target.value);
              if (!Number.isFinite(n)) return;
              setCustomCols(Math.max(1, Math.min(4, n)));
            }}
            className="w-12 rounded border border-gray-600 bg-gray-700 px-1 py-0.5 text-center text-sm text-white"
            aria-label={t("grid.columns")}
          />
          <button
            onClick={handleCustomApply}
            className="rounded bg-blue-600 px-2 py-0.5 text-xs text-white hover:bg-blue-500"
          >
            {t("grid.ok")}
          </button>
        </div>
      </div>
    </div>
  );
}
