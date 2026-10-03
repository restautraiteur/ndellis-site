import { useRef } from "react";
import type { MenuRow } from "@core/domain/menu/api";
import { ProductCard } from "@/features/menu/components/product-card";
import { CarouselArrows } from "@/components/carousel-arrows";

export function ProductSection({ title, rows }: { title: string; rows: MenuRow[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  if (rows.length === 0) return null;

  const scroll = (direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <section className="mt-10">
      <div className="mb-2 flex items-center justify-between gap-4">
        <h3 className="font-display text-2xl font-bold text-primary">{title}</h3>
        {rows.length > 1 && (
          <CarouselArrows
            size="sm"
            onPrev={() => scroll("left")}
            onNext={() => scroll("right")}
            prevLabel={`${title} : précédents`}
            nextLabel={`${title} : suivants`}
          />
        )}
      </div>
      <div
        ref={trackRef}
        className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto scroll-smooth px-4 pb-8 pt-3 scrollbar-hide"
      >
        {rows.map((row) => (
          <ProductCard key={row.day_product_id} row={row} />
        ))}
      </div>
    </section>
  );
}
