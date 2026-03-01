import { useMemo } from "react";
import { useImageStore } from "../../../hooks/useImageStore";
import { computeHistogram } from "../../../utils/histogram";
import type { HistogramData } from "../../../types";

export function useHistogram(): HistogramData | null {
  const { image } = useImageStore();

  return useMemo(() => {
    if (!image.imageData) return null;
    return computeHistogram(image.imageData);
  }, [image.imageData]);
}
