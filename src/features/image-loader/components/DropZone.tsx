import { useState, useCallback, type DragEvent } from "react";
import { useTranslation } from "react-i18next";
import { useImageStore } from "../../../hooks/useImageStore";
import { validateImageFile } from "../../../utils/validation";

export function DropZone() {
  const { t } = useTranslation();
  const { loadImage } = useImageStore();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      const result = validateImageFile(file);
      if (!result.valid) {
        setError(result.error!);
        return;
      }
      try {
        await loadImage(file);
      } catch {
        setError("error.unsupportedFormat");
      }
    },
    [loadImage],
  );

  const handleDrop = useCallback(
    (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile],
  );

  const handleDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex h-full flex-col items-center justify-center gap-4 border-2 border-dashed transition-colors ${
        isDragging
          ? "border-blue-400 bg-blue-400/10"
          : "border-gray-600 bg-transparent"
      }`}
    >
      <p className="text-lg text-gray-300">{t("dropzone.title")}</p>
      <p className="text-sm text-gray-500">{t("dropzone.subtitle")}</p>
      <p className="text-xs text-gray-600">{t("dropzone.formats")}</p>
      {error && (
        <p role="alert" className="text-sm text-red-400">
          {t(error)}
        </p>
      )}
    </div>
  );
}
