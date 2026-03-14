import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { useGridActions } from "../../../hooks/useImageStore";

export function LockToggleButton() {
  const { t } = useTranslation();
  const { gridState, setGridPositionLocked } = useGridActions();

  const disabled = !gridState.enabled;

  const className = disabled
    ? "text-gray-600 cursor-not-allowed"
    : gridState.positionLocked
      ? "bg-blue-600 text-white"
      : "text-gray-400 hover:bg-gray-700 hover:text-white";

  const lockLabel = gridState.positionLocked
    ? t("grid.unlock")
    : t("grid.lock");
  const label = disabled
    ? `${lockLabel} — ${t("grid.enableGridFirst")}`
    : `${lockLabel} (K)`;

  return (
    <span className="hidden md:inline-flex" title={label}>
      <button
        onClick={() => setGridPositionLocked(!gridState.positionLocked)}
        disabled={disabled}
        aria-label={label}
        aria-pressed={disabled ? undefined : gridState.positionLocked}
        className={`inline-flex items-center justify-center min-h-8 min-w-8 rounded px-1 py-0.5 text-sm transition-colors sm:min-h-10 sm:min-w-10 sm:px-2 sm:py-1 ${className}`}
      >
        <Icon>
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
        </Icon>
      </button>
    </span>
  );
}
