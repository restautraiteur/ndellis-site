import type { CSSProperties } from "react";
import { cn } from "@core/lib/utils";

export function Decoration({
  src,
  className,
  rotate,
}: {
  src: string;
  className: string;
  rotate?: string;
}) {
  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="lazy"
      className={cn(
        "deco-float pointer-events-none absolute select-none drop-shadow-2xl",
        className,
      )}
      style={{ "--deco-rotate": rotate ?? "0deg" } as CSSProperties}
    />
  );
}
