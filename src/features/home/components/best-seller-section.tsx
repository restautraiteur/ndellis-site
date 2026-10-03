import { Link } from "@tanstack/react-router";

import fonioCrevettes from "@/assets/fonio-crevettes.jpg";
import fonioLegumes from "@/assets/fonio-legumes.jpg";
import fonioViande from "@/assets/fonio-viande.jpg";

const QUALITIES = [
  { title: "Sans gluten", text: "Léger et digeste, adapté à toute la famille." },
  { title: "Riche en fibres", text: "Une céréale qui rassasie sans alourdir." },
  { title: "Céréale ancestrale", text: "Cultivée en Afrique de l'Ouest depuis des siècles." },
];

export function BestSellerSection() {
  return (
    <section aria-labelledby="best-seller-title" className="bg-background py-16 sm:py-24">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 md:grid-cols-2 md:gap-16">
        {/* Composition : grande photo en arche + deux petites photos qui la chevauchent */}
        <div className="group relative mx-auto w-full max-w-sm pb-10 pl-8 pr-10 pt-6 sm:max-w-md">
          <div
            aria-hidden="true"
            className="absolute right-0 top-0 size-64 rounded-full border-2 border-dashed border-accent/40 sm:size-80"
          />
          <img
            src={fonioCrevettes}
            alt="Barquettes de fonio aux crevettes et légumes, préparées par Ndelli's Traiteur"
            width={750}
            height={1000}
            loading="lazy"
            className="relative aspect-[4/5] w-full rounded-b-3xl rounded-t-full object-cover shadow-warm"
          />
          <img
            src={fonioLegumes}
            alt="Fonio aux légumes, citron vert et guacamole"
            width={450}
            height={600}
            loading="lazy"
            className="absolute -right-4 top-6 size-40 rounded-full border-[6px] border-background object-cover shadow-warm transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-6 sm:size-52"
          />
          <img
            src={fonioViande}
            alt="Fonio à la viande en sauce et crevettes"
            width={450}
            height={600}
            loading="lazy"
            className="absolute -bottom-4 -left-4 aspect-square w-44 -rotate-6 rounded-3xl border-[6px] border-background object-cover shadow-warm transition-transform duration-500 group-hover:-translate-y-2 group-hover:rotate-0 sm:w-56"
          />
          <span className="absolute bottom-6 right-4 rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground shadow-warm">
            Le plus commandé
          </span>
        </div>

        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-accent">
            Notre best-seller
          </p>
          <h2
            id="best-seller-title"
            className="mt-3 font-display text-5xl font-bold leading-none text-primary sm:text-6xl"
          >
            Le fonio
          </h2>
          <p className="mt-6 max-w-xl text-base leading-7 text-foreground/80">
            Petite graine aux grands pouvoirs, le fonio est le plat que nos clients nous redemandent
            le plus. Cuit à la vapeur pour rester léger et parfumé, il est servi avec une sauce
            généreuse préparée chaque jour dans notre cuisine.
          </p>

          <ul className="mt-8 grid gap-5 sm:grid-cols-3 md:grid-cols-1 lg:grid-cols-3">
            {QUALITIES.map((quality) => (
              <li key={quality.title} className="border-l-2 border-accent pl-4">
                <p className="font-semibold text-primary">{quality.title}</p>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">{quality.text}</p>
              </li>
            ))}
          </ul>

          <Link
            to="/"
            hash="menu"
            className="mt-9 inline-flex h-12 items-center rounded-full bg-primary px-7 text-sm font-semibold text-primary-foreground shadow-warm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Voir le menu de la semaine
          </Link>
        </div>
      </div>
    </section>
  );
}
