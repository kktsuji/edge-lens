import { useTranslation } from "react-i18next";
import { useGridActions } from "../../../hooks/useImageStore";

export function ActiveCellIndicator() {
  const { t } = useTranslation();
  const { gridState } = useGridActions();

  if (!gridState.enabled || !gridState.activeCellId) return null;

  const parts = gridState.activeCellId.split("-");
  const row = Number(parts[0] ?? 0) + 1;
  const col = Number(parts[1] ?? 0) + 1;

  return (
    <div className="flex items-center gap-2 rounded bg-gray-700 px-2 py-1 text-xs text-gray-300">
      <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
      <span>
        {t("grid.activeCell")} [{row}, {col}]
      </span>
    </div>
  );
}
