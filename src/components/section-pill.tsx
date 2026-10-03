import type { ReactNode } from "react";

export function SectionPill({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex rounded-full border border-border bg-card/80 px-4 py-1.5 text-xs font-semibold text-primary backdrop-blur">
      {children}
    </span>
  );
}
