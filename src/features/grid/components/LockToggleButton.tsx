import { useTranslation } from "react-i18next";
import { useGridActions } from "../../../hooks/useImageStore";

export function LockToggleButton() {
  const { t } = useTranslation();
  const { gridState, setGridPositionLocked } = useGridActions();

  if (!gridState.enabled) return null;

  return (
    <button
      onClick={() => setGridPositionLocked(!gridState.positionLocked)}
      title={`${gridState.positionLocked ? t("grid.unlock") : t("grid.lock")} (K)`}
      aria-label={`${gridState.positionLocked ? t("grid.unlock") : t("grid.lock")} (K)`}
      aria-pressed={gridState.positionLocked}
      className={`hidden min-h-8 min-w-8 items-center justify-center rounded px-1 py-0.5 text-sm transition-colors sm:min-h-10 sm:min-w-10 sm:px-2 sm:py-1 md:inline-flex ${
        gridState.positionLocked
          ? "bg-blue-600 text-white"
          : "text-gray-400 hover:bg-gray-700 hover:text-white"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        {gridState.positionLocked ? (
          <>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </>
        ) : (
          <>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 9.9-1" />
          </>
        )}
      </svg>
    </button>
  );
}
