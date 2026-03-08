import { useTranslation } from "react-i18next";
import { useImageStore, useGridActions } from "../../../hooks/useImageStore";

export function CloseButton() {
  const { t } = useTranslation();
  const { image, closeImage } = useImageStore();
  const { gridState } = useGridActions();

  const hasGridImages =
    gridState.enabled && gridState.cells.some((c) => c.image.imageData);
  if (!image.imageData && !hasGridImages) return null;

  return (
    <button
      onClick={closeImage}
      className="rounded bg-gray-600 px-2 py-1 text-sm text-white hover:bg-gray-500 sm:px-3 sm:py-1.5"
      title={t("toolbar.close")}
      aria-label={t("toolbar.close")}
    >
      <span className="hidden sm:inline">{t("toolbar.close")}</span>
      <span className="sm:hidden" aria-hidden="true">
        ✕
      </span>
    </button>
  );
}
