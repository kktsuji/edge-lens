import { useRef, useCallback, useState, type ChangeEvent } from "react";
import { useTranslation } from "react-i18next";
import { useImageStore } from "../../../hooks/useImageStore";
import { validateImageFile } from "../../../utils/validation";

export function FilePickerButton() {
  const { t } = useTranslation();
  const { loadImage } = useImageStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      setError(null);
      const file = e.target.files?.[0];
      if (!file) return;

      const result = validateImageFile(file);
      if (!result.valid) {
        setError(result.error!);
        // Reset input so the same file can be re-selected
        if (inputRef.current) inputRef.current.value = "";
        return;
      }

      try {
        await loadImage(file);
      } catch {
        setError("error.unsupportedFormat");
      }
      if (inputRef.current) inputRef.current.value = "";
    },
    [loadImage],
  );

  return (
    <>
      <button
        onClick={() => inputRef.current?.click()}
        className="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-500"
      >
        {t("toolbar.open")}
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
