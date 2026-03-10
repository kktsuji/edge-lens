import { useRef, useCallback, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useImageStore } from "../../../hooks/useImageStore";
import { handleFileSelection } from "../../../utils/validation";

interface FilePickerButtonProps {
  inputRef?: React.RefObject<HTMLInputElement | null>;
}

export function FilePickerButton({
  inputRef: externalInputRef,
}: FilePickerButtonProps = {}) {
  const { t } = useTranslation();
  const { loadImage } = useImageStore();
  const internalRef = useRef<HTMLInputElement>(null);
  const inputRef = externalInputRef ?? internalRef;
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      await handleFileSelection(file, loadImage, setError);
      if (inputRef.current) inputRef.current.value = "";
    },
    [loadImage],
  );

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className="rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-500 sm:px-3 sm:py-1.5"
        title={t("toolbar.open")}
        aria-label={t("toolbar.open")}
      >
        <span className="hidden sm:inline">{t("toolbar.open")}</span>
        <span className="sm:hidden" aria-hidden="true">
          📂
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleChange}
        className="hidden"
        aria-label={t("toolbar.open")}
      />
      {error && (
        <span role="alert" className="text-sm text-red-400">
          {t(error)}
        </span>
      )}
    </>
  );
}
