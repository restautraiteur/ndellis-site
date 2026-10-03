import { useEffect, useRef, useState } from "react";
import { Quote, Star } from "lucide-react";
import { cn } from "@core/lib/utils";
import decoAil from "@/assets/deco-ail.webp";
import decoPoivre from "@/assets/deco-poivre.webp";
import { SectionPill } from "@/components/section-pill";
import { CarouselArrows } from "@/components/carousel-arrows";
import { Decoration } from "@/components/decoration";

// Exemples à remplacer par de vrais avis clients avant la mise en ligne.
const TESTIMONIALS = [
  {
    quote:
      "Le thiéboudienne a le goût de celui de ma grand-mère. Je commande chaque semaine pour le bureau, toujours livré chaud et à l'heure.",
    name: "Awa D.",
    role: "Cliente fidèle",
  },
  {
    quote:
      "Précommander le dimanche pour toute la semaine, c'est un vrai gain de temps. Les portions sont généreuses et le jus de bissap est parfait.",
    name: "Moussa S.",
    role: "Commande chaque semaine",
  },
  {
    quote:
      "Ndelli's Traiteur a géré le buffet du baptême de notre fille : nos invités en parlent encore. Service impeccable du début à la fin.",
    name: "Fatou N.",
    role: "Événement familial",
  },
  {
    quote:
      "Nous faisons livrer nos déjeuners d'équipe chaque vendredi. Des plats variés, élégants, et une organisation sans faute.",
    name: "Ibrahima K.",
    role: "Entreprise à Dakar",
  },
  {
    quote:
      "Le poulet yassa est une merveille et la commande en ligne est très simple, même sans créer de compte. Je recommande !",
    name: "Mariama B.",
    role: "Nouvelle cliente",
  },
];

export function TestimonialsSection() {
  const trackRef = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState({ left: 0, width: 33 });

  const updateThumb = () => {
    const track = trackRef.current;
    if (!track) return;
    const width = Math.min(100, (track.clientWidth / track.scrollWidth) * 100);
    const max = track.scrollWidth - track.clientWidth;
    const progress = max > 0 ? track.scrollLeft / max : 0;
    setThumb({ width, left: progress * (100 - width) });
  };

  useEffect(() => {
    updateThumb();
    window.addEventListener("resize", updateThumb);
    return () => window.removeEventListener("resize", updateThumb);
  }, []);

  const scroll = (direction: "left" | "right") => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + 24 : track.clientWidth * 0.8;
    track.scrollBy({ left: direction === "left" ? -step : step, behavior: "smooth" });
  };

  return (
    <section
      id="temoignages"
      className="relative scroll-mt-24 overflow-hidden bg-cream pb-20 pt-20 md:pb-52"
    >
      <Decoration
        src={decoPoivre}
        className="-right-10 -top-6 hidden w-52 md:block lg:w-64"
        rotate="12deg"
      />
      <Decoration
        src={decoAil}
        className="bottom-6 left-4 hidden w-48 md:block lg:w-56"
        rotate="-10deg"
      />

      <div className="relative mx-auto max-w-6xl px-4">
        <SectionPill>Témoignages clients</SectionPill>
        <h2 className="mt-3 font-display text-4xl font-bold uppercase leading-none tracking-tight text-primary sm:text-6xl">
          Ce que disent nos clients
        </h2>

        <div
          ref={trackRef}
          onScroll={updateThumb}
          className="-mx-4 mt-6 flex snap-x snap-mandatory scroll-px-4 gap-6 overflow-x-auto scroll-smooth px-4 pb-14 pt-6 scrollbar-hide"
        >
          {TESTIMONIALS.map((t, index) => (
            <TestimonialCard key={t.name} testimonial={t} dark={index % 2 === 1} />
          ))}
        </div>

        <div className="-mt-4 flex items-center gap-8">
          <div className="relative h-0.5 flex-1 rounded-full bg-border" aria-hidden="true">
            <span
              className="absolute inset-y-0 rounded-full bg-foreground transition-all duration-300"
              style={{ left: `${thumb.left}%`, width: `${thumb.width}%` }}
            />
          </div>
          <CarouselArrows
            onPrev={() => scroll("left")}
            onNext={() => scroll("right")}
            prevLabel="Témoignage précédent"
            nextLabel="Témoignage suivant"
          />
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({
  testimonial,
  dark,
}: {
  testimonial: (typeof TESTIMONIALS)[number];
  dark: boolean;
}) {
  return (
    <figure
      className={cn(
        "group relative flex min-h-96 w-[85%] shrink-0 snap-start flex-col overflow-hidden rounded-[2rem] p-8 ring-1 transition-all duration-500 hover:-translate-y-2 sm:w-[calc(50%-0.75rem)] lg:w-[calc(33.333%-1rem)]",
        dark
          ? "bg-sidebar text-sidebar-foreground ring-sidebar-foreground/10 shadow-[0_30px_60px_-30px_rgba(40,25,15,0.7)]"
          : "bg-card/80 text-foreground ring-border/70 shadow-[0_30px_60px_-35px_rgba(80,50,25,0.45)] backdrop-blur-xl hover:ring-accent/40",
      )}
    >
      {/* halo orange qui apparaît au survol */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-20 size-56 rounded-full bg-accent/25 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
      />

      <div className="relative flex items-center justify-between gap-3">
        <span className="flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-primary text-accent-foreground shadow-warm transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110">
          <Quote className="size-5 fill-current" aria-hidden="true" />
        </span>
        <span
          className={cn(
            "flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold",
            dark ? "bg-sidebar-foreground/10" : "bg-amber-400/15 text-amber-700",
          )}
          aria-label="Note : 5 sur 5"
        >
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="size-3.5 fill-amber-400 text-amber-400" aria-hidden="true" />
          ))}
          <span className="ml-1">5,0</span>
        </span>
      </div>

      <blockquote
        className={cn(
          "relative mt-8 font-display text-xl leading-snug",
          dark ? "text-sidebar-foreground" : "text-foreground",
        )}
      >
        « {testimonial.quote} »
      </blockquote>

      <figcaption
        className={cn(
          "relative mt-auto flex items-center gap-3 border-t pt-6",
          dark ? "border-sidebar-foreground/15" : "border-border/70",
        )}
      >
        <span className="rounded-full bg-gradient-to-br from-accent via-amber-400 to-primary p-0.5">
          <span
            className={cn(
              "flex size-11 items-center justify-center rounded-full font-display text-lg font-bold",
              dark ? "bg-sidebar text-sidebar-foreground" : "bg-card text-accent",
            )}
          >
            {testimonial.name.slice(0, 1)}
          </span>
        </span>
        <span className="min-w-0">
          <span className="block font-semibold">{testimonial.name}</span>
          <span
            className={cn(
              "block text-sm",
              dark ? "text-sidebar-foreground/65" : "text-muted-foreground",
            )}
          >
            {testimonial.role}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
