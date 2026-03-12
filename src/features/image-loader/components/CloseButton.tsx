import { useTranslation } from "react-i18next";
import { useImageStore, useGridActions } from "../../../hooks/useImageStore";

export function CloseButton() {
  const { t } = useTranslation();
  const { image, closeImage } = useImageStore();
  const { gridState } = useGridActions();

  const hasGridImages =
    gridState.enabled && gridState.cells.some((c) => c.image.imageData);
  const disabled = !image.imageData && !hasGridImages;

  const closeLabel = t("toolbar.close");
  const label = disabled
    ? `${closeLabel} — ${t("toolbar.noImageToClose")}`
    : closeLabel;

  return (
    <span className="inline-flex" title={label}>
      <button
        data-testid="close-button"
        onClick={() => {
          if (disabled) return;
          closeImage();
        }}
        disabled={disabled}
        className={
          disabled
            ? "rounded bg-gray-700 px-2 py-1 text-sm text-gray-600 cursor-not-allowed sm:px-3 sm:py-1.5"
            : "rounded bg-gray-600 px-2 py-1 text-sm text-white hover:bg-gray-500 sm:px-3 sm:py-1.5"
        }
        aria-label={label}
      >
        <span className="hidden sm:inline">{t("toolbar.close")}</span>
        <span className="sm:hidden" aria-hidden="true">
          ✕
        </span>
      </button>
    </span>
  );
}
