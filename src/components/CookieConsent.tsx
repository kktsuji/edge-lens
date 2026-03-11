import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { initGA4 } from "../utils/analytics";
import { safeGetItem, safeSetItem } from "../utils/storage";

const STORAGE_KEY = "edgelens-cookie-consent";

export function CookieConsent() {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = safeGetItem(STORAGE_KEY);
    if (stored === "accepted") {
      initGA4();
    } else if (stored === null) {
      setVisible(true);
    }
  }, []);

  const handleAccept = () => {
    safeSetItem(STORAGE_KEY, "accepted");
    initGA4();
    setVisible(false);
  };

  const handleDecline = () => {
    safeSetItem(STORAGE_KEY, "declined");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gray-700 bg-gray-800 px-4 py-3">
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
        <p className="text-sm text-gray-300">{t("cookie.message")}</p>
        <div className="flex shrink-0 gap-2">
          <button
            onClick={handleDecline}
            className="rounded border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:bg-gray-700"
          >
            {t("cookie.decline")}
          </button>
          <button
            onClick={handleAccept}
            className="rounded bg-blue-600 px-3 py-1 text-sm text-white hover:bg-blue-500"
          >
            {t("cookie.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
