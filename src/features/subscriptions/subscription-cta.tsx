import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck } from "lucide-react";
import { CLIENT } from "@/config/client";
import { plansQuery } from "@/features/subscriptions/api";
import gourmande from "@/assets/abonnement-gourmande.webp";
import { formatPrice } from "@core/lib/format";

/** Bandeau d'accueil vers l'abonnement : masqué si le module est désactivé ou sans formule. */
export function SubscriptionCta() {
  const { data: plans = [] } = useQuery(plansQuery());
  if (!CLIENT.subscriptions || plans.length === 0) return null;
  const cheapest = Math.min(...plans.map((p) => p.price));
  return (
    <section className="bg-background px-4 pb-10 pt-16 sm:pt-24">
      <div className="relative mx-auto max-w-6xl rounded-[2rem] bg-sidebar text-sidebar-foreground shadow-warm">
        {/* halo décoratif, rogné aux coins arrondis (l'illustration, elle, dépasse du bandeau) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-[2rem]"
        >
          <div className="absolute -right-10 -top-24 size-80 rounded-full bg-accent/30 blur-3xl" />
        </div>

        <div className="relative flex flex-col gap-5 px-6 pt-8 sm:px-10 lg:w-[58%] lg:py-14">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Abonnement</p>
          <h2 className="font-display text-2xl font-bold leading-tight sm:text-4xl">
            Votre déjeuner de la semaine, <span className="text-accent">réglé d'avance</span>
          </h2>
          <p className="text-sm text-sidebar-foreground/80 sm:text-base">
            Chaque midi, choisissez le plat du jour qui vous tente et entrez votre code : il est
            compté sur votre abonnement, livraison incluse. À partir de {formatPrice(cheapest)}.
          </p>
          <Link
            to="/abonnement"
            className="inline-flex h-12 w-fit items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
          >
            <CalendarCheck className="size-4" /> Découvrir l'abonnement
          </Link>
        </div>

        {/* Mobile : sous le texte, posée sur le bas du bandeau. Grand écran : à droite, déborde en haut. */}
        <img
          src={gourmande}
          alt="Une cliente savoure son repas d'abonnement livré en barquette, avec un jus frais"
          loading="lazy"
          width={900}
          height={888}
          className="pointer-events-none relative mx-auto -mb-px block mt-4 w-72 select-none drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)] sm:w-96 lg:absolute lg:bottom-0 lg:right-6 lg:mt-0 lg:h-[125%] lg:w-auto lg:max-w-none xl:right-12"
        />
      </div>
    </section>
  );
}
