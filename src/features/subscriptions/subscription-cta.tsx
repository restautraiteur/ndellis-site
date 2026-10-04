import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Check, Truck } from "lucide-react";
import { CLIENT } from "@/config/client";
import { plansQuery } from "@/features/subscriptions/api";
import gourmande from "@/assets/abonnement-gourmande.webp";
import { formatPrice } from "@core/lib/format";

/** Bandeau d'accueil vers l'abonnement : masqué si le module est désactivé ou sans formule. */
export function SubscriptionCta() {
  const { data: plans = [] } = useQuery(plansQuery());
  if (!CLIENT.subscriptions || plans.length === 0) return null;
  const cheapest = Math.min(...plans.map((p) => p.price));
  const cheapestMeal = Math.min(...plans.map((p) => Math.round(p.price / p.meals_count)));
  return (
    <section className="bg-background px-4 pb-10 pt-12 lg:pt-24">
      <div className="relative mx-auto grid max-w-6xl overflow-hidden rounded-[2rem] bg-sidebar text-sidebar-foreground shadow-warm lg:grid-cols-[1.1fr_1fr] lg:overflow-visible">
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
 * Composition : disque orangé et anneau pointillé derrière la cliente, qui déborde au-dessus du
 * bandeau sur grand écran ; deux étiquettes flottantes (semaine cochée, prix par repas).
 */
function Illustration({ cheapestMeal }: { cheapestMeal: number }) {
  return (
    <div className="relative mx-auto mt-6 h-80 w-full max-w-[26rem] sm:h-96 lg:mt-0 lg:h-full lg:max-w-none">
      {/* le disque est coupé par le bas du bandeau, la cliente dépasse par le haut */}
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-0 top-[-2rem] overflow-hidden rounded-b-[2rem] lg:rounded-bl-none"
      >
        <div className="absolute bottom-0 left-1/2 aspect-square w-[88%] max-w-[26rem] -translate-x-1/2 translate-y-[18%] lg:w-[78%]">
          {/* anneau pointillé qui tourne lentement */}
          <div className="absolute -inset-6 animate-[spin_40s_linear_infinite] rounded-full border-2 border-dashed border-accent/40 motion-reduce:animate-none" />
          <div className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_35%_30%,#f6a26b,var(--accent)_55%,#a8431b)] shadow-[0_0_90px_-10px] shadow-accent/60" />
          <div className="absolute inset-[12%] rounded-full border border-white/20" />
        </div>
      </div>

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
