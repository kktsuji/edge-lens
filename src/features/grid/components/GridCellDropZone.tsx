import {
  useCallback,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import { useTranslation } from "react-i18next";
import { useGridActions } from "../../../hooks/useImageStore";
import { handleFileSelection } from "../../../utils/validation";

interface GridCellDropZoneProps {
  cellId: string;
}

export function GridCellDropZone({ cellId }: GridCellDropZoneProps) {
  const { t } = useTranslation();
  const { loadImageToCell } = useGridActions();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadFile = useCallback(
    (file: File) => loadImageToCell(cellId, file),
    [cellId, loadImageToCell],
  );

  const handleFile = useCallback(
    async (file: File) => {
      await handleFileSelection(file, loadFile, setError);
    },
    [loadFile],
  );

  const handleDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) await handleFile(file);
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

  const handleFileInputChange = useCallback(
    async (e: ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) await handleFile(file);
      if (fileInputRef.current) fileInputRef.current.value = "";
    },
    [handleFile],
  );

  return (
    <div
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      className={`flex h-full flex-col items-center justify-center gap-2 border-2 border-dashed transition-colors ${
        isDragging
          ? "border-blue-400 bg-blue-400/10"
          : "border-gray-600 bg-transparent"
      }`}
    >
      <p className="text-sm text-gray-300">{t("grid.dropMessage")}</p>
      <button
        onClick={() => fileInputRef.current?.click()}
        className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-500"
      >
        {t("toolbar.open")}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png"
        onChange={handleFileInputChange}
        className="hidden"
        aria-label={t("toolbar.open")}
      />
      <p className="text-xs text-gray-400">{t("dropzone.formats")}</p>
      {error && (
        <p role="alert" className="text-xs text-red-400">
          {t(error)}
        </p>
      )}
    </div>
  );
}
