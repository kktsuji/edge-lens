import { useEffect, useState } from "react";
import * as exifr from "exifr";
import { useImageStore } from "../../../hooks/useImageStore";
import type { ExifData } from "../../../types";

export function useExifData(): ExifData | null {
  const { image } = useImageStore();
  const [exifData, setExifData] = useState<ExifData | null>(null);

  useEffect(() => {
    if (!image.file) {
      setExifData(null);
      return;
    }

    // Clear previous EXIF data immediately when a new image is loaded
    setExifData(null);
    let cancelled = false;

    exifr
      .parse(image.file, {
        pick: [
          "Make",
          "Model",
          "LensModel",
          "ExposureTime",
          "FNumber",
          "ISO",
          "FocalLength",
          "DateTimeOriginal",
          "Software",
          "Orientation",
          "ColorSpace",
          "GPSLatitude",
        ],
      })
      .then((raw) => {
        if (cancelled) return;
        if (!raw) {
          setExifData({});
          return;
        }
        setExifData({
          make: raw.Make,
          model: raw.Model,
          lens: raw.LensModel,
          exposureTime: raw.ExposureTime,
          fNumber: raw.FNumber,
          iso: raw.ISO,
          focalLength: raw.FocalLength,
          dateTimeOriginal: raw.DateTimeOriginal,
          software: raw.Software,
          orientation: raw.Orientation,
          colorSpace: raw.ColorSpace,
          hasGps: raw.GPSLatitude != null,
        });
      })
      .catch(() => {
        if (!cancelled) setExifData({});
      });

    return () => {
      cancelled = true;
    };
  }, [image.file]);

  return exifData;
}
