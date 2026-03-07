interface HelpButtonProps {
  onClick: () => void;
}

export function HelpButton({ onClick }: HelpButtonProps) {
  return (
    <button
      onClick={onClick}
      className="rounded px-2 py-1 text-sm text-gray-400 hover:bg-gray-700 hover:text-white"
      aria-label="Toggle keyboard shortcuts help"
      title="Keyboard shortcuts (?)"
    >
      ?
    </button>
  );
}
