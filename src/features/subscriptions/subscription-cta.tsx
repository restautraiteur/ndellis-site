import { useEffect, useRef } from "react";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Check, Truck } from "lucide-react";
import { CLIENT } from "@/config/client";
import { plansQuery } from "@/features/subscriptions/api";
import gourmande from "@/assets/abonnement-gourmande.webp";
import { formatPrice } from "@core/lib/format";

/**
 * Bandeau d'accueil vers l'abonnement, à cheval entre le menu de la semaine et les jus.
 * Masqué si le module est désactivé ou sans formule.
 */
export function SubscriptionCta() {
  const { data: plans = [] } = useQuery(plansQuery());
  const cardRef = useRef<HTMLDivElement>(null);
  const visible = CLIENT.subscriptions && plans.length > 0;

  // Moitié sur le menu, moitié sur les jus : le chevauchement vaut la moitié de la hauteur du
  // bandeau (qui change selon l'écran). La section des jus lit --abo-overlap pour réserver la place.
  useEffect(() => {
    const card = cardRef.current;
    if (!visible || !card) return;
    const root = document.documentElement;
    const update = () => root.style.setProperty("--abo-overlap", `${card.offsetHeight / 2}px`);
    update();
    const observer = new ResizeObserver(update);
    observer.observe(card);
    return () => {
      observer.disconnect();
      root.style.removeProperty("--abo-overlap");
    };
  }, [visible]);

  if (!visible) return null;
  const cheapest = Math.min(...plans.map((p) => p.price));
  const cheapestMeal = Math.min(...plans.map((p) => Math.round(p.price / p.meals_count)));
  return (
    // « abo-cta » : la section des jus réserve la place du bandeau qui la chevauche.
    <section className="abo-cta relative z-20 mb-[calc(var(--abo-overlap,10rem)*-1)] mt-2 px-4 lg:mt-0 lg:pt-16">
      <div
        ref={cardRef}
        className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-sidebar text-sidebar-foreground shadow-warm lg:grid-cols-[1.1fr_1fr] lg:overflow-visible"
      >
        {/* fond graphique : halo et motif de points, rognés aux coins arrondis */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]"
        >
          <div className="absolute -left-24 -top-24 size-72 rounded-full bg-accent/15 blur-3xl" />
          <div
            className="absolute bottom-0 right-0 h-2/3 w-1/2 opacity-[0.12]"
            style={{
              backgroundImage: "radial-gradient(currentColor 1.5px, transparent 1.5px)",
              backgroundSize: "18px 18px",
            }}
          />
        </div>

        <div className="relative flex flex-col gap-5 px-6 pt-10 sm:px-10 lg:py-16">
          <p className="inline-flex w-fit items-center gap-2 rounded-full bg-accent/15 px-3 py-1 text-xs font-bold uppercase tracking-widest text-accent">
            <CalendarCheck className="size-3.5" /> Abonnement
          </p>
          <h2 className="font-display text-3xl font-bold leading-tight sm:text-4xl">
            Votre déjeuner de la semaine, <span className="text-accent">réglé d'avance</span>
          </h2>
          <p className="max-w-md text-sm text-sidebar-foreground/80 sm:text-base">
            Chaque midi, choisissez le plat du jour qui vous tente et entrez votre code : il est
            compté sur votre abonnement, livraison incluse.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link
              to="/abonnement"
              className="inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
            >
              Découvrir l'abonnement
            </Link>
            <span className="text-sm text-sidebar-foreground/70">
              à partir de{" "}
              <strong className="text-sidebar-foreground">{formatPrice(cheapest)}</strong>
            </span>
          </div>
        </div>

        <Illustration cheapestMeal={cheapestMeal} />
      </div>
    </section>
  );
}

/**
 * Composition : la cliente, qui déborde au-dessus du
 * bandeau sur grand écran ; deux étiquettes flottantes (semaine cochée, prix par repas).
 */
function Illustration({ cheapestMeal }: { cheapestMeal: number }) {
  return (
    <div className="relative mx-auto mt-6 h-80 w-full max-w-[26rem] sm:h-96 lg:mt-0 lg:h-full lg:max-w-none">
      <img
        src={gourmande}
        alt="Une cliente savoure son repas d'abonnement livré en barquette, avec un jus frais"
        loading="lazy"
        width={900}
        height={888}
        className="pointer-events-none absolute bottom-0 left-1/2 h-full w-auto max-w-none -translate-x-1/2 select-none drop-shadow-[0_18px_28px_rgba(0,0,0,0.45)] lg:h-[118%]"
      />

      {/* étiquette « Ma semaine » */}
      <div className="deco-float absolute left-2 top-6 w-36 rounded-2xl bg-card p-3 text-foreground shadow-xl sm:left-0 lg:left-auto lg:-right-6 lg:top-[22%]">
        <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Ma semaine
        </p>
        <ul className="mt-2 space-y-1 text-xs">
          {["Lundi", "Mardi", "Mercredi"].map((day) => (
            <li key={day} className="flex items-center justify-between">
              {day}
              <Check className="size-4 rounded-full bg-success p-0.5 text-white" />
            </li>
          ))}
          <li className="flex items-center justify-between text-muted-foreground">
            Jeudi <span className="size-4 rounded-full border-2 border-dashed border-border" />
          </li>
        </ul>
      </div>

      {/* étiquette prix par repas */}
      <div className="absolute bottom-8 right-2 flex items-center gap-2 rounded-full bg-card py-1.5 pl-1.5 pr-4 text-foreground shadow-xl sm:right-0 lg:-right-4 lg:bottom-12">
        <span className="flex size-9 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <Truck className="size-4" />
        </span>
        <span className="text-xs leading-tight">
          <span className="block font-bold">{formatPrice(cheapestMeal)}</span>
          <span className="text-muted-foreground">le repas, livré</span>
        </span>
      </div>
    </div>
  );
}
