import { useRef, useCallback, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { Icon } from "../../../components/Icon";
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
    [loadImage, inputRef],
  );

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center justify-center rounded bg-blue-600 px-2 py-1 text-sm text-white hover:bg-blue-500 sm:px-3 sm:py-1.5"
        title={t("toolbar.open")}
        aria-label={t("toolbar.open")}
      >
        <span className="hidden sm:inline">{t("toolbar.open")}</span>
        <span className="sm:hidden" aria-hidden="true">
          <Icon>
            <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          </Icon>
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
