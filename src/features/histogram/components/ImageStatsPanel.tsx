import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { HistogramData } from "../../../types";
import { computeImageStats } from "../../../utils/histogram";

interface ImageStatsPanelProps {
  data: HistogramData | null;
}

export function ImageStatsPanel({ data }: ImageStatsPanelProps) {
  const { t } = useTranslation();
  const stats = useMemo(() => (data ? computeImageStats(data) : null), [data]);

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        {t("imageStats.title")}
      </h2>
      {stats ? (
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
                {
                  key: "red",
                  label: t("imageStats.red"),
                  color: "text-red-400",
                },
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
                <th scope="row" className={`py-0.5 font-medium ${color}`}>{label}</th>
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
      ) : (
        <p className="text-xs text-gray-500">{t("imageStats.placeholder")}</p>
      )}
    </div>
  );
}
