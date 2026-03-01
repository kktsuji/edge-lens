import type { ReactNode } from "react";

interface SidebarProps {
  children?: ReactNode;
}

export function Sidebar({ children }: SidebarProps) {
  return (
    <aside className="flex w-72 shrink-0 flex-col gap-4 overflow-y-auto border-l border-gray-700 bg-gray-800 p-4">
      {children}
    </aside>
  );
}
