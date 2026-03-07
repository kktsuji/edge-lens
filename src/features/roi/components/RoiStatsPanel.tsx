import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useImageStore } from "../../../hooks/useImageStore";
import {
  computeImageStats,
  computeRoiHistogram,
} from "../../../utils/histogram";

export function RoiStatsPanel() {
  const { t } = useTranslation();
  const { roiSelection, image } = useImageStore();

  const stats = useMemo(() => {
    if (
      !roiSelection ||
      !image.imageData ||
      // useRoiSelection always produces width/height >= 0 (never negative),
      // so this guard only excludes a zero-size ROI (click without drag).
      roiSelection.width <= 0 ||
      roiSelection.height <= 0
    ) {
      return null;
    }
    return computeImageStats(
      computeRoiHistogram(image.imageData, roiSelection),
    );
  }, [roiSelection, image.imageData]);

  if (!roiSelection || !stats) return null;

  // Compute pixel counts using the same floor/ceil bounds as computeRoiHistogram
  // so the displayed size always matches what is actually analysed.
  const x0 = Math.max(0, Math.floor(roiSelection.x));
  const y0 = Math.max(0, Math.floor(roiSelection.y));
  const x1 = Math.min(
    image.width,
    Math.ceil(roiSelection.x + roiSelection.width),
  );
  const y1 = Math.min(
    image.height,
    Math.ceil(roiSelection.y + roiSelection.height),
  );
  const pixelWidth = x1 - x0;
  const pixelHeight = y1 - y0;

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        {t("roiStats.title")}
      </h2>
      <div className="mb-2 space-y-0.5 text-xs text-gray-400">
        <div>
          {t("roiStats.position")} x: {x0}, y: {y0}
        </div>
        <div>
          {t("roiStats.size")} {pixelWidth} &times; {pixelHeight} px
        </div>
      </div>
      <table className="w-full text-xs text-gray-300">
        <thead>
          <tr className="text-gray-500">
            <th scope="col" className="pb-1 text-left font-normal">
              <span className="sr-only">{t("imageStats.channel")}</span>
            </th>
            <th scope="col" className="pb-1 text-right font-normal">
              {t("imageStats.mean")}
            </th>
            <th scope="col" className="pb-1 text-right font-normal">
              {t("imageStats.median")}
            </th>
            <th scope="col" className="pb-1 text-right font-normal">
              {t("imageStats.stdDev")}
            </th>
          </tr>
        </thead>
        <tbody>
          {(
            [
              { key: "red", label: t("imageStats.red"), color: "text-red-400" },
              {
                key: "green",
                label: t("imageStats.green"),
                color: "text-green-400",
              },
              {
                key: "blue",
                label: t("imageStats.blue"),
                color: "text-blue-400",
              },
              {
                key: "luminance",
                label: t("imageStats.luminance"),
                color: "text-gray-400",
              },
            ] as const
          ).map(({ key, label, color }) => (
            <tr key={key}>
              <th scope="row" className={`py-0.5 font-medium ${color}`}>
                {label}
              </th>
              <td className="py-0.5 text-right">
                {stats[key].mean.toFixed(1)}
              </td>
              <td className="py-0.5 text-right">{stats[key].median}</td>
              <td className="py-0.5 text-right">
                {stats[key].stdDev.toFixed(1)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
