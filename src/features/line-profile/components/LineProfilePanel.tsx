import { Suspense, lazy, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useImageStore } from "../../../hooks/useImageStore";
import { sampleLineProfile } from "../../../utils/lineProfile";

const LineProfileChart = lazy(() =>
  import("./LineProfileChart").then((m) => ({ default: m.LineProfileChart })),
);

export function LineProfilePanel() {
  const { t } = useTranslation();
  const { image, lineProfile } = useImageStore();

  const samples = useMemo(() => {
    if (!image.imageData || !lineProfile) return null;
    return sampleLineProfile(image.imageData, lineProfile);
  }, [image.imageData, lineProfile]);

  if (!image.imageData) return null;

  return (
    <div>
      <h2 className="mb-2 text-sm font-semibold text-gray-300">
        {t("lineProfile.title")}
      </h2>
      {samples ? (
        <Suspense
          fallback={<div className="h-40 animate-pulse rounded bg-gray-700" />}
        >
          <LineProfileChart samples={samples} />
        </Suspense>
      ) : (
        <p className="text-xs text-gray-500">{t("lineProfile.placeholder")}</p>
      )}
    </div>
  );
}
