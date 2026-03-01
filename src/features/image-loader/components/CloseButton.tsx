import { useTranslation } from "react-i18next";
import { useImageStore } from "../../../hooks/useImageStore";

export function CloseButton() {
  const { t } = useTranslation();
  const { image, closeImage } = useImageStore();

  if (!image.imageData) return null;

  return (
    <button
      onClick={closeImage}
      className="rounded bg-gray-600 px-3 py-1.5 text-sm text-white hover:bg-gray-500"
    >
      {t("toolbar.close")}
    </button>
  );
}
