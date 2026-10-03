import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck } from "lucide-react";
import { CLIENT } from "@/config/client";
import { plansQuery } from "@/features/subscriptions/api";
import { formatPrice } from "@core/lib/format";

/** Bandeau d'accueil vers l'abonnement : masqué si le module est désactivé ou sans formule. */
export function SubscriptionCta() {
  const { data: plans = [] } = useQuery(plansQuery());
  if (!CLIENT.subscriptions || plans.length === 0) return null;
  const cheapest = Math.min(...plans.map((p) => p.price));
  return (
    <section className="bg-background px-4 py-10">
      <div className="relative mx-auto flex max-w-6xl flex-col items-start gap-5 overflow-hidden rounded-[2rem] bg-sidebar px-6 py-8 text-sidebar-foreground shadow-warm sm:flex-row sm:items-center sm:justify-between sm:px-10">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -top-24 size-72 rounded-full bg-accent/25 blur-3xl"
        />
        <div className="relative">
          <p className="text-xs font-bold uppercase tracking-widest text-accent">Abonnement</p>
          <h2 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
            Mangez ici toute la semaine
          </h2>
          <p className="mt-1 text-sm text-sidebar-foreground/80">
            Réservez vos repas d'avance, livraison incluse. Formules dès {formatPrice(cheapest)}.
          </p>
        </div>
        <Link
          to="/abonnement"
          className="relative inline-flex h-12 items-center gap-2 rounded-full bg-accent px-6 text-sm font-semibold text-accent-foreground transition-transform hover:scale-105"
        >
          <CalendarCheck className="size-4" /> Voir les formules
        </Link>
      </div>
    </section>
  );
}
