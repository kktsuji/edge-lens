import { useTranslation } from "react-i18next";
import type { ExifData } from "../../../types";

function formatExposureTime(n: number): string {
  if (!Number.isFinite(n) || n <= 0) {
    return "-";
  }
  if (n >= 1) return `${n} s`;
  return `1/${Math.round(1 / n)} s`;
}

function formatFNumber(n: number): string {
  return `f/${n}`;
}

function formatFocalLength(n: number): string {
  return `${n} mm`;
}

function formatDate(d: Date): string {
  return d.toLocaleString();
}

interface ExifPanelProps {
  exifData: ExifData | null;
}

interface ExifRow {
  labelKey: string;
  value: string;
}

export function ExifPanel({ exifData }: ExifPanelProps) {
  const { t } = useTranslation();

  const rows: ExifRow[] = [];

  if (exifData) {
    if (exifData.make != null)
      rows.push({ labelKey: "exif.make", value: exifData.make });
    if (exifData.model != null)
      rows.push({ labelKey: "exif.model", value: exifData.model });
    if (exifData.lens != null)
      rows.push({ labelKey: "exif.lens", value: exifData.lens });
    if (exifData.exposureTime != null)
      rows.push({
        labelKey: "exif.exposureTime",
        value: formatExposureTime(exifData.exposureTime),
      });
    if (exifData.fNumber != null)
      rows.push({
        labelKey: "exif.fNumber",
        value: formatFNumber(exifData.fNumber),
      });
    if (exifData.iso != null)
      rows.push({ labelKey: "exif.iso", value: String(exifData.iso) });
    if (exifData.focalLength != null)
      rows.push({
        labelKey: "exif.focalLength",
        value: formatFocalLength(exifData.focalLength),
      });
    if (exifData.dateTimeOriginal != null)
      rows.push({
        labelKey: "exif.dateTimeOriginal",
        value: formatDate(exifData.dateTimeOriginal),
      });
    if (exifData.software != null)
      rows.push({ labelKey: "exif.software", value: exifData.software });
    if (exifData.orientation != null)
      rows.push({
        labelKey: "exif.orientation",
        value: String(exifData.orientation),
      });
    if (exifData.colorSpace != null)
      rows.push({
        labelKey: "exif.colorSpace",
        value: String(exifData.colorSpace),
      });
  }

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        {t("exif.title")}
      </h2>
      {!exifData ? (
        <p className="text-xs text-gray-500">{t("exif.placeholder")}</p>
      ) : rows.length === 0 ? (
        <p className="text-xs text-gray-500">{t("exif.noExif")}</p>
      ) : (
        <div className="space-y-1 text-xs text-gray-400">
          {rows.map(({ labelKey, value }) => (
            <div key={labelKey} className="flex justify-between gap-2">
              <span className="shrink-0 text-gray-500">{t(labelKey)}</span>
              <span className="truncate text-right">{value}</span>
            </div>
          ))}
          {exifData.hasGps && (
            <div className="mt-1">
              <span className="rounded bg-green-800/50 px-1.5 py-0.5 text-[10px] text-green-400">
                {t("exif.gpsPresent")}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
