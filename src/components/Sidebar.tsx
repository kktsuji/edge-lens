import type { ReactNode } from "react";

interface SidebarProps {
  children?: ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}

export function Sidebar({ children, isOpen, onToggle }: SidebarProps) {
  return (
    <>
      {/* Backdrop overlay on mobile when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar — always visible on md+, slide-in overlay on small screens */}
      <aside
        className={`
          flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-gray-700 bg-gray-800 p-4
          max-md:fixed max-md:right-0 max-md:top-12 max-md:bottom-0 max-md:z-40 max-md:transition-transform max-md:duration-200
          ${isOpen ? "max-md:translate-x-0" : "max-md:translate-x-full"}
        `}
      >
        {children}
      </aside>
    </>
  );
}
