import { ArrowLeft, ArrowRight } from "lucide-react";
import { cn } from "@core/lib/utils";

export function CarouselArrows({
  onPrev,
  onNext,
  prevLabel,
  nextLabel,
  size = "md",
}: {
  onPrev: () => void;
  onNext: () => void;
  prevLabel: string;
  nextLabel: string;
  size?: "sm" | "md";
}) {
  const base = cn(
    "flex items-center justify-center rounded-full transition-all duration-300 hover:scale-105",
    size === "md" ? "size-14" : "size-10",
  );
  const icon = size === "md" ? "size-5" : "size-4";
  return (
    <div className="flex shrink-0 gap-3">
      <button
        type="button"
        onClick={onPrev}
        aria-label={prevLabel}
        title={prevLabel}
        className={cn(base, "border border-foreground/70 text-foreground hover:bg-foreground/5")}
      >
        <ArrowLeft className={icon} />
      </button>
      <button
        type="button"
        onClick={onNext}
        aria-label={nextLabel}
        title={nextLabel}
        className={cn(
          base,
          "bg-sidebar text-sidebar-foreground hover:bg-accent hover:text-accent-foreground",
        )}
      >
        <ArrowRight className={icon} />
      </button>
    </div>
  );
}
