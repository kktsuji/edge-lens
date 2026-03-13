import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
import { useImageStore, useHasGridImages } from "../../../hooks/useImageStore";

export function CloseButton() {
  const { t } = useTranslation();
  const { image, closeImage } = useImageStore();
  const hasGridImages = useHasGridImages();
  const disabled = !image.imageData && !hasGridImages;

  const closeLabel = t("toolbar.close");
  const label = disabled
    ? `${closeLabel} — ${t("toolbar.noImageToClose")}`
    : closeLabel;

  return (
    <span className="inline-flex" title={label}>
      <button
        data-testid="close-button"
        onClick={closeImage}
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
          <Icon>
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </Icon>
        </span>
      </button>
    </span>
  );
}
