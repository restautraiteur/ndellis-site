import { ArrowDown, MessageCircle } from "lucide-react";

import heroImage from "@/assets/plats-traiteur-header.webp";
import heroImageMobile from "@/assets/plats-traiteur-header-mobile.webp";

// Chiffres clés fournis par Ndelli's Traiteur.
const STATS = [
  { value: "10k+", label: "Plats livrés" },
  { value: "5 000+", label: "Clients satisfaits" },
  { value: "2019", label: "Au service de Dakar depuis" },
];

/** Bannière d'accueil : titre centré sur la photo des plats (variante de `hero.tsx`). */
export function HeroShowcase() {
  return (
    <section className="relative overflow-hidden border-b border-border/70 bg-sidebar pb-24 pt-36 text-sidebar-foreground sm:pb-32 sm:pt-44">
      <img
        src={heroImage}
        srcSet={`${heroImageMobile} 960w, ${heroImage} 1920w`}
        sizes="100vw"
        alt=""
        aria-hidden="true"
        width={1920}
        height={714}
        fetchPriority="high"
        className="absolute inset-0 size-full object-cover"
      />
      {/* voile sombre pour la lisibilité du titre centré */}
      <div className="absolute inset-0 bg-gradient-to-r from-sidebar/95 via-sidebar/85 to-sidebar/70" />

      <div className="relative mx-auto max-w-4xl px-4 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-sidebar-foreground/15 bg-sidebar-foreground/5 px-4 py-1.5 text-xs font-semibold text-sidebar-foreground/85 backdrop-blur">
          <span className="size-2 rounded-full bg-accent" />
          Précommandes du lundi au vendredi · Livraison à Dakar
        </span>
        <h1 className="mt-5 font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
          Le goût de la maison,
          <span className="block italic text-accent">préparé chaque jour.</span>
        </h1>
        <p className="mx-auto mt-5 max-w-xl text-sm leading-6 text-sidebar-foreground/80 sm:text-base">
          Découvrez le menu de la semaine et réservez vos plats et jus frais avant l'heure limite.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#menu"
            className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3 text-sm font-semibold uppercase tracking-wide text-accent-foreground shadow-warm transition-transform hover:scale-105"
          >
            Voir le menu <ArrowDown className="size-4" aria-hidden="true" />
          </a>
          <a
            href="#traiteur"
            className="inline-flex items-center gap-2 rounded-full bg-sidebar-foreground px-7 py-3 text-sm font-semibold uppercase tracking-wide text-sidebar transition-transform hover:scale-105"
          >
            <MessageCircle className="size-4" aria-hidden="true" /> Devis traiteur
          </a>
        </div>

        <dl className="mx-auto mt-12 grid max-w-2xl grid-cols-3 divide-x divide-sidebar-foreground/15">
          {STATS.map((stat) => (
            <div key={stat.label} className="px-2 sm:px-6">
              <dt className="sr-only">{stat.label}</dt>
              <dd className="font-display text-3xl font-bold text-sidebar-foreground sm:text-5xl">
                {stat.value}
              </dd>
              <dd className="mt-1 text-xs text-sidebar-foreground/70 sm:text-sm">{stat.label}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
