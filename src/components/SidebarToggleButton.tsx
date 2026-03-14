import { useTranslation } from "react-i18next";
import { Icon } from "./Icon";

interface SidebarToggleButtonProps {
  isOpen: boolean;
  onClick: () => void;
}

export function SidebarToggleButton({
  isOpen,
  onClick,
}: SidebarToggleButtonProps) {
  const { t } = useTranslation();
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center min-h-8 min-w-8 rounded px-1 py-0.5 text-sm text-gray-400 hover:bg-gray-700 hover:text-white sm:min-h-10 sm:min-w-10 sm:px-2 sm:py-1 md:hidden"
      aria-label={t("sidebar.toggle")}
      aria-expanded={isOpen}
    >
      <Icon>
        <line x1="3" y1="6" x2="21" y2="6" />
        <line x1="3" y1="12" x2="21" y2="12" />
        <line x1="3" y1="18" x2="21" y2="18" />
      </Icon>
    </button>
  );
}
