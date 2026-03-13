import { Icon } from "./Icon";

interface HelpButtonProps {
  onClick: () => void;
}

export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      className="inline-flex items-center justify-center rounded px-2 py-1 text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
      aria-label="Toggle keyboard shortcuts help"
      title="Keyboard shortcuts (?)"
    >
      <Icon>
        <circle cx="12" cy="12" r="10" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </Icon>
    </button>
  );
}
