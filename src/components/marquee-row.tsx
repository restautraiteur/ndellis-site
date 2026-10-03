import type { CSSProperties } from "react";
import { cn } from "@core/lib/utils";

export function MarqueeRow({
  duration,
  reverse = false,
  children,
}: {
  duration: string;
  reverse?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("marquee-row", reverse && "marquee-row-reverse")}>
      <div
        className="marquee-track flex w-max"
        style={{ "--marquee-duration": duration } as CSSProperties}
      >
        <div className="flex gap-4 pr-4">{children}</div>
        <div className="flex gap-4 pr-4" aria-hidden="true">
          {children}
        </div>
      </div>
    </div>
  );
}
