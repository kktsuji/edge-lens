import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import type { HistogramData } from "../../../types";

const HistogramChart = lazy(() =>
  import("./HistogramChart").then((m) => ({ default: m.HistogramChart })),
);

interface HistogramPanelProps {
  data: HistogramData | null;
}

export function HistogramPanel({ data }: HistogramPanelProps) {
  const { t } = useTranslation();

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        {t("histogram.title")}
      </h2>
      {data ? (
        <Suspense
          fallback={<div className="h-40 animate-pulse rounded bg-gray-700" />}
        >
          <HistogramChart data={data} />
        </Suspense>
      ) : (
        <p className="text-xs text-gray-400">{t("histogram.placeholder")}</p>
      )}
    </div>
  );
}
