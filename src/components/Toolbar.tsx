import type { ReactNode } from "react";

interface ToolbarProps {
  children?: ReactNode;
}

export function Toolbar({ children }: ToolbarProps) {
  return (
    <nav className="flex min-h-12 shrink-0 items-center gap-1 overflow-x-auto border-b border-gray-700 bg-gray-800 px-2 sm:gap-2 sm:px-4">
      <span className="text-sm font-semibold tracking-wide text-gray-200">
        EdgeLens
      </span>
      <div className="mx-2 h-5 w-px bg-gray-600" />
      {children}
    </nav>
  );
}
